#!/usr/bin/env python3
"""
inspect.py — Pretty-print saved response records.

Usage:
  python inspect.py                  # show all records (newest first)
  python inspect.py --limit 5        # show last 5
  python inspect.py --category CRM  # filter by category
"""

import json
import argparse
from pathlib import Path

RESPONSES_DIR = Path("data/responses")


def load_records(limit=None, category=None):
    files = sorted(RESPONSES_DIR.glob("*.json"), key=lambda f: f.stat().st_mtime, reverse=True)
    records = []
    for f in files:
        r = json.loads(f.read_text())
        if category and r.get("category", "").lower() != category.lower():
            continue
        records.append(r)
        if limit and len(records) >= limit:
            break
    return records


def display(records):
    for r in records:
        print(f"\n{'─'*60}")
        print(f"  [{r['category']}] {r['prompt_text']}")
        print(f"  Model: {r['model']} | {r['latency_ms']}ms | {r['output_tokens']} tokens")
        print(f"  Time:  {r['timestamp']}")
        print(f"  ─ ─ ─")
        # Show first 400 chars of response
        snippet = r['response_text'][:400]
        if len(r['response_text']) > 400:
            snippet += "…"
        print(f"  {snippet}")
    print(f"\n{'─'*60}")
    print(f"  {len(records)} record(s) shown")


def main():
    parser = argparse.ArgumentParser(description="Inspect collected responses")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--category", type=str, default=None)
    args = parser.parse_args()

    if not RESPONSES_DIR.exists() or not any(RESPONSES_DIR.glob("*.json")):
        print("No responses found. Run `python main.py` first.")
        return

    records = load_records(limit=args.limit, category=args.category)
    display(records)


if __name__ == "__main__":
    main()
