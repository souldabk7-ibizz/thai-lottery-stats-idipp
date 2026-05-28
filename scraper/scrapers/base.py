import time
import random
import logging
from abc import ABC, abstractmethod
from datetime import datetime

import requests


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


class ScraperException(Exception):
    pass


USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]


class BaseScraper(ABC):
    def __init__(self, rate_limit_min: float = 0.5, rate_limit_max: float = 1.0, max_retries: int = 3):
        self.rate_limit_min = rate_limit_min
        self.rate_limit_max = rate_limit_max
        self.max_retries = max_retries
        self.session = requests.Session()
        self.logger = logging.getLogger(self.__class__.__name__)

    def _get_headers(self) -> dict:
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
        }

    def _rate_limit(self):
        delay = random.uniform(self.rate_limit_min, self.rate_limit_max)
        time.sleep(delay)

    def fetch(self, url: str, timeout: int = 15) -> requests.Response:
        last_exc = None
        for attempt in range(1, self.max_retries + 1):
            try:
                self._rate_limit()
                self.logger.info(f"Fetching (attempt {attempt}/{self.max_retries}): {url}")
                resp = self.session.get(url, headers=self._get_headers(), timeout=timeout)
                resp.raise_for_status()
                resp.encoding = resp.apparent_encoding or "utf-8"
                return resp
            except requests.exceptions.Timeout as e:
                last_exc = e
                self.logger.warning(f"Timeout on attempt {attempt} for {url}")
            except requests.exceptions.HTTPError as e:
                last_exc = e
                self.logger.warning(f"HTTP {e.response.status_code} on attempt {attempt} for {url}")
                if e.response.status_code in (403, 404, 410):
                    break
            except requests.exceptions.RequestException as e:
                last_exc = e
                self.logger.warning(f"Request error on attempt {attempt} for {url}: {e}")

            if attempt < self.max_retries:
                backoff = 2 ** attempt
                self.logger.info(f"Retrying in {backoff}s...")
                time.sleep(backoff)

        raise ScraperException(f"Failed to fetch {url} after {self.max_retries} attempts: {last_exc}")

    @staticmethod
    def buddhist_to_ad(year: int) -> int:
        """Convert Thai Buddhist Era year (พ.ศ.) to Anno Domini (ค.ศ.)."""
        return year - 543

    @abstractmethod
    def scrape_latest(self) -> dict:
        pass
