# Peec — Project 2: Brand Detection Engine

Reads AI responses from Project 1 and detects:
- **Is your brand mentioned?** (keyword match + NER)
- **Where?** (position score: 1.0 = first, 0.5 = later, 0.0 = absent)
- **Positive or negative?** (sentence-level TextBlob sentiment)

Outputs structured JSON analysis files ready for Project 3 (database storage).

## Quick start

```bash
# 1. Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m textblob.download_corpora

# 2. Edit your brand list
#    → data/brands.json  (add your brand + competitors)

# 3. Run detection against Project 1's responses
python main.py --responses ../peec_collector/data/responses

# 4. Watch mode: auto-detect when new responses arrive
python main.py --responses ../peec_collector/data/responses --watch

# 5. Run tests
pytest tests/
```

## Output format

Each analysis result is saved in `data/results/<record_id>_analysis.json`:

```json
{
  "record_id": "uuid",
  "prompt_text": "Best CRM tools for startups?",
  "brands": [
    {
      "brand": "HubSpot",
      "mentioned": true,
      "mention_count": 2,
      "first_mention_rank": 1,
      "position_score": 1.0,
      "avg_sentiment": 0.42,
      "sentiment_label": "positive",
      "mentions": [
        {
          "matched_text": "HubSpot",
          "method": "keyword",
          "sentence": "HubSpot is the most popular CRM for startups.",
          "sentence_index": 0,
          "char_offset": 0,
          "sentiment": 0.42,
          "sentiment_label": "positive"
        }
      ]
    }
  ]
}
```

An aggregated `data/results/summary.json` is also written after each run.

## Scores explained

| Score | Meaning |
|---|---|
| `position_score = 1.0` | Your brand was mentioned *first* in the response |
| `position_score = 0.5` | Mentioned, but another brand came first |
| `position_score = 0.0` | Not mentioned at all |
| `avg_sentiment > 0.05` | Positive context around your brand |
| `avg_sentiment < -0.05` | Negative context |

## Detection pipeline

```
response_text
     │
     ├── Keyword match   (regex, case-insensitive, handles aliases)
     │        │
     ├── NER pass        (spaCy ORG entities, for non-exact matches)
     │        │
     ├── Position score  (first mention = 1.0, later = 0.5)
     │        │
     └── Sentiment       (TextBlob polarity per mention sentence)
```

## Project structure

```
peec_brand_detection/
├── main.py               ← CLI entry point (run this)
├── requirements.txt
├── src/
│   ├── detector.py       ← Core detection: NER + keyword + sentiment
│   ├── pipeline.py       ← Batch runner across all response files
│   └── aggregator.py     ← Roll-up stats for the dashboard
├── data/
│   ├── brands.json       ← Your brand + competitors config (edit this)
│   └── results/          ← Analysis JSON output (auto-created)
└── tests/
    └── test_detector.py  ← pytest unit tests
```

## Next steps → Project 3

Pass `data/results/` to your database ingestion layer.
Each analysis file maps cleanly to the `mentions` and `scores` tables.
