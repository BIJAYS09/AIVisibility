"""
pipeline.py — Orchestrates brand detection across all collected records.

Reads JSON files from Project 1's data/responses/ directory,
runs the detector over each, and saves analysis results to data/results/.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .detector import detect_brand, AnalysisResult

log = logging.getLogger(__name__)


def load_brand_config(path: str | Path) -> dict:
    with open(path) as f:
        return json.load(f)


def load_records(responses_dir: str | Path) -> list[dict]:
    p = Path(responses_dir)
    files = sorted(p.glob("*.json"), key=lambda f: f.stat().st_mtime)
    records = [json.loads(f.read_text()) for f in files]
    log.info(f"Loaded {len(records)} records from {p}")
    return records


def save_result(result: AnalysisResult, results_dir: Path) -> Path:
    results_dir.mkdir(parents=True, exist_ok=True)
    out = results_dir / f"{result.record_id}_analysis.json"
    with open(out, "w") as f:
        json.dump(result.to_dict(), f, indent=2)
    return out


def run_pipeline(
    responses_dir: str | Path,
    brands_config_path: str | Path,
    results_dir: str | Path = "data/results",
) -> list[AnalysisResult]:
    """
    Main pipeline:
    1. Load all response records
    2. For each record, run brand detection for every tracked brand
    3. Save individual analysis JSON files
    4. Return all results
    """
    brand_config = load_brand_config(brands_config_path)
    brands = brand_config["brands"]
    records = load_records(responses_dir)
    results_path = Path(results_dir)

    all_results: list[AnalysisResult] = []

    for i, record in enumerate(records, 1):
        response_text = record.get("response_text", "")
        log.info(f"[{i}/{len(records)}] Analysing record {record['record_id'][:8]}… ({record['category']})")

        # First pass: find the char offset of the first occurrence of each brand,
        # used for relative position ranking across brands.
        import re
        first_offsets: dict[str, int] = {}
        for b in brands:
            all_terms = [b["name"]] + b.get("aliases", [])
            for term in all_terms:
                m = re.search(r"\b" + re.escape(term) + r"\b", response_text, re.IGNORECASE)
                if m:
                    existing = first_offsets.get(b["name"])
                    if existing is None or m.start() < existing:
                        first_offsets[b["name"]] = m.start()

        brand_results = []
        for b in brands:
            # Pass in the list of first-offsets of all OTHER brands for rank scoring
            other_offsets = [v for k, v in first_offsets.items() if k != b["name"]]
            result = detect_brand(
                response_text=response_text,
                brand=b["name"],
                aliases=b.get("aliases", []),
                all_brands_mentioned=other_offsets,
            )
            brand_results.append(result)
            status = "✓" if result.mentioned else "–"
            log.info(
                f"  {status} {b['name']:20s} | "
                f"mentions={result.mention_count} | "
                f"pos={result.position_score:.1f} | "
                f"sentiment={result.avg_sentiment:+.2f} ({result.sentiment_label})"
            )

        analysis = AnalysisResult(
            record_id=record["record_id"],
            prompt_id=record["prompt_id"],
            category=record["category"],
            prompt_text=record["prompt_text"],
            model=record["model"],
            timestamp=record["timestamp"],
            brands=brand_results,
        )
        path = save_result(analysis, results_path)
        log.info(f"  → saved {path.name}")
        all_results.append(analysis)

    ok = sum(1 for r in all_results for b in r.brands if b.mentioned)
    log.info(f"\nDone. {len(all_results)} records analysed. {ok} total brand mentions found.")
    return all_results
