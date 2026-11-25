"""SQLite history. Each report is one row; the details are stored as JSON."""
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from . import config


@contextmanager
def connect():
    connection = sqlite3.connect(config.DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        with connection:  # commits on success, rolls back on error
            yield connection
    finally:
        connection.close()


def init() -> None:
    with connect() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id         TEXT PRIMARY KEY,
                title      TEXT NOT NULL,
                source     TEXT NOT NULL,
                created_at TEXT NOT NULL,
                duration   REAL NOT NULL,
                words      INTEGER NOT NULL,
                score      INTEGER NOT NULL,
                wpm        INTEGER NOT NULL,
                fillers    INTEGER NOT NULL,
                report     TEXT NOT NULL
            )""")


def save(report_id: str, title: str, source: str, report: dict) -> None:
    with connect() as db:
        db.execute(
            "INSERT INTO reports VALUES (?,?,?,?,?,?,?,?,?,?)",
            (report_id, title, source, datetime.now(timezone.utc).isoformat(),
             report["duration"], report["pace"]["word_count"], report["score"]["overall"],
             report["pace"]["wpm"], report["fillers"]["total"], json.dumps(report)))


def list_all() -> list[dict]:
    with connect() as db:
        rows = db.execute("""SELECT id, title, source, created_at, duration, words, score, wpm, fillers
                             FROM reports ORDER BY created_at DESC""").fetchall()
    return [dict(row) for row in rows]


def get(report_id: str) -> dict | None:
    with connect() as db:
        row = db.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
    if row is None:
        return None
    data = dict(row)
    return {**data, "report": json.loads(data["report"])}


def delete(report_id: str) -> bool:
    with connect() as db:
        return db.execute("DELETE FROM reports WHERE id = ?", (report_id,)).rowcount > 0
