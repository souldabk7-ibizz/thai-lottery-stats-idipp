import { useState, useEffect, createContext, useContext } from 'react'
import { THEME } from './themes'
import { useLotteryStats } from './hooks/useLotteryStats'
import Overview from './components/Overview'
import Heatmap from './components/Heatmap'
import Prediction from './components/Prediction'
import History from './components/History'

/* ─── Seed data: 2019–2026 (BE 2562–2569), deterministic LCG ─── */
const p2 = n => String(n).padStart(2, '0')
const p3 = n => String(n).padStart(3, '0')
const p6 = n => String(n).padStart(6, '0')

class LCG {
  constructor(s) { this.s = s >>> 0 }
  next() { this.s = (Math.imul(1664525, this.s) + 1013904223) >>> 0; return this.s / 0x100000000 }
  int(lo, hi) { return Math.floor(this.next() * (hi - lo + 1)) + lo }
}

function generateSeedDraws() {
  const rng = new LCG(9871), out = []
  // Include all draws up to the latest published draw (16 May 2026)
  const CUTOFF = '2026-05-16'
  for (let y = 2019; y <= 2026; y++) {
    for (let m = 0; m < 12; m++) {
      for (const day of [1, 16]) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        if (dateStr > CUTOFF) continue
        const p = rng.int(100000, 999999), s = p6(p)
        out.push({
          date: dateStr,
          prize1: s,
          last2: s.slice(-2),
          last3_front: p3(rng.int(0, 999)),
          last3_back:  p3(rng.int(0, 999)),
          near1_1: p6(p > 100000 ? p - 1 : 999999),
          near1_2: p6(p < 999999 ? p + 1 : 100000),
          source: 'seed',
        })
      }
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

const SEED_DRAWS = generateSeedDraws()

/* ─── Theme context (single light theme) ─── */
export const ThemeCtx = createContext({ T: THEME })
export const useT = () => useContext(ThemeCtx)

/* ─── Date formatter (AD → BE display) ─── */
const MO = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
export const fmtD = dateStr => {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MO[d.getMonth()]} ${String(d.getFullYear() + 543).slice(-2)}`
}

export function nextDrawDate() {
  const n = new Date()
  const y = n.getFullYear(), mo = n.getMonth() + 1, d = n.getDate()
  if (d < 16) return `${y}-${String(mo).padStart(2,'0')}-16`
  const nm = mo === 12 ? 1 : mo + 1
  const ny = mo === 12 ? y + 1 : y
  return `${ny}-${String(nm).padStart(2,'0')}-01`
}

const TABS = [
  { id: 'overview',  label: 'ภาพรวม'   },
  { id: 'frequency', label: 'ความถี่'   },
  { id: 'analysis',  label: 'วิเคราะห์' },
  { id: 'history',   label: 'ประวัติ'   },
]

/* ─── Header ─── */
function TopBar({ draws }) {
  const { T } = useT()
  const stats = useLotteryStats(draws)
  const latest = draws[0]
  const hot  = stats.hotNumbers[0]
  const cold = stats.coldNumbers[0]

  return (
    <div style={{
      background: T.headerBg,
      padding: '16px 16px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      position: 'relative', zIndex: 10,
    }}>
      {/* Logo row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: `linear-gradient(135deg,${T.gold},${T.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
            flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5.5" width="20" height="13" rx="2.5" stroke="white" strokeWidth="1.6"/>
              <line x1="8" y1="5.5" x2="8" y2="18.5" stroke="white" strokeWidth="1.3" strokeDasharray="2 1.8" strokeLinecap="round"/>
              <path d="M15.5 9.5l.75 1.55 1.65.24-1.2 1.17.28 1.65-1.48-.78-1.48.78.28-1.65-1.2-1.17 1.65-.24z" fill="white"/>
              <line x1="3.5" y1="10.5" x2="6.5" y2="10.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="3.5" y1="13.5" x2="6.5" y2="13.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '0.07em', lineHeight: 1 }}>
              LOTTO <span style={{ color: T.gold }}>STATS</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.40)', fontSize: 10, marginTop: 2 }}>โดย iDipp Analytics</div>
          </div>
        </div>

        {latest && (
          <div style={{
            background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.35)',
            borderRadius: 22, padding: '5px 13px',
            color: T.gold, fontSize: 11, fontWeight: 600, flexShrink: 0,
          }}>งวด {fmtD(latest.date)}</div>
        )}
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {[
          { lbl: 'งวดที่วิเคราะห์', val: `${draws.length} งวด` },
          { lbl: 'เลขร้อน 🔥',      val: hot?.num  ?? '–', sub: hot  ? `${hot.count} ครั้ง`     : '' },
          { lbl: 'เลขเย็น ❄️',      val: cold?.num ?? '–', sub: cold ? `${cold.gap} งวดแล้ว` : '' },
          { lbl: 'งวดถัดไป',        val: fmtD(nextDrawDate()) },
        ].map((p, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 13, padding: '9px 14px', minWidth: 108, flexShrink: 0,
          }}>
            <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10, marginBottom: 3 }}>{p.lbl}</div>
            <div style={{
              color: '#fff', fontWeight: 700, fontSize: 18,
              fontFamily: /^\d{2}$/.test(p.val) ? 'JetBrains Mono,monospace' : 'inherit',
            }}>{p.val}</div>
            {p.sub && <div style={{ color: T.gold, fontSize: 10, marginTop: 1 }}>{p.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Tab nav ─── */
function TabNav({ active, onChange }) {
  const { T } = useT()
  return (
    <div style={{
      background: T.navBg,
      padding: '9px 16px',
      display: 'flex', gap: 6, overflowX: 'auto',
      borderBottom: `1px solid ${T.navBorder}`,
      position: 'relative', zIndex: 10,
      boxShadow: '0 1px 0 rgba(26,26,46,0.04)',
    }}>
      {TABS.map(t => {
        const on = active === t.id
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            padding: '7px 18px', borderRadius: 22,
            border: `1px solid ${on ? 'rgba(26,26,46,0.10)' : 'transparent'}`,
            fontSize: 14, fontWeight: on ? 700 : 500, whiteSpace: 'nowrap', flexShrink: 0,
            background: on ? T.tabActiveBg : 'transparent',
            color: on ? T.tabActiveColor : T.tabInactiveColor,
            transition: 'all 0.2s ease',
          }}>{t.label}</button>
        )
      })}
    </div>
  )
}

/* ─── App ─── */
export default function App() {
  const [tab, setTab] = useState('overview')
  const [draws, setDraws] = useState(SEED_DRAWS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.style.background = THEME.bodyBg
    return () => { document.body.style.background = '' }
  }, [])

  // Try to load real JSON data exported by scraper; fall back to seed
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'lottery_data.json')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.draws?.length > 0) {
          setDraws(json.draws.sort((a, b) => b.date.localeCompare(a.date)))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = useLotteryStats(draws)

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: THEME.bodyBg,
        color: THEME.muted, fontSize: 15, fontFamily: 'Sarabun,sans-serif',
      }}>
        กำลังโหลดข้อมูล…
      </div>
    )
  }

  return (
    <ThemeCtx.Provider value={{ T: THEME }}>
      <div className="app-shell" style={{ background: THEME.bodyBg }}>
        <div className="sticky-top">
          <TopBar draws={draws} />
          <TabNav active={tab} onChange={setTab} />
        </div>
        <div key={tab} className="scroll-area">
          {tab === 'overview'  && <Overview   draws={draws} stats={stats} />}
          {tab === 'frequency' && <Heatmap    draws={draws} stats={stats} />}
          {tab === 'analysis'  && <Prediction draws={draws} stats={stats} />}
          {tab === 'history'   && <History    draws={draws} stats={stats} />}
        </div>
      </div>
    </ThemeCtx.Provider>
  )
}
