"""
tests/test_detector.py — Unit tests for brand detection.

Run: pytest tests/
"""

import pytest
from src.detector import detect_brand, _sentiment_label


# ---------------------------------------------------------------------------
# Sentiment label helper
# ---------------------------------------------------------------------------

def test_sentiment_positive():
    assert _sentiment_label(0.6) == "positive"

def test_sentiment_negative():
    assert _sentiment_label(-0.3) == "negative"

def test_sentiment_neutral():
    assert _sentiment_label(0.0) == "neutral"
    assert _sentiment_label(0.03) == "neutral"


# ---------------------------------------------------------------------------
# Brand detection — basic cases
# ---------------------------------------------------------------------------

RESPONSE_SIMPLE = (
    "HubSpot is the most popular CRM for startups. "
    "Many teams also consider Salesforce, though it can be expensive. "
    "Pipedrive is a solid alternative for smaller teams."
)

def test_detects_brand_present():
    result = detect_brand(RESPONSE_SIMPLE, "HubSpot", ["Hubspot"], [])
    assert result.mentioned is True
    assert result.mention_count >= 1

def test_detects_brand_absent():
    result = detect_brand(RESPONSE_SIMPLE, "Notion", [], [])
    assert result.mentioned is False
    assert result.mention_count == 0
    assert result.position_score == 0.0

def test_case_insensitive():
    text = "hubspot is mentioned here in lowercase."
    result = detect_brand(text, "HubSpot", [], [])
    assert result.mentioned is True

def test_alias_detection():
    text = "Many teams use SFDC for enterprise sales pipelines."
    result = detect_brand(text, "Salesforce", ["SFDC", "Sales Cloud"], [])
    assert result.mentioned is True


# ---------------------------------------------------------------------------
# Position scoring
# ---------------------------------------------------------------------------

def test_first_mention_scores_1():
    # HubSpot appears before any other brand offsets passed in
    result = detect_brand(RESPONSE_SIMPLE, "HubSpot", [], [500])  # 500 = fake other brand offset
    assert result.position_score == 1.0

def test_later_mention_scores_half():
    # HubSpot appears after a brand at offset 0
    result = detect_brand(RESPONSE_SIMPLE, "HubSpot", [], [0])
    assert result.position_score == 0.5

def test_absent_brand_scores_zero():
    result = detect_brand(RESPONSE_SIMPLE, "Zoho", [], [])
    assert result.position_score == 0.0


# ---------------------------------------------------------------------------
# Sentiment
# ---------------------------------------------------------------------------

def test_positive_sentiment():
    text = "HubSpot is an excellent, highly recommended CRM that teams love."
    result = detect_brand(text, "HubSpot", [], [])
    assert result.avg_sentiment > 0

def test_negative_sentiment():
    text = "HubSpot is overpriced, buggy, and their support is terrible."
    result = detect_brand(text, "HubSpot", [], [])
    assert result.avg_sentiment < 0

def test_no_mention_sentiment_is_zero():
    result = detect_brand(RESPONSE_SIMPLE, "Zoho", [], [])
    assert result.avg_sentiment == 0.0


# ---------------------------------------------------------------------------
# Mention detail fields
# ---------------------------------------------------------------------------

def test_mention_has_sentence():
    result = detect_brand(RESPONSE_SIMPLE, "HubSpot", [], [])
    assert len(result.mentions) > 0
    assert "HubSpot" in result.mentions[0].sentence or "hubspot" in result.mentions[0].sentence.lower()

def test_mention_has_char_offset():
    result = detect_brand(RESPONSE_SIMPLE, "HubSpot", [], [])
    assert result.mentions[0].char_offset >= 0

def test_multiple_mentions_counted():
    text = "HubSpot is great. We use HubSpot daily. HubSpot has good integrations."
    result = detect_brand(text, "HubSpot", [], [])
    assert result.mention_count >= 3
