#!/usr/bin/env python3
"""
main.py — CLI entry point for the Peec collector.

Usage:
  python main.py                        # run with defaults
  python main.py --model mixtral-8x7b-32768
  python main.py --prompts data/prompts.json --delay 2
  python main.py --schedule 60          # run every 60 minutes
"""

import argparse
import time
import logging
from pathlib import Path

from src.collector import run_collection

log = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Peec AI Response Collector")
    parser.add_argument(
        "--prompts",
        default="data/prompts.json",
        help="Path to the prompt bank JSON file",
    )
    parser.add_argument(
        "--model",
        default="llama-3.3-70b-versatile",
        choices=[
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ],
        help="Groq model to use",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Seconds to wait between API calls (default: 1.0)",
    )
    parser.add_argument(
        "--schedule",
        type=int,
        default=None,
        metavar="MINUTES",
        help="If set, repeat the collection every N minutes",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    prompts_path = Path(args.prompts)

    if not prompts_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompts_path}")

    if args.schedule:
        print(f"Scheduled mode: running every {args.schedule} minute(s). Press Ctrl+C to stop.\n")
        while True:
            run_collection(prompts_path, model=args.model, delay_between=args.delay)
            print(f"\nSleeping {args.schedule}m until next run…\n")
            time.sleep(args.schedule * 60)
    else:
        run_collection(prompts_path, model=args.model, delay_between=args.delay)


if __name__ == "__main__":
    main()
