# Peec — Project 1: AI Response Collector

Sends prompts to Groq, captures responses, and saves structured JSON records
ready to be picked up by Project 2 (Brand Detection).

## Quick start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up your API key
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (free at console.groq.com)

# 3. Run a collection
python main.py

# 4. Inspect what was saved
python inspect.py --limit 5
```

## CLI options

```
python main.py --model mixtral-8x7b-32768   # switch model
python main.py --delay 2                    # 2s between calls
python main.py --schedule 60               # re-run every 60 minutes
python inspect.py --category CRM           # filter by category
```

## Output format

Each prompt → response pair is saved as a JSON file in `data/responses/`:

```json
{
  "record_id":     "uuid",
  "run_id":        "uuid (groups all prompts from one run)",
  "timestamp":     "2024-01-15T10:23:45+00:00",
  "prompt_id":     "crm-001",
  "category":      "CRM",
  "prompt_text":   "What are the best CRM tools for startups?",
  "model":         "llama3-70b-8192",
  "response_text": "…full AI response…",
  "latency_ms":    1243,
  "input_tokens":  18,
  "output_tokens": 312
}
```

## Project structure

```
peec_collector/
├── main.py              ← CLI entry point
├── inspect.py           ← Pretty-print saved records
├── requirements.txt
├── .env.example
├── src/
│   └── collector.py     ← Core collection logic
└── data/
    ├── prompts.json     ← Your prompt bank (edit this)
    └── responses/       ← Saved JSON records (auto-created)
```

## Adding prompts

Edit `data/prompts.json`. Each prompt needs an `id`, `category`, and `text`:

```json
{
  "id": "crm-004",
  "category": "CRM",
  "text": "What CRM does Y Combinator recommend for B2B startups?"
}
```

## Next steps → Project 2

Pass `data/responses/` to your Brand Detection module. Each record's
`response_text` field is ready for NER + sentiment analysis.
