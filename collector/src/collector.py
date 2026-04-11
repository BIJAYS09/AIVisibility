"""
collector.py — AI Response Collector
Sends prompts to Groq, captures responses, saves structured JSON.
"""

import os
import json
import time
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path

from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

RESPONSES_DIR = Path(__file__).parent.parent / "data" / "responses"
RESPONSES_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_MODEL    = "llama3-70b-8192"   # fast + free on Groq
DEFAULT_TEMP     = 0.7
MAX_TOKENS       = 1024
MAX_RETRIES      = 3
RETRY_BASE_DELAY = 2  # seconds (doubles on each retry)


def load_prompts(path: str | Path) -> list[dict]:
    """Load the prompt bank from a JSON file."""
    with open(path, "r") as f:
        data = json.load(f)
    log.info(f"Loaded {len(data['prompts'])} prompts from {path}")
    return data["prompts"]


def query_groq(
    client: Groq,
    prompt: str,
    model: str = DEFAULT_MODEL,
    temperature: float = DEFAULT_TEMP,
) -> dict:
    """
    Send a single prompt to Groq with retry logic.
    Returns a dict with response text + metadata.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            start = time.perf_counter()
            completion = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=MAX_TOKENS,
            )
            latency_ms = round((time.perf_counter() - start) * 1000)

            return {
                "response_text": completion.choices[0].message.content,
                "model":         completion.model,
                "latency_ms":    latency_ms,
                "input_tokens":  completion.usage.prompt_tokens,
                "output_tokens": completion.usage.completion_tokens,
            }

        except Exception as e:
            wait = RETRY_BASE_DELAY ** attempt
            log.warning(f"Attempt {attempt}/{MAX_RETRIES} failed: {e}. Retrying in {wait}s…")
            if attempt == MAX_RETRIES:
                log.error(f"All retries exhausted for prompt: {prompt[:60]}…")
                raise
            time.sleep(wait)


def build_record(prompt_meta: dict, response: dict, run_id: str) -> dict:
    """Assemble the full JSON record for one prompt → response pair."""
    return {
        "record_id":     str(uuid.uuid4()),
        "run_id":        run_id,
        "timestamp":     datetime.now(timezone.utc).isoformat(),
        "prompt_id":     prompt_meta["id"],
        "category":      prompt_meta["category"],
        "prompt_text":   prompt_meta["text"],
        "model":         response["model"],
        "response_text": response["response_text"],
        "latency_ms":    response["latency_ms"],
        "input_tokens":  response["input_tokens"],
        "output_tokens": response["output_tokens"],
    }


def save_record(record: dict) -> Path:
    """Save a single record to its own JSON file (named by record_id)."""
    out = RESPONSES_DIR / f"{record['record_id']}.json"
    with open(out, "w") as f:
        json.dump(record, f, indent=2)
    return out


def run_collection(
    prompts_path: str | Path,
    model: str = DEFAULT_MODEL,
    delay_between: float = 1.0,
) -> list[dict]:
    """
    Main collection loop.
    - Loads all prompts
    - Queries Groq for each
    - Saves individual JSON records
    - Returns a summary list
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError("GROQ_API_KEY not set. Add it to your .env file.")

    client = Groq(api_key=api_key)
    prompts = load_prompts(prompts_path)
    run_id  = str(uuid.uuid4())

    log.info(f"Starting run {run_id} with {len(prompts)} prompts on model '{model}'")

    results = []
    for i, prompt_meta in enumerate(prompts, 1):
        log.info(f"[{i}/{len(prompts)}] {prompt_meta['category']} → {prompt_meta['text'][:60]}…")

        try:
            response = query_groq(client, prompt_meta["text"], model=model)
            record   = build_record(prompt_meta, response, run_id)
            path     = save_record(record)

            log.info(f"  ✓ {response['latency_ms']}ms | {response['output_tokens']} tokens → {path.name}")
            results.append({"status": "ok", "record_id": record["record_id"], **prompt_meta})

        except Exception as e:
            log.error(f"  ✗ Failed: {e}")
            results.append({"status": "error", "error": str(e), **prompt_meta})

        # Polite delay between calls to avoid rate-limiting
        if i < len(prompts):
            time.sleep(delay_between)

    ok  = sum(1 for r in results if r["status"] == "ok")
    err = len(results) - ok
    log.info(f"Run complete. {ok} succeeded, {err} failed. run_id={run_id}")
    return results
