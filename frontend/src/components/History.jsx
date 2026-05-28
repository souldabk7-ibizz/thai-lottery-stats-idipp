import { useState, useMemo } from 'react'
import { useT, fmtD } from '../App'
import { mkCard } from '../themes'

export default function History({ draws, stats }) {
  const { T } = useT()
  const [show, setShow] = useState(24)
  const [yearFilter, setYearFilter] = useState('all')

  const hotSet = useMemo(() => new Set(stats.hotNumbers.map(h => h.num)), [stats])

  const years = useMemo(() => {
    const ys = [...new Set(draws.map(d => d.date.slice(0, 4)))].sort((a, b) => b - a)
    return ys
  }, [draws])

  const filtered = useMemo(() => {
    if (yearFilter === 'all') return draws
    return draws.filter(d => d.date.startsWith(yearFilter))
  }, [draws, yearFilter])

  return (
    <div className="tabIn" style={{ padding: '14px 14px 32px' }}>
      {/* Year filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
        {[{ id: 'all', label: 'ทุกปี' }, ...years.map(y => ({ id: y, label: `${y}` }))].map(({ id, label }) => (
          <button key={id} onClick={() => { setYearFilter(id); setShow(24) }} style={{
            ...mkCard(T, { padding: '5px 14px', borderRadius: 20, fontSize: 13, transition: 'all 0.18s', whiteSpace: 'nowrap', flexShrink: 0 }),
            background: yearFilter === id ? T.glassBright : T.card,
            border: `1px solid ${yearFilter === id ? T.border + '88' : T.border}`,
            color: yearFilter === id ? T.text : T.muted,
            fontWeight: yearFilter === id ? 700 : 400,
          }}>{label}</button>
        ))}
      </div>

      {/* Draw list */}
      <div style={{ ...mkCard(T, { borderRadius: 18, overflow: 'hidden' }), padding: 0 }}>
        {filtered.slice(0, show).map((d, i) => {
          const isHotLast2 = hotSet.has(d.last2)
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
              background: i % 2 === 0 ? 'transparent' : T.rowOdd,
              borderBottom: `1px solid ${T.rowBd}`,
            }}>
              {/* Date pill */}
              <div style={{
                background: T.dPill, border: `1px solid ${T.border}`, color: T.dPillTxt,
                borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 600,
                minWidth: 76, textAlign: 'center', flexShrink: 0,
                ...(T.blur && T.blur !== 'none' ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : {}),
              }}>{fmtD(d.date)}</div>

              {/* Prize number */}
              <div style={{ flex: 1, fontFamily: 'JetBrains Mono,monospace', fontSize: 16, fontWeight: 600 }}>
                <span style={{ color: T.muted }}>{d.prize1 ? d.prize1.slice(0, 4) : '????'}</span>
                <span style={{
                  color: T.accent, fontWeight: 800,
                  background: `${T.accent}14`, borderRadius: 4, padding: '0 2px',
                }}>{d.last2 || d.prize1?.slice(-2) || '??'}</span>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div style={{
                  background: `${T.gold}18`, border: `1px solid ${T.gold}28`, color: T.gold,
                  borderRadius: 7, padding: '3px 8px', fontSize: 10, fontWeight: 700,
                }}>รางวัลที่ 1</div>
                {isHotLast2 && (
                  <div style={{
                    background: `${T.accent}15`, border: `1px solid ${T.accent}30`, color: T.accent,
                    borderRadius: 7, padding: '3px 7px', fontSize: 10, fontWeight: 700,
                  }}>🔥 ร้อน</div>
                )}
                {d.last3_back && (
                  <div style={{
                    background: `${T.blue}15`, border: `1px solid ${T.blue}30`, color: T.blue,
                    borderRadius: 7, padding: '3px 8px', fontSize: 10, fontWeight: 600,
                  }} className="mono">{d.last3_back}</div>
                )}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>ไม่มีข้อมูลในปีที่เลือก</div>
        )}
      </div>

      {/* Load more */}
      {show < filtered.length && (
        <button onClick={() => setShow(s => Math.min(s + 20, filtered.length))} style={{
          display: 'block', width: '100%', marginTop: 14, padding: 13,
          ...mkCard(T, { borderRadius: 14 }),
          color: T.text, fontSize: 14, fontWeight: 600,
        }}>
          โหลดเพิ่ม ({filtered.length - show} รายการ)
        </button>
      )}

      {/* Stats footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
        {[
          { label: 'งวดทั้งหมด', value: filtered.length },
          { label: 'ปีที่แสดง', value: yearFilter === 'all' ? `${years.length} ปี` : yearFilter },
          { label: 'กำลังแสดง', value: Math.min(show, filtered.length) },
        ].map((item, i) => (
          <div key={i} style={{ ...mkCard(T, { borderRadius: 12, padding: '10px 12px', textAlign: 'center' }) }}>
            <div style={{ fontSize: 9, color: T.muted, marginBottom: 3 }}>{item.label}</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
