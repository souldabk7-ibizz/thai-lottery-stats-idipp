import { useState, useEffect } from 'react'
import { useT } from '../App'
import { mkCard } from '../themes'

const RANK_COLORS = ['#f5a623', '#74b9ff', '#74b9ff', '#00b894', '#00b894']

function ScoreRing({ pct, sz = 54, color }) {
  const { T } = useT()
  const r = (sz - 8) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={sz} height={sz} style={{ flexShrink: 0 }}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={T.track} strokeWidth={5}/>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round"
        style={{ transform: `rotate(-90deg)`, transformOrigin: `${sz/2}px ${sz/2}px`, transition: 'stroke-dashoffset 1.1s ease' }}/>
      <text x={sz/2} y={sz/2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={sz * 0.22} fontWeight="800" fontFamily="JetBrains Mono,monospace">
        {Math.round(pct)}
      </text>
    </svg>
  )
}

function SourceBars({ sources, ready }) {
  const { T } = useT()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
      {sources.map((s, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: T.muted }}>{s.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono,monospace' }}>
              {s.pct}/{s.max}
            </span>
          </div>
          <div style={{ height: 5, background: T.track, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3, background: s.color,
              width: ready ? `${Math.min((s.pct / s.max) * 100, 100)}%` : '0%',
              transition: `width 0.9s ease ${i * 0.1}s`,
            }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

function SourceTags({ sources }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
      {sources.filter(s => s.pct > 0).map((s, i) => (
        <span key={i} style={{
          background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}35`,
          borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 600,
        }}>{s.name}</span>
      ))}
    </div>
  )
}

function PredCard({ pred, rank, maxScore, ready, digits }) {
  const { T } = useT()
  const col = RANK_COLORS[rank - 1]
  const pct = maxScore > 0 ? (pred.score / maxScore) * 100 : 0
  const big = rank === 1

  return (
    <div style={{
      ...mkCard(T, { borderRadius: big ? 22 : 16, padding: big ? 20 : 14 }),
      border: big ? `1.5px solid ${col}50` : undefined,
      boxShadow: big ? `0 0 0 5px ${col}10, 0 12px 40px rgba(0,0,0,0.12)` : undefined,
      position: 'relative', overflow: 'hidden',
    }}>
      {big && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: `${col}22`, color: col, fontSize: 9, fontWeight: 800,
          padding: '4px 11px', borderBottomLeftRadius: 12, letterSpacing: '0.07em',
        }}>TOP PICK</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: big ? 34 : 24, height: big ? 34 : 24, borderRadius: '50%',
          background: `${col}20`, border: `1px solid ${col}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: col, fontWeight: 800, fontSize: big ? 15 : 11, flexShrink: 0,
        }}>{rank}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{
            fontSize: big ? (digits === 3 ? 26 : 32) : (digits === 3 ? 20 : 22),
            fontWeight: 800, color: big ? col : T.text, letterSpacing: '0.06em', lineHeight: 1,
          }}>{pred.num}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{
              background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30`,
              borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 600,
            }}>ออก {pred.freq}ครั้ง</span>
            <span style={{
              background: `${T.blue}15`, color: T.blue, border: `1px solid ${T.blue}30`,
              borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 600,
            }}>ค้าง {pred.gap}งวด</span>
          </div>
        </div>

        <ScoreRing pct={pct} sz={big ? 58 : 44} color={col}/>
      </div>

      {big ? (
        <>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: T.muted }}>คะแนนรวม</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{pct.toFixed(0)}%</span>
            </div>
            <div style={{ height: 6, background: T.track, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: `linear-gradient(90deg,${col},${T.accent})`,
                width: ready ? `${pct}%` : '0%',
                transition: 'width 1.1s ease',
              }}/>
            </div>
          </div>
          <SourceBars sources={pred.sources} ready={ready} />
        </>
      ) : (
        <SourceTags sources={pred.sources} />
      )}
    </div>
  )
}

function AlgoLegend({ sources }) {
  const { T } = useT()
  return (
    <div style={{ ...mkCard(T, { borderRadius: 14, padding: '14px 16px', marginTop: 16 }) }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: T.text, marginBottom: 10 }}>
        วิธีวิเคราะห์จากหลายแหล่ง
      </div>
      {sources.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < sources.length - 1 ? 8 : 0 }}>
          <div style={{ width: 3, background: s.color, borderRadius: 2, flexShrink: 0, minHeight: 32 }}/>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>
              {s.name}
              <span style={{ color: T.muted, fontWeight: 400, marginLeft: 4 }}>({s.weight}%)</span>
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const ALGO_2 = [
  { name: 'ความถี่',     weight: 40, color: '#e94560', desc: 'จำนวนครั้งที่เลขนี้ออกในประวัติ' },
  { name: 'เลขค้าง',    weight: 30, color: '#0984e3', desc: 'นานแค่ไหนที่เลขนี้ไม่ออก (ค้างนาน = โอกาสสูง)' },
  { name: 'รูปแบบหลัก', weight: 15, color: '#6c5ce7', desc: 'ความถี่ของแต่ละหลัก 0–9 ในตัวเลข' },
  { name: 'ผลรวมหลัก',  weight: 10, color: '#00b894', desc: 'เลขที่มีผลรวมหลักใกล้เคียงกับเลขออกบ่อย' },
  { name: 'ใกล้เคียง',  weight:  5, color: '#f5a623', desc: 'เลขที่อยู่ใกล้กับผู้ชนะ 5 งวดล่าสุด (±5)' },
]

const ALGO_3 = [
  { name: 'ความถี่ 3 ตัว',  weight: 35, color: '#e94560', desc: 'จำนวนครั้งที่เลขท้าย 3 ตัวนี้ออก' },
  { name: 'เลขค้าง',        weight: 30, color: '#0984e3', desc: 'นานแค่ไหนที่เลขท้าย 3 ตัวนี้ไม่ออก' },
  { name: 'สัมพันธ์ 2 ตัว', weight: 25, color: '#f5a623', desc: '2 ตัวท้ายตรงกับเลขเด็ด 2 ตัวที่คาดการณ์ไว้' },
  { name: 'รูปแบบหลัก',     weight: 10, color: '#6c5ce7', desc: 'ความถี่ของแต่ละหลักในเลข 3 ตัว' },
]

export default function Prediction({ draws, stats }) {
  const { T } = useT()
  const [ready, setReady] = useState(false)
  const [digit, setDigit] = useState(2)
  useEffect(() => { const t = setTimeout(() => setReady(true), 180); return () => clearTimeout(t) }, [])

  const preds = digit === 2 ? stats.predictions : stats.predictions3
  const maxScore = preds[0]?.score ?? 1

  return (
    <div className="tabIn" style={{ padding: '14px 14px 32px' }}>

      {/* Disclaimer */}
      <div style={{
        borderRadius: 15, padding: '10px 14px', marginBottom: 14,
        display: 'flex', gap: 10, alignItems: 'flex-start',
        background: `${T.gold}15`, border: `1px solid ${T.gold}30`,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
        <div style={{ fontSize: 11, color: '#7a5500', lineHeight: 1.7 }}>
          สลากเป็นการจับสลากแบบสุ่ม ข้อมูลนี้ใช้เพื่อความบันเทิงเท่านั้น{' '}
          <strong style={{ color: '#b07800' }}>ไม่สามารถทำนายผลได้จริง</strong>
        </div>
      </div>

      {/* Digit toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[2, 3].map(d => (
          <button key={d} onClick={() => setDigit(d)} style={{
            flex: 1, padding: '10px 0', borderRadius: 14, fontSize: 13, fontWeight: 700,
            border: `1.5px solid ${digit === d ? T.accent : T.border}`,
            background: digit === d ? `${T.accent}15` : T.card,
            color: digit === d ? T.accent : T.muted,
            transition: 'all 0.2s', cursor: 'pointer',
          }}>
            เลข {d} ตัวท้าย
          </button>
        ))}
      </div>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
          TOP PICKS <span style={{ color: T.gold }}>เลขเด็ดงวดหน้า</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600,
          background: `${T.purple}18`, color: T.purple,
          border: `1px solid ${T.purple}30`, borderRadius: 6, padding: '2px 8px',
        }}>{digit === 2 ? '5 อัลกอริทึม' : '4 อัลกอริทึม'}</span>
      </div>

      {preds.length === 0 ? (
        <div style={{ ...mkCard(T, { borderRadius: 16, padding: 40, textAlign: 'center' }) }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ color: T.muted, fontSize: 13 }}>
            {digit === 3
              ? 'เลข 3 ตัวจะมีเมื่อ scraper ดึงข้อมูลจริงจาก Sanook'
              : 'ไม่มีข้อมูลเพียงพอ'}
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            <PredCard pred={preds[0]} rank={1} maxScore={maxScore} ready={ready} digits={digit}/>
          </div>
          {preds.slice(1, 3).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 9 }}>
              {preds.slice(1, 3).map((p, i) => (
                <PredCard key={p.num} pred={p} rank={i + 2} maxScore={maxScore} ready={ready} digits={digit}/>
              ))}
            </div>
          )}
          {preds.slice(3, 5).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {preds.slice(3, 5).map((p, i) => (
                <PredCard key={p.num} pred={p} rank={i + 4} maxScore={maxScore} ready={ready} digits={digit}/>
              ))}
            </div>
          )}
        </>
      )}

      <AlgoLegend sources={digit === 2 ? ALGO_2 : ALGO_3} />
    </div>
  )
}
