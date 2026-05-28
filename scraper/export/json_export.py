import json
import os
from datetime import datetime

from database.models import init_db
from database.repository import get_all_draws


def export_to_json(db_path: str, output_path: str) -> int:
    """
    Export all draws from the SQLite database to a JSON file consumable by the frontend.
    Returns the number of draws exported.
    """
    conn = init_db(db_path)
    draws_raw = get_all_draws(conn)
    conn.close()

    draws = [_format_draw(d) for d in draws_raw]

    payload = {
        "exported_at": datetime.utcnow().isoformat(timespec="seconds"),
        "total_draws": len(draws),
        "draws": draws,
    }

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return len(draws)


def _format_draw(row: dict) -> dict:
    return {
        "date":        row.get("draw_date", ""),
        "prize1":      _pad(row.get("prize1"), 6),
        "last2":       _pad(row.get("last2"), 2),
        "last3_front": _pad(row.get("last3_front"), 3),
        "last3_back":  _pad(row.get("last3_back"), 3),
        "near1_1":     _pad(row.get("near1_1"), 6),
        "near1_2":     _pad(row.get("near1_2"), 6),
        "source":      row.get("source", ""),
    }


def _pad(value, width: int):
    if value is None:
        return None
    return str(value).zfill(width)
