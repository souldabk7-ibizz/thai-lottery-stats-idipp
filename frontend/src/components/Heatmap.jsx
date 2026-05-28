import { useState } from 'react'
import { useT, fmtD } from '../App'
import { mkCard } from '../themes'

const p2 = n => String(n).padStart(2, '0')

const FILTERS = [
  { id: 'all',    label: 'ทั้งหมด'  },
  { id: 'even',   label: 'เลขคู่'  },
  { id: 'odd',    label: 'เลขคี่'  },
  { id: 'double', label: 'เลขเบิ้ล' },
]

export default function Heatmap({ draws, stats }) {
  const { T } = useT()
  const [filter, setFilter] = useState('all')
  const [hover, setHover] = useState(null)
  const { frequencyMap, lastSeen } = stats

  const maxFreq = Math.max(...Object.values(frequencyMap), 1)

  function cellColor(f) {
    const idx = Math.min(Math.floor((f / maxFreq) * (T.hmC.length - 1)), T.hmC.length - 1)
    return T.hmC[idx]
  }

  function cellTextColor(f) {
    const idx = Math.min(Math.floor((f / maxFreq) * (T.hmC.length - 1)), T.hmC.length - 1)
    return idx >= T.hmTh ? T.hmHi : T.hmLo
  }

  function isVisible(n) {
    const v = parseInt(n, 10)
    if (filter === 'even')   return v % 2 === 0
    if (filter === 'odd')    return v % 2 !== 0
    if (filter === 'double') return Math.floor(v / 10) === v % 10
    return true
  }

  function getLastSeenLabel(n) {
    if (lastSeen[n] == null) return 'ยังไม่เคยออก'
    const idx = lastSeen[n]
    const draw = draws[idx]
    return draw ? `งวด ${fmtD(draw.date)}` : `${idx + 1} งวดก่อน`
  }

  return (
    <div className="tabIn" style={{ padding: '14px 14px 32px' }}>
      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            ...mkCard(T, { padding: '6px 15px', borderRadius: 20, fontSize: 13, transition: 'all 0.18s' }),
            background: filter === id ? T.glassBright : T.card,
            border: `1px solid ${filter === id ? T.border + '88' : T.border}`,
            color: filter === id ? T.text : T.muted,
            fontWeight: filter === id ? 700 : 400,
          }}>{label}</button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 13 }}>
        <span style={{ fontSize: 10, color: T.muted, marginRight: 3 }}>ความถี่:</span>
        {T.hmC.map((col, i) => (
          <div key={i} style={{ width: 24, height: 13, background: col, borderRadius: 3, border: `1px solid ${T.border}` }}/>
        ))}
        <span style={{ fontSize: 10, color: T.muted, marginLeft: 3 }}>มาก</span>
      </div>

      {/* Grid */}
      <div style={{ ...mkCard(T, { borderRadius: 18, padding: 11 }) }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 4 }}>
          {Array.from({ length: 100 }, (_, i) => {
            const n = p2(i)
            const f = frequencyMap[n] || 0
            const vis = isVisible(n)
            const isHov = hover === n

            return (
              <div
                key={n}
                className="cell"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(null)}
                style={{
                  animationDelay: `${i * 9}ms`,
                  aspectRatio: '1',
                  borderRadius: 7,
                  background: vis ? cellColor(f) : (T.blur && T.blur !== 'none' ? 'rgba(255,255,255,0.03)' : 'rgba(26,26,46,0.04)'),
                  border: `1px solid ${vis ? T.border : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace',
                  color: vis ? cellTextColor(f) : T.muted,
                  cursor: 'pointer', position: 'relative', zIndex: isHov ? 10 : 1,
                  transform: isHov ? 'scale(1.38)' : 'scale(1)',
                  transition: 'transform 0.14s ease',
                  boxShadow: isHov ? '0 6px 20px rgba(0,0,0,0.5)' : 'none',
                }}
              >
                {n}
                {isHov && vis && (
                  <div style={{
                    position: 'absolute', bottom: '118%', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(4,3,14,0.92)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.14)', color: '#fff',
                    padding: '5px 10px', borderRadius: 7, fontSize: 10, whiteSpace: 'nowrap',
                    pointerEvents: 'none', zIndex: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    lineHeight: 1.6,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 1 }}>เลข {n}</div>
                    <div>ออก {f} ครั้ง</div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>{getLastSeenLabel(n)}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary below grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
        {[
          { label: 'เลขออกบ่อยสุด', value: stats.hotNumbers[0]?.num ?? '–', sub: `${stats.hotNumbers[0]?.count ?? 0} ครั้ง`, color: T.accent },
          { label: 'เลขค้างนานสุด', value: stats.coldNumbers[0]?.num ?? '–', sub: `${stats.coldNumbers[0]?.gap ?? 0} งวดแล้ว`, color: T.blue },
        ].map((item, i) => (
          <div key={i} style={{ ...mkCard(T, { borderRadius: 14, padding: '12px 14px' }) }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{item.label}</div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
