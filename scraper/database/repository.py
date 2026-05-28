import sqlite3
from datetime import datetime
from typing import Optional


# ── Draws ──────────────────────────────────────────────────────────────────

def insert_draw(conn: sqlite3.Connection, draw: dict) -> bool:
    """Insert a draw record. Returns True if inserted, False if skipped (duplicate)."""
    sql = """
        INSERT OR IGNORE INTO draws
            (draw_date, prize1, last2, last3_front, last3_back, near1_1, near1_2, source)
        VALUES
            (:draw_date, :prize1, :last2, :last3_front, :last3_back, :near1_1, :near1_2, :source)
    """
    row = {
        "draw_date":   draw.get("draw_date"),
        "prize1":      draw.get("prize1"),
        "last2":       draw.get("last2"),
        "last3_front": draw.get("last3_front"),
        "last3_back":  draw.get("last3_back"),
        "near1_1":     draw.get("near1_1"),
        "near1_2":     draw.get("near1_2"),
        "source":      draw.get("source", "unknown"),
    }
    cursor = conn.execute(sql, row)
    conn.commit()
    return cursor.rowcount > 0


def get_all_draws(conn: sqlite3.Connection) -> list[dict]:
    """Return all draws ordered by date descending."""
    cursor = conn.execute("SELECT * FROM draws ORDER BY draw_date DESC")
    return [dict(row) for row in cursor.fetchall()]


def get_draws_since(conn: sqlite3.Connection, date_str: str) -> list[dict]:
    """Return draws on or after date_str (YYYY-MM-DD), newest first."""
    cursor = conn.execute(
        "SELECT * FROM draws WHERE draw_date >= ? ORDER BY draw_date DESC",
        (date_str,),
    )
    return [dict(row) for row in cursor.fetchall()]


def get_draw_by_date(conn: sqlite3.Connection, date_str: str) -> Optional[dict]:
    cursor = conn.execute("SELECT * FROM draws WHERE draw_date = ?", (date_str,))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_stats_summary(conn: sqlite3.Connection) -> dict:
    """Return high-level summary stats."""
    row = conn.execute("""
        SELECT
            COUNT(*)                   AS total_draws,
            MIN(draw_date)             AS earliest_date,
            MAX(draw_date)             AS latest_date,
            COUNT(DISTINCT source)     AS source_count
        FROM draws
    """).fetchone()
    return dict(row) if row else {}


# ── Scrape log ─────────────────────────────────────────────────────────────

def log_scrape(conn: sqlite3.Connection, url: str, status: str, error_msg: str = None):
    conn.execute(
        "INSERT INTO scrape_log (url, status, error_msg) VALUES (?, ?, ?)",
        (url, status, error_msg),
    )
    conn.commit()


def get_recent_logs(conn: sqlite3.Connection, limit: int = 50) -> list[dict]:
    cursor = conn.execute(
        "SELECT * FROM scrape_log ORDER BY created_at DESC LIMIT ?", (limit,)
    )
    return [dict(row) for row in cursor.fetchall()]
