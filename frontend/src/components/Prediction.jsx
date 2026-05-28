import { useState, useEffect } from 'react'
import { useT } from '../App'
import { mkCard } from '../themes'

function ScoreRing({ pct, sz = 54, color }) {
  const { T } = useT()
  const col = color || T.gold
  const r = (sz - 8) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={sz} height={sz} style={{ flexShrink: 0 }}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={T.track} strokeWidth={5}/>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={col} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round"
        style={{ transform: `rotate(-90deg)`, transformOrigin: `${sz/2}px ${sz/2}px`, transition: 'stroke-dashoffset 1.1s ease' }}/>
      <text x={sz/2} y={sz/2} textAnchor="middle" dominantBaseline="central"
        fill={col} fontSize={sz * 0.22} fontWeight="800" fontFamily="JetBrains Mono,monospace">
        {Math.round(pct)}
      </text>
    </svg>
  )
}

function Badge({ label, color }) {
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}33`,
      borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 600,
    }}>{label}</span>
  )
}

function PredCard({ pred, rank, maxScore, ready }) {
  const { T } = useT()
  const RANK_COLORS = [T.gold, T.blueL, T.blueL, T.green, T.green]
  const col = RANK_COLORS[rank - 1]
  const pct = maxScore > 0 ? (pred.score / maxScore) * 100 : 0
  const big = rank === 1

  return (
    <div style={{
      ...mkCard(T, { borderRadius: big ? 22 : 16, padding: big ? 20 : 14 }),
      border: big ? `1.5px solid ${col}50` : undefined,
      boxShadow: big ? `0 0 0 5px ${col}10, 0 12px 40px rgba(0,0,0,0.4)` : undefined,
      animation: big ? 'glowGold 3.2s ease-in-out infinite' : 'none',
      position: 'relative', overflow: 'hidden',
    }}>
      {big && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: `${col}25`, backdropFilter: 'blur(8px)',
          color: col, fontSize: 9, fontWeight: 800,
          padding: '4px 11px', borderBottomLeftRadius: 12, letterSpacing: '0.07em',
        }}>TOP PICK</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: big ? 34 : 24, height: big ? 34 : 24, borderRadius: '50%',
          background: `${col}20`, border: `1px solid ${col}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: col, fontWeight: 800, fontSize: big ? 15 : 11, flexShrink: 0,
        }}>{rank}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{
            fontSize: big ? 32 : 22, fontWeight: 800,
            color: big ? col : T.text, letterSpacing: '0.05em', lineHeight: 1,
          }}>{pred.num}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
            <Badge label={`ถี่ ${pred.freq}x`} color={T.accent}/>
            <Badge label="ช่วงห่าง" color={T.blue}/>
            <Badge label="รูปแบบ" color={T.purple}/>
          </div>
        </div>

        <ScoreRing pct={pct} sz={big ? 58 : 44} color={col}/>
      </div>

      {big && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
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

          {/* Factor breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
            {[
              { label: 'ความถี่', score: pred.freqScore, color: T.accent },
              { label: 'ช่วงห่าง', score: pred.gapScore, color: T.blue },
              { label: 'รูปแบบ', score: pred.digitScore, color: T.purple },
            ].map((f, i) => (
              <div key={i} style={{
                background: `${f.color}10`, border: `1px solid ${f.color}25`,
                borderRadius: 10, padding: '8px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, color: T.muted, marginBottom: 3 }}>{f.label}</div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: f.color }}>
                  {(f.score * 100).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Prediction({ draws, stats }) {
  const { T } = useT()
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 180); return () => clearTimeout(t) }, [])

  const { predictions } = stats
  const maxScore = predictions[0]?.score ?? 1

  return (
    <div className="tabIn" style={{ padding: '14px 14px 32px' }}>
      {/* Disclaimer */}
      <div style={{
        ...mkCard(T, { borderRadius: 15, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }),
        background: T.blur && T.blur !== 'none' ? `${T.gold}10` : `${T.gold}15`,
        border: `1px solid ${T.gold}30`,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
        <div style={{ fontSize: 12, color: T.blur && T.blur !== 'none' ? 'rgba(255,220,120,0.9)' : '#7a5500', lineHeight: 1.7 }}>
          สลากกินแบ่งเป็นการจับสลากแบบสุ่ม ข้อมูลสถิตินี้ใช้เพื่อความบันเทิงเท่านั้น{' '}
          <strong style={{ color: T.gold }}>ไม่สามารถทำนายผลได้จริง</strong>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12, letterSpacing: '0.04em' }}>
        TOP PICKS <span style={{ color: T.gold }}>งวดถัดไป</span>
      </div>

      {predictions.length === 0 ? (
        <div style={{ color: T.muted, textAlign: 'center', padding: 40 }}>ไม่มีข้อมูลเพียงพอ</div>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            <PredCard pred={predictions[0]} rank={1} maxScore={maxScore} ready={ready}/>
          </div>
          {predictions.slice(1, 3).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 9 }}>
              {predictions.slice(1, 3).map((p, i) => (
                <PredCard key={p.num} pred={p} rank={i + 2} maxScore={maxScore} ready={ready}/>
              ))}
            </div>
          )}
          {predictions.slice(3, 5).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {predictions.slice(3, 5).map((p, i) => (
                <PredCard key={p.num} pred={p} rank={i + 4} maxScore={maxScore} ready={ready}/>
              ))}
            </div>
          )}
        </>
      )}

      {/* Methodology note */}
      <div style={{ ...mkCard(T, { borderRadius: 14, padding: '14px 16px', marginTop: 16 }) }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: T.text, marginBottom: 8 }}>วิธีคำนวณคะแนน</div>
        {[
          { label: 'ความถี่ (40%)', desc: 'จำนวนครั้งที่ตัวเลขออกในอดีต', color: T.accent },
          { label: 'ช่วงห่าง (35%)', desc: 'นานแค่ไหนที่ตัวเลขไม่ออก', color: T.blue },
          { label: 'รูปแบบตัวเลข (25%)', desc: 'ความถี่ของแต่ละหลัก', color: T.purple },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
            <div style={{ width: 3, background: item.color, borderRadius: 2, flexShrink: 0 }}/>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{item.label}</div>
              <div style={{ fontSize: 10, color: T.muted }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
