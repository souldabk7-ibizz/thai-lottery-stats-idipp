import re
from typing import Optional

from bs4 import BeautifulSoup

from .base import BaseScraper, ScraperException


GLO_URL = "https://www.glo.or.th/mission/reward-payment/check-reward"

THAI_MONTHS_SHORT = {
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4,
    "พ.ค.": 5, "มิ.ย.": 6, "ก.ค.": 7, "ส.ค.": 8,
    "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
    "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
    "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
    "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
}


class GloScraper(BaseScraper):
    def __init__(self):
        super().__init__(rate_limit_min=0.8, rate_limit_max=1.5)

    # ── Requests-based fetch (no JS) ──────────────────────────────────────

    def _try_requests(self) -> Optional[dict]:
        try:
            resp = self.fetch(GLO_URL)
        except ScraperException as e:
            self.logger.warning(f"Requests fetch failed: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")
        result = self._parse_soup(soup)
        if result and result.get("prize1"):
            return result
        return None

    # ── Selenium fallback (JS-rendered page) ─────────────────────────────

    def _try_selenium(self) -> Optional[dict]:
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
        except ImportError:
            self.logger.error("selenium not installed — run: pip install selenium")
            return None

        opts = Options()
        opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument(f"--user-agent={self._get_headers()['User-Agent']}")

        driver = None
        try:
            self.logger.info("Launching headless Chrome for GLO page...")
            driver = webdriver.Chrome(options=opts)
            driver.set_page_load_timeout(30)
            driver.get(GLO_URL)

            # Wait for lottery number to appear
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".prize-number, .lotto-number, [class*='prize']"))
                )
            except Exception:
                pass  # Try parsing whatever is there

            soup = BeautifulSoup(driver.page_source, "lxml")
            return self._parse_soup(soup)
        except Exception as e:
            self.logger.error(f"Selenium scrape failed: {e}")
            return None
        finally:
            if driver:
                try:
                    driver.quit()
                except Exception:
                    pass

    # ── HTML parser ───────────────────────────────────────────────────────

    def _parse_soup(self, soup: BeautifulSoup) -> dict:
        data: dict = {"source": "glo"}

        # Date
        data["draw_date"] = self._extract_date(soup)

        # Prize 1
        for sel in [
            ".reward-prize1 .number", ".prize1-number", "[class*='prize1']",
            "div.reward:first-child .number", "td.prize1",
        ]:
            el = soup.select_one(sel)
            if el:
                text = re.sub(r"\D", "", el.get_text())
                if len(text) == 6:
                    data["prize1"] = text
                    break
        else:
            # Generic 6-digit search
            six_digit = re.compile(r"\b\d{6}\b")
            for el in soup.find_all(string=six_digit):
                m = six_digit.search(el)
                if m:
                    data["prize1"] = m.group()
                    break

        # Last 2
        for sel in [".reward-last2 .number", ".last2-number", "[class*='last2']"]:
            el = soup.select_one(sel)
            if el:
                text = re.sub(r"\D", "", el.get_text()).zfill(2)
                data["last2"] = text
                break

        # Last 3 back
        for sel in [".reward-last3 .number", ".last3-number", "[class*='last3']"]:
            els = soup.select(sel)
            values = []
            for e in els:
                text = re.sub(r"\D", "", e.get_text()).zfill(3)
                if len(text) == 3:
                    values.append(text)
            if values:
                data["last3_back"] = values[0]
                if len(values) > 1:
                    data["last3_front"] = values[1]
            break

        # Near prize 1
        near = []
        for sel in [".reward-near1 .number", "[class*='near1']", "[class*='near-1']"]:
            els = soup.select(sel)
            for e in els:
                text = re.sub(r"\D", "", e.get_text())
                if len(text) == 6:
                    near.append(text)
                if len(near) == 2:
                    break
        data["near1_1"] = near[0] if len(near) > 0 else None
        data["near1_2"] = near[1] if len(near) > 1 else None

        return data

    def _extract_date(self, soup: BeautifulSoup) -> Optional[str]:
        from datetime import datetime

        pattern = re.compile(r"(\d{1,2})\s+([ก-๙A-Za-z.]+)\s+(\d{4})")
        for tag in soup.find_all(["h1", "h2", "h3", "p", "div", "span"]):
            text = tag.get_text(strip=True)
            m = pattern.search(text)
            if not m:
                continue
            day, month_th, year_str = m.groups()
            month_num = THAI_MONTHS_SHORT.get(month_th)
            if not month_num:
                continue
            year = int(year_str)
            if year > 2500:
                year = self.buddhist_to_ad(year)
            try:
                return datetime(year, month_num, int(day)).strftime("%Y-%m-%d")
            except ValueError:
                continue
        return None

    # ── Public interface ──────────────────────────────────────────────────

    def scrape_latest(self) -> Optional[dict]:
        self.logger.info("Attempting GLO scrape via requests...")
        result = self._try_requests()
        if result and result.get("prize1"):
            self.logger.info(f"GLO requests scrape succeeded: {result.get('prize1')}")
            return result

        self.logger.info("Requests scrape insufficient, falling back to Selenium...")
        result = self._try_selenium()
        if result and result.get("prize1"):
            self.logger.info(f"GLO Selenium scrape succeeded: {result.get('prize1')}")
        elif result:
            self.logger.warning("GLO scrape returned data but no prize1 found")
        else:
            self.logger.error("GLO scrape failed with both methods")
        return result
