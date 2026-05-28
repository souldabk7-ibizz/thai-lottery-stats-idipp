import { useMemo } from 'react'

const p2 = n => String(n).padStart(2, '0')

// ── Frequency map { "00": 8, "52": 9, ... } ──────────────────────────────
function computeFrequency(draws) {
  const map = {}
  for (let i = 0; i < 100; i++) map[p2(i)] = 0
  for (const d of draws) {
    if (d.last2) map[d.last2] = (map[d.last2] || 0) + 1
  }
  return map
}

// ── Gap map { "52": 3 } = draws since last appearance ────────────────────
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

// ── Digit distribution (0–9) as percentages ───────────────────────────────
function computeDigitDistribution(draws) {
  const counts = Array(10).fill(0)
  let total = 0
  for (const d of draws) {
    if (!d.last2) continue
    for (const ch of d.last2) {
      counts[Number(ch)]++
      total++
    }
  }
  return counts.map(c => total > 0 ? ((c / total) * 100).toFixed(1) : '0.0')
}

// ── Per-digit score for pattern component ─────────────────────────────────
function computeDigitScore(num, freqMap, total) {
  let score = 0
  for (const ch of num) {
    const d = Number(ch)
    let digitFreq = 0
    for (let i = 0; i < 100; i++) {
      const n = p2(i)
      if (n.includes(ch)) digitFreq += freqMap[n] || 0
    }
    score += total > 0 ? digitFreq / total : 0
  }
  return score / 2
}

// ── Scoring algorithm ─────────────────────────────────────────────────────
function computePredictions(draws, freqMap, gapMap, count = 5) {
  const total = draws.length
  const maxFreq = Math.max(...Object.values(freqMap))
  const maxGap = Math.max(...Object.values(gapMap))

  return Object.keys(freqMap)
    .map(num => {
      const freq = freqMap[num] || 0
      const gap = gapMap[num] || 0
      const freqScore = maxFreq > 0 ? (freq / maxFreq) * 0.40 : 0
      const gapScore = maxGap > 0 ? (gap / maxGap) * 0.35 : 0
      const digitScore = computeDigitScore(num, freqMap, total) * 0.25
      const total_score = freqScore + gapScore + digitScore
      return { num, freq, gap, freqScore, gapScore, digitScore, score: total_score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(p => ({
      ...p,
      scorePct: Math.round((p.score / 1) * 100 * 10) / 10,
    }))
}

// ── Main hook ─────────────────────────────────────────────────────────────
export function useLotteryStats(draws) {
  return useMemo(() => {
    if (!draws || draws.length === 0) {
      return {
        frequencyMap: {},
        hotNumbers: [],
        coldNumbers: [],
        gapMap: {},
        digitDist: Array(10).fill('0.0'),
        predictions: [],
        lastSeen: {},
      }
    }

    const frequencyMap = computeFrequency(draws)
    const gapMap = computeGaps(draws)
    const digitDist = computeDigitDistribution(draws)

    // Sort by frequency for hot/cold
    const byFreq = Object.entries(frequencyMap).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

    const hotNumbers = byFreq.slice(0, 10).map(([num, count]) => ({ num, count }))

    // Cold = longest gap since last appearance (or never seen = max gap)
    const coldNumbers = Object.entries(gapMap)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([num, gap]) => ({ num, gap, count: frequencyMap[num] || 0 }))

    // Last seen index (0 = most recent draw)
    const lastSeen = {}
    draws.forEach((d, i) => {
      if (d.last2 && !(d.last2 in lastSeen)) lastSeen[d.last2] = i
    })

    const predictions = computePredictions(draws, frequencyMap, gapMap, 5)

    return {
      frequencyMap,
      hotNumbers,
      coldNumbers,
      gapMap,
      digitDist,
      predictions,
      lastSeen,
    }
  }, [draws])
}
