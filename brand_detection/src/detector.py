"""
detector.py — Brand Detection Engine
Runs NER, keyword matching, position scoring, and sentiment analysis
on collected AI responses from Project 1.
"""

import re
import logging
from dataclasses import dataclass, field, asdict
from typing import Optional

import spacy
from textblob import TextBlob

log = logging.getLogger(__name__)

# Load spaCy model once at import time (python -m spacy download en_core_web_sm)
try:
    _NLP = spacy.load("en_core_web_sm")
except OSError:
    raise RuntimeError(
        "spaCy model not found. Run: python -m spacy download en_core_web_sm"
    )


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class MentionDetail:
    """A single detected mention of a brand inside a response."""
    brand:          str
    matched_text:   str          # exact text that triggered the match
    method:         str          # "keyword" | "ner"
    sentence:       str          # full sentence containing the mention
    sentence_index: int          # which sentence (0-based)
    char_offset:    int          # character position in full response
    sentiment:      float        # TextBlob polarity for the sentence (-1 to +1)
    sentiment_label: str         # "positive" | "neutral" | "negative"


@dataclass
class BrandResult:
    """Complete analysis result for one brand against one response."""
    brand:              str
    mentioned:          bool
    mention_count:      int
    first_mention_rank: Optional[int]   # 1 = first brand mentioned in response
    position_score:     float           # 1.0 = first, 0.5 = elsewhere, 0.0 = absent
    avg_sentiment:      float           # mean polarity across all mention sentences
    sentiment_label:    str
    mentions:           list[MentionDetail] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["mentions"] = [asdict(m) for m in self.mentions]
        return d


@dataclass
class AnalysisResult:
    """Full analysis output for one record (one prompt → response pair)."""
    record_id:    str
    prompt_id:    str
    category:     str
    prompt_text:  str
    model:        str
    timestamp:    str
    brands:       list[BrandResult] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["brands"] = [b.to_dict() for b in self.brands]
        return d


# ---------------------------------------------------------------------------
# Core detection helpers
# ---------------------------------------------------------------------------

def _sentiment_label(polarity: float) -> str:
    if polarity > 0.05:
        return "positive"
    if polarity < -0.05:
        return "negative"
    return "neutral"


def _build_patterns(brand: str, aliases: list[str]) -> list[re.Pattern]:
    """Compile case-insensitive regex patterns for the brand and all its aliases."""
    all_names = [brand] + aliases
    return [re.compile(r"\b" + re.escape(name) + r"\b", re.IGNORECASE) for name in all_names]


def _extract_ner_entities(doc) -> set[str]:
    """Return all ORG entities found by spaCy."""
    return {ent.text for ent in doc.ents if ent.label_ == "ORG"}


def _find_mentions_in_sentence(
    sentence: str,
    sentence_index: int,
    char_offset: int,
    brand: str,
    patterns: list[re.Pattern],
    ner_entities: set[str],
    method: str,
) -> list[MentionDetail]:
    """Scan a single sentence for keyword or NER matches."""
    blob = TextBlob(sentence)
    polarity = round(blob.sentiment.polarity, 4)
    label = _sentiment_label(polarity)
    mentions = []

    if method == "keyword":
        for pattern in patterns:
            for m in pattern.finditer(sentence):
                mentions.append(MentionDetail(
                    brand=brand,
                    matched_text=m.group(),
                    method="keyword",
                    sentence=sentence.strip(),
                    sentence_index=sentence_index,
                    char_offset=char_offset + m.start(),
                    sentiment=polarity,
                    sentiment_label=label,
                ))

    elif method == "ner":
        for ent_text in ner_entities:
            # Check if this NER entity matches any alias
            for pattern in patterns:
                if pattern.search(ent_text):
                    if ent_text.lower() in sentence.lower():
                        idx = sentence.lower().find(ent_text.lower())
                        mentions.append(MentionDetail(
                            brand=brand,
                            matched_text=ent_text,
                            method="ner",
                            sentence=sentence.strip(),
                            sentence_index=sentence_index,
                            char_offset=char_offset + idx,
                            sentiment=polarity,
                            sentiment_label=label,
                        ))

    # De-duplicate by char_offset
    seen = set()
    unique = []
    for m in mentions:
        if m.char_offset not in seen:
            seen.add(m.char_offset)
            unique.append(m)
    return unique


def detect_brand(
    response_text: str,
    brand: str,
    aliases: list[str],
    all_brands_mentioned: list[str],  # brands already found (for rank scoring)
) -> BrandResult:
    """
    Full detection pipeline for one brand against one response.
    1. Keyword match (fast, catches all variants)
    2. NER (catches clean entity references even without exact spelling)
    3. Position scoring
    4. Sentiment aggregation
    """
    patterns = _build_patterns(brand, aliases)
    doc = _NLP(response_text)
    ner_entities = _extract_ner_entities(doc)
    sentences = list(doc.sents)

    all_mentions: list[MentionDetail] = []
    offset = 0

    for i, sent in enumerate(sentences):
        sent_text = sent.text
        # Keyword pass
        kw_hits = _find_mentions_in_sentence(
            sent_text, i, offset, brand, patterns, ner_entities, method="keyword"
        )
        all_mentions.extend(kw_hits)

        # NER pass (only for sentences without a keyword hit, to avoid duplicates)
        if not kw_hits:
            ner_hits = _find_mentions_in_sentence(
                sent_text, i, offset, brand, patterns, ner_entities, method="ner"
            )
            all_mentions.extend(ner_hits)

        offset += len(sent_text)

    mentioned = len(all_mentions) > 0

    # Position score: 1.0 if first-mentioned brand overall, 0.5 if mentioned later, 0.0 if absent
    if mentioned:
        first_offset = min(m.char_offset for m in all_mentions)
        # rank = number of brands with an earlier first-mention + 1
        rank = sum(
            1 for other_first in all_brands_mentioned if other_first < first_offset
        ) + 1
        position_score = 1.0 if rank == 1 else 0.5
    else:
        rank = None
        position_score = 0.0

    # Average sentiment across mention sentences
    sentiments = [m.sentiment for m in all_mentions]
    avg_sentiment = round(sum(sentiments) / len(sentiments), 4) if sentiments else 0.0

    return BrandResult(
        brand=brand,
        mentioned=mentioned,
        mention_count=len(all_mentions),
        first_mention_rank=rank,
        position_score=position_score,
        avg_sentiment=avg_sentiment,
        sentiment_label=_sentiment_label(avg_sentiment),
        mentions=all_mentions,
    )
