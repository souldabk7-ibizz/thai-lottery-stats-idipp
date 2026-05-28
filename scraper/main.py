#!/usr/bin/env python3
"""
Thai Lottery Scraper CLI
Usage:
  python main.py scrape --source sanook --year-start 2019 --year-end 2024
  python main.py scrape --source glo --latest
  python main.py export --output ../frontend/src/data/lottery_data.json
  python main.py stats
"""

import argparse
import logging
import sys
import os

# Make scraper package importable
sys.path.insert(0, os.path.dirname(__file__))

from scrapers.sanook import SanookScraper
from scrapers.glo import GloScraper
from scrapers.base import ScraperException
from database.models import init_db
from database.repository import insert_draw, get_all_draws, get_stats_summary, log_scrape
from export.json_export import export_to_json

logger = logging.getLogger("main")

DEFAULT_DB = os.path.join(os.path.dirname(__file__), "lottery.db")
DEFAULT_JSON = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "lottery_data.json")


# ── Commands ───────────────────────────────────────────────────────────────

def cmd_scrape(args):
    conn = init_db(args.db)

    if args.source == "sanook":
        scraper = SanookScraper()
        if args.latest:
            draws = [scraper.scrape_latest()]
            draws = [d for d in draws if d]
        else:
            draws = scraper.scrape_all(
                year_start=args.year_start,
                year_end=args.year_end,
            )

    elif args.source == "glo":
        scraper = GloScraper()
        draw = scraper.scrape_latest()
        draws = [draw] if draw else []

    else:
        logger.error(f"Unknown source: {args.source}")
        sys.exit(1)

    inserted = 0
    skipped = 0
    for draw in draws:
        if not draw.get("draw_date"):
            logger.warning(f"Skipping draw with no date: {draw}")
            skipped += 1
            continue
        was_inserted = insert_draw(conn, draw)
        if was_inserted:
            inserted += 1
            log_scrape(conn, draw.get("url", draw.get("source", "")), "success")
        else:
            skipped += 1
            log_scrape(conn, draw.get("url", draw.get("source", "")), "duplicate")

    conn.close()
    print(f"\n✅ Scrape complete — inserted: {inserted}, skipped (dup/error): {skipped}")


def cmd_export(args):
    output = os.path.abspath(args.output)
    count = export_to_json(args.db, output)
    print(f"✅ Exported {count} draws → {output}")


def cmd_stats(args):
    conn = init_db(args.db)
    summary = get_stats_summary(conn)
    conn.close()

    if not summary or not summary.get("total_draws"):
        print("No draws in database. Run: python main.py scrape --source sanook")
        return

    print("\n📊 Database Statistics")
    print(f"  Total draws  : {summary['total_draws']}")
    print(f"  Earliest draw: {summary['earliest_date']}")
    print(f"  Latest draw  : {summary['latest_date']}")
    print(f"  Sources      : {summary['source_count']}")


# ── Parser ─────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="main.py",
        description="Thai Government Lottery scraper and exporter",
    )
    parser.add_argument("--db", default=DEFAULT_DB, metavar="PATH",
                        help="SQLite database path (default: lottery.db)")

    sub = parser.add_subparsers(dest="command", required=True)

    # scrape
    p_scrape = sub.add_parser("scrape", help="Scrape lottery data")
    p_scrape.add_argument("--source", required=True, choices=["sanook", "glo"],
                          help="Data source to scrape")
    p_scrape.add_argument("--latest", action="store_true",
                          help="Scrape only the most recent draw")
    p_scrape.add_argument("--year-start", type=int, default=2019, metavar="YEAR",
                          help="Start year (AD) for historical scrape (default: 2019)")
    p_scrape.add_argument("--year-end", type=int, default=2024, metavar="YEAR",
                          help="End year (AD) for historical scrape (default: 2024)")

    # export
    p_export = sub.add_parser("export", help="Export database to JSON for frontend")
    p_export.add_argument("--output", default=DEFAULT_JSON, metavar="PATH",
                          help="Output JSON file path")

    # stats
    sub.add_parser("stats", help="Print database statistics")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    handlers = {
        "scrape": cmd_scrape,
        "export": cmd_export,
        "stats":  cmd_stats,
    }
    handlers[args.command](args)


if __name__ == "__main__":
    main()
