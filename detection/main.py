#!/usr/bin/env python3
"""
main.py — CLI entry point for the Peec Brand Detection engine.

Usage:
  python main.py                                  # use default paths
  python main.py --responses ../collector/data/responses
  python main.py --brands data/brands.json --results data/results
  python main.py --watch                          # re-run when new responses arrive
"""

import argparse
import logging
import time
import json
from pathlib import Path

from src.pipeline import run_pipeline
from src.aggregator import summarize, print_summary

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

DEFAULT_RESPONSES = "../collector/data/responses"
DEFAULT_BRANDS    = "data/brands.json"
DEFAULT_RESULTS   = "data/results"


def parse_args():
    p = argparse.ArgumentParser(description="Peec Brand Detection Engine")
    p.add_argument("--responses", default=DEFAULT_RESPONSES, help="Path to Project 1 response JSON files")
    p.add_argument("--brands",    default=DEFAULT_BRANDS,    help="Path to brands config JSON")
    p.add_argument("--results",   default=DEFAULT_RESULTS,   help="Directory to save analysis results")
    p.add_argument("--watch",     action="store_true",        help="Poll for new responses every 60s")
    p.add_argument("--summary",   action="store_true",        help="Print aggregated summary after run")
    return p.parse_args()


def run_once(args):
    responses_dir = Path(args.responses)
    if not responses_dir.exists() or not any(responses_dir.glob("*.json")):
        log.warning(f"No response files found in {responses_dir}. Run Project 1 first.")
        return

    results = run_pipeline(
        responses_dir=responses_dir,
        brands_config_path=args.brands,
        results_dir=args.results,
    )

    if args.summary or True:   # always print summary
        summary = summarize(results)
        print_summary(summary)

        # Also save summary JSON
        summary_path = Path(args.results) / "summary.json"
        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2, default=str)
        log.info(f"Summary saved to {summary_path}")


def main():
    args = parse_args()

    if args.watch:
        log.info("Watch mode: polling for new responses every 60s. Ctrl+C to stop.")
        seen = set()
        while True:
            responses_dir = Path(args.responses)
            current = set(responses_dir.glob("*.json")) if responses_dir.exists() else set()
            new_files = current - seen
            if new_files:
                log.info(f"{len(new_files)} new response file(s) detected, running detection…")
                run_once(args)
                seen = current
            else:
                log.info("No new files. Sleeping 60s…")
            time.sleep(60)
    else:
        run_once(args)


if __name__ == "__main__":
    main()
