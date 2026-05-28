# Thai Lottery Statistics / สถิติสลากกินแบ่งรัฐบาล

> **ข้อมูลสถิติสลากกินแบ่งรัฐบาลไทย** พร้อม web scraper และ React frontend แบบ interactive
>
> Statistical analysis of Thai Government Lottery results — for **entertainment purposes only**.

---

## Screenshots

| ภาพรวม (Overview) | ความถี่ (Heatmap) | วิเคราะห์ (Prediction) |
|---|---|---|
| Hot/cold numbers, featured draw, digit chart | 10×10 frequency grid with filters | Ranked picks with score rings |

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.9+ | For the scraper |
| Node.js | 18+ | For the frontend |
| ChromeDriver | Match your Chrome | Only needed for GLO scraper (JS-rendered page) |
| pip | latest | `python -m pip install --upgrade pip` |

---

## Project Structure

```
thai-lottery-stats/
├── scraper/
│   ├── main.py                  # CLI entry point
│   ├── scrapers/
│   │   ├── base.py              # Base class: retry, rate-limit, user-agent rotation
│   │   ├── sanook.py            # Sanook historical scraper (2019–2024)
│   │   └── glo.py               # GLO official site (requests + Selenium fallback)
│   ├── database/
│   │   ├── models.py            # SQLite schema + connection helper
│   │   └── repository.py        # DB read/write functions
│   ├── export/
│   │   └── json_export.py       # DB → JSON for frontend
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx              # Root: theme context, tab nav, data loading
│       ├── index.css            # CSS design tokens + global styles
│       ├── themes.js            # 3 themes: สว่าง / โมเดิล / ยอดนิยม
│       ├── hooks/
│       │   └── useLotteryStats.js   # Frequency, gap, digit-dist, predictions
│       ├── components/
│       │   ├── Overview.jsx     # Featured draw, hot/cold balls, digit chart
│       │   ├── Heatmap.jsx      # 10×10 grid, filters, hover tooltips
│       │   ├── Prediction.jsx   # TOP PICKS with score rings + methodology
│       │   └── History.jsx      # Timeline list with year filter
│       └── data/
│           └── lottery_data.json    # Populated by scraper; app uses seed data as fallback
└── README.md
```

---

## Installation

### Scraper

```bash
cd thai-lottery-stats/scraper
python -m pip install -r requirements.txt
```

If you plan to use the GLO scraper (JavaScript-rendered page):
1. Install [ChromeDriver](https://chromedriver.chromium.org/downloads) matching your Chrome version
2. Ensure `chromedriver` is on your `$PATH`

### Frontend

```bash
cd thai-lottery-stats/frontend
npm install
```

---

## Usage

### Scraper CLI

```bash
cd scraper

# Scrape Sanook historical data (2019–2024)
python main.py scrape --source sanook --year-start 2019 --year-end 2024

# Scrape only the latest draw from Sanook
python main.py scrape --source sanook --latest

# Scrape latest draw from GLO official site
python main.py scrape --source glo --latest

# Export database to JSON for the frontend
python main.py export --output ../frontend/src/data/lottery_data.json

# Print database statistics
python main.py stats

# Use a custom database path
python main.py --db /path/to/my.db scrape --source sanook --latest
```

### Frontend

```bash
cd frontend

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Data Flow

```
Sanook / GLO websites
        ↓
   scraper/main.py (CLI)
        ↓
   SQLite (lottery.db)
        ↓
   json_export.py
        ↓
   frontend/src/data/lottery_data.json
        ↓
   App.jsx (loads JSON on mount)
        ↓
   useLotteryStats hook (computes frequency, gaps, predictions)
        ↓
   Overview / Heatmap / Prediction / History components
```

The frontend **always works offline** — if `lottery_data.json` is empty or missing, it falls back to 120 draws of deterministic seed data (2019–2023).

---

## Scoring Algorithm (Prediction Tab)

Each two-digit number 00–99 is scored:

```
score = (frequency_score × 0.40)
      + (gap_score       × 0.35)
      + (digit_score     × 0.25)
```

| Component | Description |
|---|---|
| frequency_score | How often the number appeared relative to the most frequent |
| gap_score | How long since last appearance (longer gap = higher score) |
| digit_score | Frequency of each individual digit across all draws |

---

## Design Tokens

```css
--bg:      #f8f9ff   /* page background (light theme)    */
--surface: #ffffff   /* card background                  */
--navy:    #1a1a2e   /* primary text / dark surfaces     */
--coral:   #e94560   /* accent / hot numbers             */
--gold:    #f5a623   /* lottery gold / rank #1           */
--teal:    #00b894   /* success / prize badges           */
--muted:   #636e72   /* secondary text                   */
--border:  #e2e8f0   /* card borders                     */
```

Number font: `JetBrains Mono` (loaded from Google Fonts) — all lottery digits use monospace for alignment.

---

## ⚠️ Disclaimer / ข้อจำกัดความรับผิดชอบ

**ภาษาไทย:** สลากกินแบ่งรัฐบาลเป็นการจับสลากแบบสุ่ม ข้อมูลสถิติในแอปนี้จัดทำขึ้นเพื่อความบันเทิงและการศึกษาเท่านั้น **ไม่สามารถนำไปใช้ทำนายผลรางวัลได้จริง** ผู้พัฒนาไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการนำข้อมูลนี้ไปใช้

**English:** The Thai Government Lottery is a random draw. Statistical data in this app is provided for **entertainment and educational purposes only** and cannot predict future results. The developers are not responsible for any losses arising from use of this information.

---

## Technical Notes

- **Idempotent scraping** — `INSERT OR IGNORE` ensures re-running the scraper never creates duplicates
- **Thai Buddhist year** — all scraped dates convert พ.ศ. → ค.ศ. by subtracting 543
- **Leading zeros** — all lottery numbers are zero-padded (`01` not `1`, `052` not `52`)
- **Rate limiting** — minimum 0.5s delay between requests; respects server resources
- **3 themes** — สว่าง (light), โมเดิล (liquid glass dark), ยอดนิยม (Thai red-gold warm)

---

## License

MIT — see [LICENSE](LICENSE) for details.
