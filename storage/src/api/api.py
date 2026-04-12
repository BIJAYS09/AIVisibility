"""
api.py — FastAPI REST API exposing data for Project 4's dashboard.

Endpoints:
  GET /health
  GET /brands                          — list tracked brands
  GET /scores?brand=X&days=30          — time-series visibility data
  GET /summary?days=30                 — all-brands aggregated stats
  GET /prompts?brand=X&mentioned=true  — prompt-level breakdown table
  GET /competitors?brand=X&days=30     — competitor comparison
  GET /runs                            — recent collection runs
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Prompt, Response, Score, Mention

app = FastAPI(
    title="Peec Storage API",
    version="1.0.0",
    description="Brand visibility data for the Peec dashboard",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _since(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(select(func.now()))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}


# ---------------------------------------------------------------------------
# Brands
# ---------------------------------------------------------------------------

@app.get("/brands")
def list_brands(db: Session = Depends(get_db)) -> list[str]:
    """Return all distinct brands that have been scored."""
    rows = db.scalars(select(Score.brand).distinct().order_by(Score.brand)).all()
    return list(rows)


# ---------------------------------------------------------------------------
# Scores — time-series visibility
# ---------------------------------------------------------------------------

@app.get("/scores")
def get_scores(
    brand: str,
    days:  int = Query(30, ge=1, le=365),
    db:    Session = Depends(get_db),
):
    """
    Daily visibility metrics for one brand over the last N days.
    Returns a list of daily data points for the trend chart.
    """
    since = _since(days)

    rows = (
        db.execute(
            select(
                func.date_trunc("day", Response.collected_at).label("day"),
                func.count(Score.id).label("total"),
                func.sum(Score.mentioned.cast(Integer_type())).label("mentioned"),
                func.avg(Score.position_score).label("avg_position"),
                func.avg(Score.avg_sentiment).label("avg_sentiment"),
            )
            .join(Response, Score.response_id == Response.id)
            .where(Score.brand == brand)
            .where(Response.collected_at >= since)
            .group_by("day")
            .order_by("day")
        )
        .mappings()
        .all()
    )

    return [
        {
            "date":          str(r["day"])[:10],
            "total_prompts": r["total"],
            "mentioned":     r["mentioned"] or 0,
            "mention_rate":  round((r["mentioned"] or 0) / r["total"] * 100, 1),
            "avg_position":  round(r["avg_position"] or 0, 3),
            "avg_sentiment": round(r["avg_sentiment"] or 0, 4),
        }
        for r in rows
    ]


# workaround for SQLAlchemy Integer cast inside query
def Integer_type():
    from sqlalchemy import Integer
    return Integer


# ---------------------------------------------------------------------------
# Summary — all brands at a glance
# ---------------------------------------------------------------------------

@app.get("/summary")
def get_summary(
    days: int = Query(30, ge=1, le=365),
    db:   Session = Depends(get_db),
):
    """
    Aggregated stats for every tracked brand over the last N days.
    Used for the main dashboard overview cards.
    """
    since = _since(days)

    rows = (
        db.execute(
            select(
                Score.brand,
                func.count(Score.id).label("total"),
                func.sum(Score.mentioned.cast(Integer_type())).label("mentioned"),
                func.avg(Score.position_score).label("avg_position"),
                func.avg(Score.avg_sentiment).label("avg_sentiment"),
                func.sum(Score.mention_count).label("total_mentions"),
            )
            .join(Response, Score.response_id == Response.id)
            .where(Response.collected_at >= since)
            .group_by(Score.brand)
            .order_by(func.avg(Score.position_score).desc())
        )
        .mappings()
        .all()
    )

    return [
        {
            "brand":         r["brand"],
            "total_prompts": r["total"],
            "mentioned_in":  r["mentioned"] or 0,
            "mention_rate":  round((r["mentioned"] or 0) / r["total"] * 100, 1),
            "avg_position":  round(r["avg_position"] or 0, 3),
            "avg_sentiment": round(r["avg_sentiment"] or 0, 4),
            "total_mentions": r["total_mentions"] or 0,
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Prompts — per-prompt breakdown table
# ---------------------------------------------------------------------------

@app.get("/prompts")
def get_prompt_breakdown(
    brand:     str,
    days:      int  = Query(30, ge=1, le=365),
    mentioned: Optional[bool] = None,
    category:  Optional[str]  = None,
    limit:     int  = Query(50, ge=1, le=200),
    db:        Session = Depends(get_db),
):
    """
    Row-per-prompt table showing visibility for one brand.
    Filterable by mentioned/not-mentioned and category.
    """
    since = _since(days)

    q = (
        select(
            Prompt.prompt_id,
            Prompt.category,
            Prompt.text.label("prompt_text"),
            Response.model,
            Response.collected_at,
            Score.mentioned,
            Score.mention_count,
            Score.position_score,
            Score.avg_sentiment,
            Score.sentiment_label,
        )
        .join(Response,  Score.response_id  == Response.id)
        .join(Prompt,    Response.prompt_id == Prompt.id)
        .where(Score.brand == brand)
        .where(Response.collected_at >= since)
        .order_by(Response.collected_at.desc())
        .limit(limit)
    )

    if mentioned is not None:
        q = q.where(Score.mentioned == mentioned)
    if category:
        q = q.where(Prompt.category == category)

    rows = db.execute(q).mappings().all()

    return [
        {
            "prompt_id":      r["prompt_id"],
            "category":       r["category"],
            "prompt_text":    r["prompt_text"],
            "model":          r["model"],
            "collected_at":   r["collected_at"].isoformat(),
            "mentioned":      r["mentioned"],
            "mention_count":  r["mention_count"],
            "position_score": round(r["position_score"], 2),
            "avg_sentiment":  round(r["avg_sentiment"], 4),
            "sentiment_label": r["sentiment_label"],
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Competitors — side-by-side comparison
# ---------------------------------------------------------------------------

@app.get("/competitors")
def get_competitor_comparison(
    brands: str = Query(..., description="Comma-separated brand names"),
    days:   int = Query(30, ge=1, le=365),
    db:     Session = Depends(get_db),
):
    """
    Compare multiple brands side-by-side.
    ?brands=YourBrand,HubSpot,Salesforce
    """
    brand_list = [b.strip() for b in brands.split(",") if b.strip()]
    since = _since(days)

    rows = (
        db.execute(
            select(
                Score.brand,
                Prompt.category,
                func.count(Score.id).label("total"),
                func.sum(Score.mentioned.cast(Integer_type())).label("mentioned"),
                func.avg(Score.position_score).label("avg_position"),
                func.avg(Score.avg_sentiment).label("avg_sentiment"),
            )
            .join(Response, Score.response_id == Response.id)
            .join(Prompt,   Response.prompt_id == Prompt.id)
            .where(Score.brand.in_(brand_list))
            .where(Response.collected_at >= since)
            .group_by(Score.brand, Prompt.category)
            .order_by(Score.brand, Prompt.category)
        )
        .mappings()
        .all()
    )

    # Pivot: { brand: { category: stats } }
    result: dict = {b: {} for b in brand_list}
    for r in rows:
        result[r["brand"]][r["category"]] = {
            "total":        r["total"],
            "mentioned":    r["mentioned"] or 0,
            "mention_rate": round((r["mentioned"] or 0) / r["total"] * 100, 1),
            "avg_position": round(r["avg_position"] or 0, 3),
            "avg_sentiment": round(r["avg_sentiment"] or 0, 4),
        }

    return result


# ---------------------------------------------------------------------------
# Runs — recent collection run history
# ---------------------------------------------------------------------------

@app.get("/runs")
def get_runs(
    limit: int = Query(10, ge=1, le=50),
    db:    Session = Depends(get_db),
):
    """List recent collection runs with response + mention counts."""
    rows = (
        db.execute(
            select(
                Response.run_id,
                func.min(Response.collected_at).label("started_at"),
                func.max(Response.collected_at).label("finished_at"),
                func.count(Response.id).label("response_count"),
                func.avg(Response.latency_ms).label("avg_latency_ms"),
            )
            .group_by(Response.run_id)
            .order_by(func.min(Response.collected_at).desc())
            .limit(limit)
        )
        .mappings()
        .all()
    )

    return [
        {
            "run_id":         r["run_id"],
            "started_at":     r["started_at"].isoformat(),
            "finished_at":    r["finished_at"].isoformat(),
            "response_count": r["response_count"],
            "avg_latency_ms": round(r["avg_latency_ms"] or 0),
        }
        for r in rows
    ]
