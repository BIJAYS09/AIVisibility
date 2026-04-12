"""
aggregator.py — Rolls up per-record brand results into summary statistics.

Produces a clean summary dict ready to be stored in the DB (Project 3)
or rendered in the dashboard (Project 4).
"""

from collections import defaultdict
from .detector import AnalysisResult


def summarize(results: list[AnalysisResult]) -> dict:
    """
    Given all analysis results for a run, produce per-brand summary stats:
    - mention_rate       : % of responses where the brand appears
    - avg_position_score : average position score across all responses
    - avg_sentiment      : average sentiment across mention sentences
    - category_breakdown : mention rate by prompt category
    - prompt_details     : per-prompt visibility (for the dashboard table)
    """
    if not results:
        return {}

    # Collect brand names from the first result (they're the same across all)
    brand_names = [b.brand for b in results[0].brands]

    summary: dict[str, dict] = {name: {
        "mention_rate":       0.0,
        "total_mentions":     0,
        "mentioned_in":       0,
        "avg_position_score": 0.0,
        "avg_sentiment":      0.0,
        "sentiment_label":    "neutral",
        "category_breakdown": defaultdict(lambda: {"total": 0, "mentioned": 0}),
        "prompt_details":     [],
    } for name in brand_names}

    for result in results:
        for brand_result in result.brands:
            s = summary[brand_result.brand]
            cat = result.category

            s["category_breakdown"][cat]["total"] += 1
            s["total_mentions"] += brand_result.mention_count
            s["avg_position_score"] += brand_result.position_score

            if brand_result.mentioned:
                s["mentioned_in"] += 1
                s["category_breakdown"][cat]["mentioned"] += 1
                s["avg_sentiment"] += brand_result.avg_sentiment

            s["prompt_details"].append({
                "record_id":      result.record_id,
                "prompt_id":      result.prompt_id,
                "category":       cat,
                "prompt_text":    result.prompt_text,
                "mentioned":      brand_result.mentioned,
                "mention_count":  brand_result.mention_count,
                "position_score": brand_result.position_score,
                "sentiment":      brand_result.avg_sentiment,
                "sentiment_label": brand_result.sentiment_label,
            })

    total = len(results)
    for name, s in summary.items():
        s["mention_rate"]       = round(s["mentioned_in"] / total * 100, 1)
        s["avg_position_score"] = round(s["avg_position_score"] / total, 3)
        s["avg_sentiment"]      = (
            round(s["avg_sentiment"] / s["mentioned_in"], 4)
            if s["mentioned_in"] > 0 else 0.0
        )
        # Sentiment label from aggregated score
        pol = s["avg_sentiment"]
        s["sentiment_label"] = "positive" if pol > 0.05 else ("negative" if pol < -0.05 else "neutral")

        # Convert defaultdict to plain dict
        s["category_breakdown"] = {
            cat: {
                **v,
                "mention_rate": round(v["mentioned"] / v["total"] * 100, 1) if v["total"] else 0.0
            }
            for cat, v in s["category_breakdown"].items()
        }

    return summary


def print_summary(summary: dict) -> None:
    """Pretty-print summary to terminal."""
    print(f"\n{'═'*68}")
    print(f"  Brand Visibility Summary")
    print(f"{'═'*68}")
    for brand, s in sorted(summary.items(), key=lambda x: -x[1]["mention_rate"]):
        bar_len = int(s["mention_rate"] / 2)
        bar = "█" * bar_len + "░" * (50 - bar_len)
        sentiment_sym = "▲" if s["sentiment_label"] == "positive" else ("▼" if s["sentiment_label"] == "negative" else "●")
        print(f"\n  {brand}")
        print(f"  Mention rate : {bar} {s['mention_rate']}%")
        print(f"  Avg position : {s['avg_position_score']:.2f}   Sentiment: {sentiment_sym} {s['avg_sentiment']:+.3f} ({s['sentiment_label']})")
        print(f"  By category  : ", end="")
        for cat, cv in s["category_breakdown"].items():
            print(f"{cat} {cv['mention_rate']}%  ", end="")
        print()
    print(f"\n{'═'*68}\n")
