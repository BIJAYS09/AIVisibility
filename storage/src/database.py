"""
database.py — SQLAlchemy engine, session factory, and base class.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://peec:peec@localhost:5432/peec"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # test connection health before use
    pool_size=5,
    max_overflow=10,
    echo=False,               # set True to log all SQL
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a session, closes it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
