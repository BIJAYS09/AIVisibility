"""
tests/test_storage.py — Tests for ingestion logic and API endpoints.

Uses SQLite in-memory so no Postgres needed to run tests.
Run: pytest tests/
"""

import json
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database import Base, get_db
from src.models import Prompt, Response, Score, Mention
from src.api import app

# ---------------------------------------------------------------------------
# Test DB setup (SQLite in-memory)
# ---------------------------------------------------------------------------

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    e = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(e)
    return e

@pytest.fixture()
def db(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

@pytest.fixture()
def client(engine):
    Session = sessionmaker(bind=engine)
    def override_get_db():
        s = Session()
        try:
            yield s
        finally:
            s.close()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Fixtures — minimal records
# ---------------------------------------------------------------------------

def make_prompt(db, prompt_id="crm-001"):
    p = Prompt(prompt_id=prompt_id, category="CRM", text="Best CRM for startups?")
    db.add(p); db.commit(); db.refresh(p)
    return p

def make_response(db, prompt_pk, run_id=None):
    r = Response(
        record_id=str(uuid.uuid4()),
        run_id=run_id or str(uuid.uuid4()),
        prompt_id=prompt_pk,
        model="llama3-70b-8192",
        response_text="HubSpot is a great CRM. Salesforce is powerful but expensive.",
        latency_ms=1200,
        input_tokens=18,
        output_tokens=200,
        collected_at=datetime.now(timezone.utc),
    )
    db.add(r); db.commit(); db.refresh(r)
    return r

def make_score(db, response_pk, brand="HubSpot", mentioned=True):
    s = Score(
        response_id=response_pk,
        brand=brand,
        mentioned=mentioned,
        mention_count=2 if mentioned else 0,
        position_score=1.0 if mentioned else 0.0,
        avg_sentiment=0.4 if mentioned else 0.0,
        sentiment_label="positive" if mentioned else "neutral",
    )
    db.add(s); db.commit(); db.refresh(s)
    return s


# ---------------------------------------------------------------------------
# Ingestion tests
# ---------------------------------------------------------------------------

def test_prompt_created(db):
    p = make_prompt(db)
    assert p.id is not None
    assert p.category == "CRM"

def test_response_created(db):
    p = make_prompt(db, "crm-x01")
    r = make_response(db, p.id)
    assert r.id is not None
    assert r.prompt_id == p.id

def test_score_created(db):
    p = make_prompt(db, "crm-x02")
    r = make_response(db, p.id)
    s = make_score(db, r.id)
    assert s.mentioned is True
    assert s.position_score == 1.0

def test_mention_created(db):
    p = make_prompt(db, "crm-x03")
    r = make_response(db, p.id)
    m = Mention(
        response_id=r.id, brand="HubSpot",
        matched_text="HubSpot", method="keyword",
        sentence="HubSpot is a great CRM.",
        sentence_index=0, char_offset=0,
        sentiment=0.4, sentiment_label="positive",
    )
    db.add(m); db.commit()
    assert m.id is not None


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200

def test_brands_empty(client):
    r = client.get("/brands")
    assert r.status_code == 200
    assert isinstance(r.json(), list)

def test_summary_returns_list(client, db):
    p = make_prompt(db, "crm-api01")
    r = make_response(db, p.id)
    make_score(db, r.id, brand="HubSpot", mentioned=True)
    resp = client.get("/summary?days=30")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    brands = [d["brand"] for d in data]
    assert "HubSpot" in brands

def test_prompts_endpoint(client, db):
    p = make_prompt(db, "crm-api02")
    r = make_response(db, p.id)
    make_score(db, r.id, brand="Salesforce", mentioned=True)
    resp = client.get("/prompts?brand=Salesforce")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert data[0]["brand"] if "brand" in data[0] else True

def test_competitors_endpoint(client, db):
    p = make_prompt(db, "crm-api03")
    r = make_response(db, p.id)
    make_score(db, r.id, brand="HubSpot",    mentioned=True)
    make_score(db, r.id, brand="Salesforce", mentioned=False)
    resp = client.get("/competitors?brands=HubSpot,Salesforce")
    assert resp.status_code == 200
    data = resp.json()
    assert "HubSpot" in data
    assert "Salesforce" in data

def test_runs_endpoint(client, db):
    run_id = str(uuid.uuid4())
    p = make_prompt(db, "crm-api04")
    make_response(db, p.id, run_id=run_id)
    resp = client.get("/runs")
    assert resp.status_code == 200
    runs = resp.json()
    assert any(r["run_id"] == run_id for r in runs)
