import re
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from .base import BaseScraper, ScraperException


THAI_MONTHS = {
    "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
    "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
    "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
    # Short forms
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4,
    "พ.ค.": 5, "มิ.ย.": 6, "ก.ค.": 7, "ส.ค.": 8,
    "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
}

BASE_URL = "https://news.sanook.com/lotto/"


class SanookScraper(BaseScraper):
    def __init__(self):
        super().__init__(rate_limit_min=0.6, rate_limit_max=1.2)

    # ── Archive URL discovery ──────────────────────────────────────────────

    def get_archive_urls(self, year_start: int = 2019, year_end: int = 2024) -> list[str]:
        """Return per-draw page URLs for all draws in the given AD year range."""
        urls = []
        try:
            resp = self.fetch(BASE_URL)
            soup = BeautifulSoup(resp.text, "lxml")
        except ScraperException as e:
            self.logger.error(f"Could not load archive index: {e}")
            return []

        # Sanook's lotto archive lists draw links as /lotto/YYYYMMDD/ style paths
        pattern = re.compile(r"/lotto/(\d{8})/?$")
        seen = set()
        for a in soup.find_all("a", href=pattern):
            href = a["href"]
            m = pattern.search(href)
            if not m:
                continue
            date_str = m.group(1)  # YYYYMMDD (AD)
            try:
                dt = datetime.strptime(date_str, "%Y%m%d")
            except ValueError:
                continue
            if year_start <= dt.year <= year_end and href not in seen:
                seen.add(href)
                full = href if href.startswith("http") else f"https://news.sanook.com{href}"
                urls.append(full)

        # If the main page didn't expose all years, try paginated archive
        if not urls:
            urls = self._discover_via_archive_pages(year_start, year_end)

        self.logger.info(f"Discovered {len(urls)} draw URLs ({year_start}–{year_end})")
        return sorted(urls)

    def _discover_via_archive_pages(self, year_start: int, year_end: int) -> list[str]:
        """Fallback: enumerate monthly archive pages."""
        urls = []
        pattern = re.compile(r"/lotto/(\d{8})/?")
        seen = set()
        for year in range(year_start, year_end + 1):
            be_year = year + 543
            for month in range(1, 13):
                archive_url = f"https://news.sanook.com/lotto/archive/{be_year}/{month:02d}/"
                try:
                    resp = self.fetch(archive_url)
                    soup = BeautifulSoup(resp.text, "lxml")
                    for a in soup.find_all("a", href=pattern):
                        href = a["href"]
                        m = pattern.search(href)
                        if not m:
                            continue
                        date_str = m.group(1)
                        try:
                            dt = datetime.strptime(date_str, "%Y%m%d")
                        except ValueError:
                            continue
                        if year_start <= dt.year <= year_end and href not in seen:
                            seen.add(href)
                            full = href if href.startswith("http") else f"https://news.sanook.com{href}"
                            urls.append(full)
                except ScraperException as e:
                    self.logger.warning(f"Skipping archive {archive_url}: {e}")
        return urls

    # ── Single draw page ──────────────────────────────────────────────────

    def scrape_draw(self, url: str) -> Optional[dict]:
        """Scrape one draw result page and return a data dict (or None on failure)."""
        try:
            resp = self.fetch(url)
        except ScraperException as e:
            self.logger.warning(f"Skipping {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")
        data: dict = {"source": "sanook", "url": url}

        # ── Draw date ──────────────────────────────────────────────────
        draw_date = self._extract_date(soup, url)
        if draw_date is None:
            self.logger.warning(f"Could not parse draw date from {url}")
            return None
        data["draw_date"] = draw_date

        # ── Prize 1 (รางวัลที่ 1) ──────────────────────────────────────
        data["prize1"] = self._extract_text(soup, [
            ".lotto-prize1", ".prize-1", "[data-prize='1']",
            "td.prize1", "span.lotto-no",
        ], digits_only=True, pad=6)

        # ── Last 2 digits (เลขท้าย 2 ตัว) ────────────────────────────
        data["last2"] = self._extract_text(soup, [
            ".lotto-last2", ".last-2", "[data-prize='last2']",
            "td.last2",
        ], digits_only=True, pad=2)

        # ── Last 3 front (เลขหน้า 3 ตัว) ──────────────────────────────
        data["last3_front"] = self._extract_text(soup, [
            ".lotto-front3", ".front-3", "[data-prize='front3']",
        ], digits_only=True, pad=3)

        # ── Last 3 back (เลขท้าย 3 ตัว) ────────────────────────────────
        data["last3_back"] = self._extract_text(soup, [
            ".lotto-back3", ".back-3", "[data-prize='back3']",
        ], digits_only=True, pad=3)

        # ── Near prize 1 (ใกล้เคียงรางวัลที่ 1) ──────────────────────
        near = self._extract_near1(soup)
        data["near1_1"] = near[0] if len(near) > 0 else None
        data["near1_2"] = near[1] if len(near) > 1 else None

        return data

    def _extract_date(self, soup: BeautifulSoup, url: str) -> Optional[str]:
        # Try URL date first (most reliable)
        m = re.search(r"/lotto/(\d{8})/?", url)
        if m:
            try:
                dt = datetime.strptime(m.group(1), "%Y%m%d")
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                pass

        # Try page heading thai date e.g. "1 มกราคม 2567"
        heading = soup.find(["h1", "h2", "title"])
        if heading:
            parsed = self._parse_thai_date(heading.get_text())
            if parsed:
                return parsed

        # Try structured data
        for sel in ["time[datetime]", "meta[property='article:published_time']"]:
            el = soup.select_one(sel)
            if el:
                raw = el.get("datetime") or el.get("content", "")
                try:
                    return datetime.fromisoformat(raw[:10]).strftime("%Y-%m-%d")
                except ValueError:
                    pass

        return None

    def _parse_thai_date(self, text: str) -> Optional[str]:
        pattern = re.compile(r"(\d{1,2})\s+([ก-๙]+\.?)\s+(\d{4})")
        m = pattern.search(text)
        if not m:
            return None
        day, month_th, year_str = m.groups()
        month_num = THAI_MONTHS.get(month_th)
        if month_num is None:
            return None
        year = int(year_str)
        if year > 2500:
            year = self.buddhist_to_ad(year)
        try:
            return datetime(year, month_num, int(day)).strftime("%Y-%m-%d")
        except ValueError:
            return None

    def _extract_text(
        self,
        soup: BeautifulSoup,
        selectors: list[str],
        digits_only: bool = True,
        pad: int = 0,
    ) -> Optional[str]:
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                text = el.get_text(strip=True)
                if digits_only:
                    text = re.sub(r"\D", "", text)
                if text:
                    return text.zfill(pad) if pad else text
        return None

    def _extract_near1(self, soup: BeautifulSoup) -> list[str]:
        results = []
        for sel in [".lotto-near1", ".near-1", "[data-prize='near1']", "td.near1"]:
            els = soup.select(sel)
            for el in els:
                text = re.sub(r"\D", "", el.get_text(strip=True))
                if len(text) == 6:
                    results.append(text)
                if len(results) == 2:
                    return results
        return results

    # ── Bulk scrape ───────────────────────────────────────────────────────

    def scrape_all(self, year_start: int = 2019, year_end: int = 2024) -> list[dict]:
        urls = self.get_archive_urls(year_start, year_end)
        if not urls:
            self.logger.warning("No archive URLs found — check site structure")
            return []

        results = []
        for url in urls:
            draw = self.scrape_draw(url)
            if draw:
                results.append(draw)
                self.logger.info(f"  ✓ {draw['draw_date']} prize1={draw.get('prize1','?')}")
            else:
                self.logger.warning(f"  ✗ skipped {url}")

        self.logger.info(f"Scraped {len(results)}/{len(urls)} draws from Sanook")
        return results

    def scrape_latest(self) -> Optional[dict]:
        try:
            resp = self.fetch(BASE_URL)
        except ScraperException as e:
            self.logger.error(f"Failed to load Sanook lotto page: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")
        pattern = re.compile(r"/lotto/(\d{8})/?$")
        for a in soup.find_all("a", href=pattern):
            href = a["href"]
            full = href if href.startswith("http") else f"https://news.sanook.com{href}"
            return self.scrape_draw(full)
        return None
