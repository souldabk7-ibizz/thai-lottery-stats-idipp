import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS draws (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    draw_date     TEXT    UNIQUE NOT NULL,
    prize1        TEXT,
    last2         TEXT,
    last3_front   TEXT,
    last3_back    TEXT,
    near1_1       TEXT,
    near1_2       TEXT,
    source        TEXT,
    scraped_at    TEXT    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scrape_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    url        TEXT,
    status     TEXT,
    error_msg  TEXT,
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP
);
"""


def create_connection(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db(db_path: str) -> sqlite3.Connection:
    conn = create_connection(db_path)
    conn.executescript(SCHEMA)
    conn.commit()
    return conn
