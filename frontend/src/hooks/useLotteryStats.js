import { useMemo } from 'react'

const p2 = n => String(n).padStart(2, '0')

function digitSum(s) {
  return String(s).split('').reduce((a, c) => a + Number(c), 0)
}

// ── 2-digit frequency map ─────────────────────────────────────────────────
function computeFrequency(draws) {
  const map = {}
  for (let i = 0; i < 100; i++) map[p2(i)] = 0
  for (const d of draws) {
    if (d.last2) map[d.last2] = (map[d.last2] || 0) + 1
  }
  return map
}

// ── 2-digit gap map ──────────────────────────────────────────────────────
function computeGaps(draws) {
  const lastIdx = {}
  draws.forEach((d, i) => {
    if (d.last2 && !(d.last2 in lastIdx)) lastIdx[d.last2] = i
  })
  const gap = {}
  for (let i = 0; i < 100; i++) {
    const n = p2(i)
    gap[n] = n in lastIdx ? lastIdx[n] + 1 : draws.length
  }
  return gap
}

// ── 3-digit frequency map ─────────────────────────────────────────────────
function computeFreq3(draws) {
  const back = {}, front = {}
  for (const d of draws) {
    if (d.last3_back)  back[d.last3_back]   = (back[d.last3_back]  || 0) + 1
    if (d.last3_front) front[d.last3_front] = (front[d.last3_front] || 0) + 1
  }
  return { back, front }
}

// ── 3-digit gap map ──────────────────────────────────────────────────────
function computeGap3(draws) {
  const back = {}, front = {}
  draws.forEach((d, i) => {
    if (d.last3_back  && !(d.last3_back  in back))  back[d.last3_back]   = i + 1
    if (d.last3_front && !(d.last3_front in front)) front[d.last3_front] = i + 1
  })
  return { back, front }
}

// ── Digit distribution (0–9) ──────────────────────────────────────────────
function computeDigitDistribution(draws) {
  const counts = Array(10).fill(0)
  let total = 0
  for (const d of draws) {
    if (!d.last2) continue
    for (const ch of d.last2) { counts[Number(ch)]++; total++ }
  }
  return counts.map(c => total > 0 ? ((c / total) * 100).toFixed(1) : '0.0')
}

// ── Enhanced 2-digit prediction — 5 algorithms ───────────────────────────
function computePredictions2(draws, freqMap, gapMap, count = 5) {
  if (!draws.length) return []
  const total = draws.length
  const maxFreq = Math.max(...Object.values(freqMap), 1)
  const maxGap  = Math.max(...Object.values(gapMap),  1)

  // Algorithm 4: digit-sum frequency
  const sumFreq = {}
  for (const [n, f] of Object.entries(freqMap)) {
    const s = digitSum(n)
    sumFreq[s] = (sumFreq[s] || 0) + f
  }
  const maxSumF = Math.max(...Object.values(sumFreq), 1)

  // Algorithm 5: neighbor effect — numbers close to last 5 winners
  const recent = draws.slice(0, 5).map(d => d.last2).filter(Boolean)
  const neighborScore = {}
  for (const w of recent) {
    const v = parseInt(w, 10)
    for (let d = -5; d <= 5; d++) {
      const k = p2(((v + d + 100) % 100))
      neighborScore[k] = (neighborScore[k] || 0) + 1 / (Math.abs(d) + 1)
    }
  }
  const maxNb = Math.max(...Object.values(neighborScore), 0.1)

  return Object.keys(freqMap)
    .map(num => {
      const freq = freqMap[num] || 0
      const gap  = gapMap[num]  || 0

      let dFreq = 0
      for (const [n, f] of Object.entries(freqMap)) {
        if (n[0] === num[0] || n[1] === num[1]) dFreq += f
      }

      const s1 = (freq / maxFreq)  * 0.40
      const s2 = (gap  / maxGap)   * 0.30
      const s3 = (dFreq / (total * 2 * maxFreq + 1)) * 0.15
      const s4 = ((sumFreq[digitSum(num)] || 0) / maxSumF) * 0.10
      const s5 = ((neighborScore[num] || 0) / maxNb) * 0.05

      return {
        num, freq, gap, score: s1 + s2 + s3 + s4 + s5,
        sources: [
          { name: 'ความถี่',     pct: Math.round(s1 * 100), max: 40, color: '#e94560' },
          { name: 'เลขค้าง',    pct: Math.round(s2 * 100), max: 30, color: '#0984e3' },
          { name: 'รูปแบบหลัก', pct: Math.round(s3 * 100), max: 15, color: '#6c5ce7' },
          { name: 'ผลรวมหลัก',  pct: Math.round(s4 * 100), max: 10, color: '#00b894' },
          { name: 'ใกล้เคียง',  pct: Math.round(s5 * 100), max:  5, color: '#f5a623' },
        ],
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}

// ── 3-digit prediction — 4 algorithms ───────────────────────────────────
function computePredictions3(draws, top2Preds, count = 5) {
  if (!draws.length) return []

  const { back: freq3 } = computeFreq3(draws)
  const { back: gap3  } = computeGap3(draws)

  const allNums = new Set(draws.map(d => d.last3_back).filter(Boolean))
  if (allNums.size === 0) return []

  const maxFreq3 = Math.max(...Object.values(freq3), 1)
  const maxGap3  = Math.max(...Object.values(gap3),  1)

  const top2Set = new Set(top2Preds.slice(0, 3).map(p => p.num))

  const sumFreq3 = {}
  for (const [n, f] of Object.entries(freq3)) {
    const s = digitSum(n)
    sumFreq3[s] = (sumFreq3[s] || 0) + f
  }
  const maxSumF3 = Math.max(...Object.values(sumFreq3), 1)

  return [...allNums]
    .map(num => {
      const freq = freq3[num] || 0
      const gap  = gap3[num]  || draws.length

      const s1 = (freq / maxFreq3) * 0.35
      const s2 = (gap  / maxGap3)  * 0.30
      const s3 = top2Set.has(num.slice(-2)) ? 0.25 : 0
      const s4 = ((sumFreq3[digitSum(num)] || 0) / maxSumF3) * 0.10

      return {
        num, freq, gap, score: s1 + s2 + s3 + s4,
        sources: [
          { name: 'ความถี่ 3 ตัว',  pct: Math.round(s1 * 100), max: 35, color: '#e94560' },
          { name: 'เลขค้าง',        pct: Math.round(s2 * 100), max: 30, color: '#0984e3' },
          { name: 'สัมพันธ์ 2 ตัว', pct: Math.round(s3 * 100), max: 25, color: '#f5a623' },
          { name: 'รูปแบบหลัก',     pct: Math.round(s4 * 100), max: 10, color: '#6c5ce7' },
        ],
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}

// ── Main hook ─────────────────────────────────────────────────────────────
export function useLotteryStats(draws) {
  return useMemo(() => {
    const empty = {
      frequencyMap: {}, freq3Map: {}, freq3FrontMap: {},
      hotNumbers: [], coldNumbers: [],
      hot3Numbers: [], cold3Numbers: [],
      gapMap: {}, gap3Map: {},
      digitDist: Array(10).fill('0.0'),
      predictions: [], predictions3: [],
      lastSeen: {},
    }
    if (!draws?.length) return empty

    const frequencyMap = computeFrequency(draws)
    const gapMap       = computeGaps(draws)
    const digitDist    = computeDigitDistribution(draws)

    const { back: freq3Map, front: freq3FrontMap } = computeFreq3(draws)
    const { back: gap3Map }                        = computeGap3(draws)

    const byFreq = Object.entries(frequencyMap).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    const hotNumbers  = byFreq.slice(0, 10).map(([num, count]) => ({ num, count }))
    const coldNumbers = Object.entries(gapMap)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([num, gap]) => ({ num, gap, count: frequencyMap[num] || 0 }))

    const hot3Numbers = Object.entries(freq3Map)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([num, count]) => ({ num, count }))
    const cold3Numbers = Object.entries(gap3Map)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([num, gap]) => ({ num, gap, count: freq3Map[num] || 0 }))

    const lastSeen = {}
    draws.forEach((d, i) => {
      if (d.last2 && !(d.last2 in lastSeen)) lastSeen[d.last2] = i
    })

    const predictions  = computePredictions2(draws, frequencyMap, gapMap, 5)
    const predictions3 = computePredictions3(draws, predictions, 5)

    return {
      frequencyMap, freq3Map, freq3FrontMap,
      hotNumbers, coldNumbers,
      hot3Numbers, cold3Numbers,
      gapMap, gap3Map,
      digitDist, predictions, predictions3, lastSeen,
    }
  }, [draws])
}
