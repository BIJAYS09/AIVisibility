"""
models.py — ORM table definitions.

Schema:
  prompts      — the prompt bank (text + category)
  responses    — raw AI responses from Project 1
  mentions     — individual brand mention events from Project 2
  scores       — per-brand aggregated scores per response
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey,
    Index, Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# prompts
# ---------------------------------------------------------------------------

class Prompt(Base):
    __tablename__ = "prompts"

    id:           Mapped[int]  = mapped_column(Integer, primary_key=True)
    prompt_id:    Mapped[str]  = mapped_column(String(64), unique=True, nullable=False)  # e.g. "crm-001"
    category:     Mapped[str]  = mapped_column(String(128), nullable=False, index=True)
    text:         Mapped[str]  = mapped_column(Text, nullable=False)
    created_at:   Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    responses: Mapped[list["Response"]] = relationship(back_populates="prompt")

    def __repr__(self) -> str:
        return f"<Prompt {self.prompt_id}: {self.text[:40]}>"


# ---------------------------------------------------------------------------
# responses
# ---------------------------------------------------------------------------

class Response(Base):
    __tablename__ = "responses"

    id:            Mapped[int]  = mapped_column(Integer, primary_key=True)
    record_id:     Mapped[str]  = mapped_column(String(64), unique=True, nullable=False, index=True)
    run_id:        Mapped[str]  = mapped_column(String(64), nullable=False, index=True)
    prompt_id:     Mapped[int]  = mapped_column(ForeignKey("prompts.id"), nullable=False)
    model:         Mapped[str]  = mapped_column(String(128), nullable=False)
    response_text: Mapped[str]  = mapped_column(Text, nullable=False)
    latency_ms:    Mapped[int]  = mapped_column(Integer, nullable=True)
    input_tokens:  Mapped[int]  = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int]  = mapped_column(Integer, nullable=True)
    collected_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at:    Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    prompt:   Mapped["Prompt"]      = relationship(back_populates="responses")
    scores:   Mapped[list["Score"]] = relationship(back_populates="response", cascade="all, delete-orphan")
    mentions: Mapped[list["Mention"]] = relationship(back_populates="response", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_responses_run_id_model", "run_id", "model"),
    )

    def __repr__(self) -> str:
        return f"<Response {self.record_id[:8]} model={self.model}>"


# ---------------------------------------------------------------------------
# scores
# ---------------------------------------------------------------------------

class Score(Base):
    __tablename__ = "scores"

    id:                 Mapped[int]   = mapped_column(Integer, primary_key=True)
    response_id:        Mapped[int]   = mapped_column(ForeignKey("responses.id"), nullable=False)
    brand:              Mapped[str]   = mapped_column(String(128), nullable=False, index=True)
    mentioned:          Mapped[bool]  = mapped_column(Boolean, nullable=False, default=False)
    mention_count:      Mapped[int]   = mapped_column(Integer, nullable=False, default=0)
    first_mention_rank: Mapped[int]   = mapped_column(Integer, nullable=True)
    position_score:     Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_sentiment:      Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    sentiment_label:    Mapped[str]   = mapped_column(String(16), nullable=False, default="neutral")
    created_at:         Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    response: Mapped["Response"] = relationship(back_populates="scores")

    __table_args__ = (
        UniqueConstraint("response_id", "brand", name="uq_score_response_brand"),
        Index("ix_scores_brand_created", "brand", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Score brand={self.brand} pos={self.position_score} sentiment={self.sentiment_label}>"


# ---------------------------------------------------------------------------
# mentions
# ---------------------------------------------------------------------------

class Mention(Base):
    __tablename__ = "mentions"

    id:              Mapped[int]  = mapped_column(Integer, primary_key=True)
    response_id:     Mapped[int]  = mapped_column(ForeignKey("responses.id"), nullable=False)
    brand:           Mapped[str]  = mapped_column(String(128), nullable=False, index=True)
    matched_text:    Mapped[str]  = mapped_column(String(256), nullable=True)
    method:          Mapped[str]  = mapped_column(String(16), nullable=False)   # "keyword" | "ner"
    sentence:        Mapped[str]  = mapped_column(Text, nullable=True)
    sentence_index:  Mapped[int]  = mapped_column(Integer, nullable=True)
    char_offset:     Mapped[int]  = mapped_column(Integer, nullable=True)
    sentiment:       Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    sentiment_label: Mapped[str]  = mapped_column(String(16), nullable=False, default="neutral")
    created_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    response: Mapped["Response"] = relationship(back_populates="mentions")

    __table_args__ = (
        Index("ix_mentions_brand_created", "brand", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Mention brand={self.brand} method={self.method} sent={self.sentiment_label}>"
