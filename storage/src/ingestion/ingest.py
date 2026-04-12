"""
ingest.py — Reads Project 1 response JSONs and Project 2 analysis JSONs,
then upserts everything into the database.

Idempotent: safe to re-run; existing records are skipped by record_id.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import select

from src.models import Prompt, Response, Score, Mention

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Prompt bank sync
# ---------------------------------------------------------------------------

def sync_prompts(prompts_json: str | Path, db: Session) -> dict[str, int]:
    """
    Upsert prompts from the prompt bank JSON.
    Returns a mapping of prompt_id → DB primary key.
    """
    with open(prompts_json) as f:
        data = json.load(f)

    id_map: dict[str, int] = {}
    for p in data["prompts"]:
        existing = db.scalar(select(Prompt).where(Prompt.prompt_id == p["id"]))
        if not existing:
            row = Prompt(prompt_id=p["id"], category=p["category"], text=p["text"])
            db.add(row)
            db.flush()
            existing = row
            log.debug(f"  + prompt {p['id']}")
        id_map[p["id"]] = existing.id

    db.commit()
    log.info(f"Prompts synced: {len(id_map)} in DB")
    return id_map


# ---------------------------------------------------------------------------
# Response ingestion (Project 1 JSONs)
# ---------------------------------------------------------------------------

def ingest_response(record: dict, prompt_pk: int, db: Session) -> Response | None:
    """
    Insert a single response record. Returns None if already present.
    """
    existing = db.scalar(select(Response).where(Response.record_id == record["record_id"]))
    if existing:
        return None  # idempotent — skip

    collected_at = datetime.fromisoformat(record["timestamp"])
    row = Response(
        record_id=record["record_id"],
        run_id=record["run_id"],
        prompt_id=prompt_pk,
        model=record["model"],
        response_text=record["response_text"],
        latency_ms=record.get("latency_ms"),
        input_tokens=record.get("input_tokens"),
        output_tokens=record.get("output_tokens"),
        collected_at=collected_at,
    )
    db.add(row)
    db.flush()  # get the PK without committing
    return row


# ---------------------------------------------------------------------------
# Analysis ingestion (Project 2 JSONs)
# ---------------------------------------------------------------------------

def ingest_analysis(analysis: dict, response_pk: int, db: Session) -> int:
    """
    Insert Score + Mention rows for one analysis result.
    Returns number of brand scores inserted.
    """
    count = 0
    for brand_data in analysis.get("brands", []):
        # Score row
        score = Score(
            response_id=response_pk,
            brand=brand_data["brand"],
            mentioned=brand_data["mentioned"],
            mention_count=brand_data["mention_count"],
            first_mention_rank=brand_data.get("first_mention_rank"),
            position_score=brand_data["position_score"],
            avg_sentiment=brand_data["avg_sentiment"],
            sentiment_label=brand_data["sentiment_label"],
        )
        db.add(score)

        # Mention rows
        for m in brand_data.get("mentions", []):
            mention = Mention(
                response_id=response_pk,
                brand=brand_data["brand"],
                matched_text=m.get("matched_text"),
                method=m.get("method", "keyword"),
                sentence=m.get("sentence"),
                sentence_index=m.get("sentence_index"),
                char_offset=m.get("char_offset"),
                sentiment=m.get("sentiment", 0.0),
                sentiment_label=m.get("sentiment_label", "neutral"),
            )
            db.add(mention)

        count += 1
    return count


# ---------------------------------------------------------------------------
# Batch runner
# ---------------------------------------------------------------------------

def run_ingestion(
    responses_dir: str | Path,
    analysis_dir: str | Path,
    prompts_json: str | Path,
    db: Session,
) -> dict:
    """
    Full ingestion pipeline:
    1. Sync prompt bank
    2. For each Project 1 response JSON, insert the response row
    3. Find its matching Project 2 analysis JSON and insert scores + mentions
    """
    responses_path = Path(responses_dir)
    analysis_path  = Path(analysis_dir)

    # Step 1: prompts
    prompt_map = sync_prompts(prompts_json, db)

    response_files = sorted(responses_path.glob("*.json"))
    log.info(f"Found {len(response_files)} response file(s) to ingest")

    new_responses = 0
    new_scores    = 0
    skipped       = 0

    for rf in response_files:
        record = json.loads(rf.read_text())
        prompt_pk = prompt_map.get(record["prompt_id"])

        if prompt_pk is None:
            log.warning(f"  Unknown prompt_id {record['prompt_id']} — skipping")
            continue

        # Step 2: response
        response_row = ingest_response(record, prompt_pk, db)
        if response_row is None:
            skipped += 1
            continue

        new_responses += 1

        # Step 3: find matching analysis file
        analysis_file = analysis_path / f"{record['record_id']}_analysis.json"
        if analysis_file.exists():
            analysis = json.loads(analysis_file.read_text())
            n = ingest_analysis(analysis, response_row.id, db)
            new_scores += n
            log.info(f"  ✓ {record['record_id'][:8]} — {n} brands scored")
        else:
            log.warning(f"  ⚠ No analysis file for {record['record_id'][:8]}")

        db.commit()

    summary = {
        "new_responses": new_responses,
        "new_scores":    new_scores,
        "skipped":       skipped,
    }
    log.info(f"Ingestion complete: {summary}")
    return summary
