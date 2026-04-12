# Peec — Project 3: Data Storage & Tracking

Persists all data from Projects 1 and 2 into PostgreSQL,
and exposes a REST API that Project 4's dashboard queries.

## Quick start

```bash
# 1. Install
pip install -r requirements.txt

# 2. Configure DB
cp .env.example .env
# → Edit DATABASE_URL (local Postgres or Supabase free tier)

# 3. Create tables
python main.py migrate

# 4. Load data from Projects 1 + 2
python main.py ingest

# 5. Start the API
python main.py serve
# → http://localhost:8000/docs  (interactive Swagger UI)

# All in one go:
python main.py migrate ingest serve

# Run tests (no Postgres needed — uses SQLite in-memory)
pytest tests/
```

## Local Postgres (Docker one-liner)

```bash
docker run -d \
  --name peec-db \
  -e POSTGRES_USER=peec \
  -e POSTGRES_PASSWORD=peec \
  -e POSTGRES_DB=peec \
  -p 5432:5432 \
  postgres:16-alpine
```

## Schema

```
prompts         responses           scores              mentions
──────────      ──────────────      ──────────────      ──────────────
id              id                  id                  id
prompt_id ←─┐  record_id           response_id ─→ id   response_id ─→ id
category    │  run_id              brand               brand
text        └─ prompt_id           mentioned           matched_text
created_at     model               mention_count       method
               response_text       position_score      sentence
               latency_ms          avg_sentiment       char_offset
               input_tokens        sentiment_label     sentiment
               output_tokens       created_at          sentiment_label
               collected_at                            created_at
               created_at
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | DB connectivity check |
| GET | `/brands` | All tracked brands |
| GET | `/summary?days=30` | All-brands aggregated stats |
| GET | `/scores?brand=X&days=30` | Daily time-series for one brand |
| GET | `/prompts?brand=X&mentioned=true` | Per-prompt breakdown table |
| GET | `/competitors?brands=A,B,C` | Side-by-side comparison |
| GET | `/runs?limit=10` | Recent collection run history |

Interactive docs at `http://localhost:8000/docs` after `python main.py serve`.

## Migrations

When you change a model, generate a new migration:
```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Project structure

```
peec_storage/
├── main.py                  ← CLI: migrate / ingest / serve
├── alembic.ini
├── requirements.txt
├── .env.example
├── alembic/
│   ├── env.py               ← Migration config (reads your models)
│   └── versions/            ← Auto-generated migration files
├── src/
│   ├── database.py          ← Engine, session, Base
│   ├── models/
│   │   └── models.py        ← ORM table definitions
│   ├── ingestion/
│   │   └── ingest.py        ← Reads Project 1+2 JSON, upserts to DB
│   └── api/
│       └── api.py           ← FastAPI endpoints for Project 4
└── tests/
    └── test_storage.py      ← pytest (SQLite in-memory)
```

## Next steps → Project 4

Point your Next.js frontend at `http://localhost:8000`.
All dashboard data lives in `/summary`, `/scores`, `/prompts`, and `/competitors`.
