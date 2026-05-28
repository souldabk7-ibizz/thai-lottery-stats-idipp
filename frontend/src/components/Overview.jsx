import { useRef, useEffect } from 'react'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'
import { useT, fmtD } from '../App'
import { mkCard } from '../themes'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

function Ball({ n, type, count, delay }) {
  const { T } = useT()
  const hot = type === 'hot'
  return (
    <div className="ball" style={{ animationDelay: `${delay}ms`, textAlign: 'center' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', margin: '0 auto 5px',
        background: hot
          ? `linear-gradient(145deg,${T.accent},#b83050)`
          : `linear-gradient(145deg,${T.blueL},${T.blue})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 16,
        fontFamily: 'JetBrains Mono,monospace',
        boxShadow: hot
          ? `0 5px 20px ${T.accent}50, inset 0 1px 0 rgba(255,255,255,0.28)`
          : `0 5px 20px ${T.blue}45, inset 0 1px 0 rgba(255,255,255,0.28)`,
      }}>{n}</div>
      <div style={{ fontSize: 10, color: T.muted }}>{hot ? `🔥 ${count}ครั้ง` : `❄️ ${count}งวด`}</div>
    </div>
  )
}

function Pill3({ n, type, count, delay }) {
  const { T } = useT()
  const hot = type === 'hot'
  return (
    <div className="ball" style={{ animationDelay: `${delay}ms`, textAlign: 'center', flex: '1 0 0' }}>
      <div style={{
        height: 44, borderRadius: 12, margin: '0 auto 5px',
        background: hot
          ? `linear-gradient(145deg,${T.accent},#b83050)`
          : `linear-gradient(145deg,${T.purple},#4a3a9a)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 15,
        fontFamily: 'JetBrains Mono,monospace',
        boxShadow: hot ? `0 4px 16px ${T.accent}45` : `0 4px 16px ${T.purple}45`,
      }}>{n}</div>
      <div style={{ fontSize: 10, color: T.muted }}>{hot ? `🔥 ${count}ครั้ง` : `❄️ ${count}งวด`}</div>
    </div>
  )
}

function SectionHead({ label, c1, c2 }) {
  const { T } = useT()
  return (
    <div className="section-head">
      <div className="section-head-bar" style={{ background: `linear-gradient(${c1},${c2})` }}/>
      <span className="section-head-label" style={{ color: T.text }}>{label}</span>
    </div>
  )
}

export default function Overview({ draws, stats }) {
  const { T, themeId } = useT()
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const latest = draws[0]

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const mx = Math.max(...stats.digitDist.map(Number))
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: '0123456789'.split(''),
        datasets: [{
          data: stats.digitDist.map(Number),
          borderRadius: 7,
          borderWidth: 0,
          backgroundColor: stats.digitDist.map(v => {
            const r = Number(v) / mx
            return r > 0.84 ? `${T.accent}dd` : r > 0.64 ? `${T.gold}dd` : `${T.blueL}cc`
          }),
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(4,3,14,0.90)',
            borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
            titleColor: 'rgba(255,255,255,0.9)', bodyColor: 'rgba(255,255,255,0.65)',
            callbacks: { label: ctx => `${ctx.parsed.y}%` },
          },
        },
        scales: {
          x: {
            grid: { display: false }, border: { display: false },
            ticks: { font: { family: 'JetBrains Mono', size: 13, weight: 'bold' }, color: T.cTickX },
          },
          y: {
            grid: { color: T.cGrid }, border: { display: false },
            ticks: { font: { family: 'Sarabun', size: 11 }, color: T.cTickY },
          },
        },
        animation: { duration: 900, easing: 'easeOutQuart' },
      },
    })
    return () => chartRef.current?.destroy()
  }, [themeId, stats])

  if (!latest) return null

  return (
    <div className="tabIn" style={{ paddingBottom: 32 }}>
      {/* Featured card */}
      <div style={{
        margin: '14px 14px 0', borderRadius: 22, padding: 22, position: 'relative', overflow: 'hidden',
        background: T.featBg, border: `1px solid ${T.featBd}`,
        ...(T.blur && T.blur !== 'none' ? { backdropFilter: T.blur, WebkitBackdropFilter: T.blur } : {}),
        boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
      }}>
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%',
          background: `radial-gradient(circle,${T.gold}12 0%,transparent 70%)`, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -35, left: -35, width: 120, height: 120, borderRadius: '50%',
          background: `radial-gradient(circle,${T.accent}10 0%,transparent 70%)`, pointerEvents: 'none' }}/>

        <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
          เลขเด่นงวดนี้ · {fmtD(latest.date)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Pulse rings */}
          <div style={{ position: 'relative', width: 78, height: 78, flexShrink: 0 }}>
            {[84, 68, 52].map((sz, i) => (
              <div key={i} style={{
                position: 'absolute', top: '50%', left: '50%',
                marginLeft: -sz / 2, marginTop: -sz / 2, width: sz, height: sz, borderRadius: '50%',
                border: `1.5px solid rgba(245,166,35,${0.52 - i * 0.15})`,
                animation: `pulseRing ${2.2 + i * 0.45}s ease-in-out infinite`,
                animationDelay: `${i * 0.38}s`,
              }}/>
            ))}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -24,
              width: 48, height: 48, borderRadius: '50%',
              background: `linear-gradient(135deg,${T.gold},${T.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 18, fontFamily: 'JetBrains Mono,monospace',
              boxShadow: `0 4px 20px ${T.gold}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
            }}>{latest.last2}</div>
          </div>

          <div style={{ flex: 1 }}>
            <div className="mono" style={{ color: '#fff', fontSize: 34, fontWeight: 800, letterSpacing: '0.08em', lineHeight: 1 }}>
              {latest.prize1}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {[{ lbl: 'รางวัลที่ 1', c: T.gold }, { lbl: `ท้าย 2: ${latest.last2}`, c: T.green }].map((b, i) => (
                <span key={i} style={{
                  background: `${b.c}20`, color: b.c, border: `1px solid ${b.c}38`,
                  borderRadius: 7, padding: '2px 9px', fontSize: 11, fontWeight: 600,
                }}>{b.lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 3-digit prizes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {[{ lbl: 'เลขท้าย 3 ตัว', val: latest.last3_back }, { lbl: 'เลขหน้า 3 ตัว', val: latest.last3_front }].map((g, i) => (
            <div key={i}>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 9, marginBottom: 5, letterSpacing: '0.04em' }}>{g.lbl}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 9, padding: '4px 11px', color: '#fff',
                  fontFamily: 'JetBrains Mono,monospace', fontWeight: 600, fontSize: 15,
                }}>{g.val || '–'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hot numbers */}
      <div style={{ margin: '14px 14px 0' }}>
        <SectionHead label="เลขร้อน 🔥 ออกบ่อย" c1={T.accent} c2={T.gold} />
        <div style={{ ...mkCard(T, { borderRadius: 18, padding: '16px 10px', display: 'flex', justifyContent: 'space-around' }) }}>
          {stats.hotNumbers.slice(0, 5).map((x, i) => (
            <Ball key={x.num} n={x.num} type="hot" count={x.count} delay={i * 80} />
          ))}
        </div>
      </div>

      {/* Cold numbers */}
      <div style={{ margin: '14px 14px 0' }}>
        <SectionHead label="เลขเย็น ❄️ ค้างนานที่สุด" c1={T.blueL} c2={T.blue} />
        <div style={{ ...mkCard(T, { borderRadius: 18, padding: '16px 10px', display: 'flex', justifyContent: 'space-around' }) }}>
          {stats.coldNumbers.slice(0, 5).map((x, i) => (
            <Ball key={x.num} n={x.num} type="cold" count={x.gap} delay={i * 80} />
          ))}
        </div>
      </div>

      {/* 3-digit hot numbers */}
      {stats.hot3Numbers.length > 0 && (
        <div style={{ margin: '14px 14px 0' }}>
          <SectionHead label="เลขท้าย 3 ตัวออกบ่อย 🔥" c1={T.accent} c2={T.purple} />
          <div style={{ ...mkCard(T, { borderRadius: 18, padding: '16px 12px', display: 'flex', gap: 8 }) }}>
            {stats.hot3Numbers.map((x, i) => (
              <Pill3 key={x.num} n={x.num} type="hot" count={x.count} delay={i * 80} />
            ))}
          </div>
        </div>
      )}

      {/* 3-digit cold numbers */}
      {stats.cold3Numbers.length > 0 && (
        <div style={{ margin: '14px 14px 0' }}>
          <SectionHead label="เลขท้าย 3 ตัวค้างนาน ❄️" c1={T.purple} c2={T.blue} />
          <div style={{ ...mkCard(T, { borderRadius: 18, padding: '16px 12px', display: 'flex', gap: 8 }) }}>
            {stats.cold3Numbers.map((x, i) => (
              <Pill3 key={x.num} n={x.num} type="cold" count={x.gap} delay={i * 80} />
            ))}
          </div>
        </div>
      )}

      {/* Digit frequency chart */}
      <div style={{ ...mkCard(T, { borderRadius: 18, margin: '14px 14px 0', padding: '16px 16px 12px' }) }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>ความถี่ตัวเลข 0–9</div>
        <div style={{ height: 158 }}><canvas ref={canvasRef} /></div>
      </div>
    </div>
  )
}
