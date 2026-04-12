#!/usr/bin/env python3
"""
main.py — CLI for Peec Storage (Project 3).

Commands:
  python main.py migrate          # create / update DB tables
  python main.py ingest           # load Project 1+2 data into DB
  python main.py serve            # start FastAPI server
  python main.py migrate ingest serve   # do all three in order
"""

import argparse
import logging
from pathlib import Path
import subprocess
import sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

DEFAULT_RESPONSES = "../collector/data/responses"
DEFAULT_ANALYSIS  = "../brand_detection/data/results"
DEFAULT_PROMPTS   = "../collector/data/prompts.json"
DEFAULT_HOST      = "0.0.0.0"
DEFAULT_PORT      = 8000


def cmd_migrate():
    versions_dir = Path("alembic/versions")
    has_migrations = any(versions_dir.glob("*.py")) if versions_dir.exists() else False

    if not has_migrations:
        log.info("No migration files found — generating initial migration…")
        gen = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", "initial"],
            check=False,
        )
        if gen.returncode != 0:
            log.error("Failed to generate migration. Check alembic/env.py imports.")
            sys.exit(1)
        log.info("Initial migration file created.")

    log.info("Applying migrations…")
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        check=False,
    )
    if result.returncode != 0:
        log.error("Migration failed. Is PostgreSQL running? Check your .env DATABASE_URL.")
        sys.exit(1)
    log.info("Migrations applied successfully.")


def cmd_ingest(args):
    from src.database import SessionLocal
    from src.ingestion import run_ingestion

    db = SessionLocal()
    try:
        summary = run_ingestion(
            responses_dir=args.responses,
            analysis_dir=args.analysis,
            prompts_json=args.prompts,
            db=db,
        )
        log.info(f"Ingestion result: {summary}")
    finally:
        db.close()


def cmd_serve(args):
    import uvicorn
    log.info(f"Starting API server on http://{args.host}:{args.port}")
    log.info(f"Docs: http://{args.host}:{args.port}/docs")
    uvicorn.run(
        "src.api:app",
        host=args.host,
        port=args.port,
        reload=True,
    )


def parse_args():
    p = argparse.ArgumentParser(description="Peec Storage — Project 3")
    p.add_argument(
        "commands",
        nargs="+",
        choices=["migrate", "ingest", "serve"],
        help="One or more commands to run in order",
    )
    p.add_argument("--responses", default=DEFAULT_RESPONSES)
    p.add_argument("--analysis",  default=DEFAULT_ANALYSIS)
    p.add_argument("--prompts",   default=DEFAULT_PROMPTS)
    p.add_argument("--host",      default=DEFAULT_HOST)
    p.add_argument("--port",      type=int, default=DEFAULT_PORT)
    return p.parse_args()


def main():
    args = parse_args()
    for cmd in args.commands:
        if cmd == "migrate":
            cmd_migrate()
        elif cmd == "ingest":
            cmd_ingest(args)
        elif cmd == "serve":
            cmd_serve(args)   # blocking — always last


if __name__ == "__main__":
    main()