// 기술적 지표 기반 신호 엔진 (RSI 14 + 단기/장기 이동평균 크로스오버).
// 공식은 공개 표준 알고리즘(technicalindicators, debut-js/Indicators 등).
//
// ※ 중요: 본 엔진은 "사라/팔아라"를 지시하지 않는다. 종목의 현재 '상태'를
//    강세/중립/약세로 서술할 뿐이며, 투자 판단·책임은 사용자에게 있다(정보 제공).
const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const round = (n) => Math.round(n)

export function sma(values, period) {
  const p = Math.min(period, values.length)
  const s = values.slice(-p)
  return s.reduce((a, b) => a + b, 0) / p
}

export function rsi(values, period = 14) {
  if (values.length < period + 1) return 50
  let gains = 0
  let losses = 0
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1]
    if (d >= 0) gains += d
    else losses -= d
  }
  let avgG = gains / period
  let avgL = losses / period
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1]
    avgG = (avgG * (period - 1) + Math.max(d, 0)) / period
    avgL = (avgL * (period - 1) + Math.max(-d, 0)) / period
  }
  if (avgL === 0) return 100
  const rs = avgG / avgL
  return 100 - 100 / (1 + rs)
}

// 간이 백테스트: 과거 구간에서 추세 방향과 이후 흐름이 일치한 비율(데모).
function backtest(series) {
  let hits = 0
  let n = 0
  for (let i = 20; i < series.length - 3; i++) {
    const sub = series.slice(0, i + 1)
    const dir = sma(sub, 5) >= sma(sub, 20) ? 1 : -1
    const future = series[i + 3] - series[i]
    if (future === 0 || Math.sign(future) === dir) hits++
    n++
  }
  return { hitRate: n ? round((hits / n) * 100) : 0, samples: n }
}

export function analyze(series) {
  const last = series[series.length - 1]
  const rsiV = rsi(series, 14)
  const trendUp = sma(series, 5) >= sma(series, 20)
  const lookback = Math.max(0, series.length - 12)
  const momentum = ((last - series[lookback]) / series[lookback]) * 100

  let score = 50
  score += trendUp ? 14 : -14
  if (rsiV < 30) score += 18
  else if (rsiV < 45) score += 8
  else if (rsiV > 70) score -= 18
  else if (rsiV > 55) score -= 6
  score += clamp(momentum, -6, 6) * 1.2
  score = clamp(round(score), 5, 95)

  // 상태 서술(권유 아님). tone은 색상 매핑용.
  let tone, label, headline, kidLine
  if (score >= 62) {
    tone = 'buy'; label = '강세'
    headline = '안정적인 흐름이에요'
    kidLine = '지표가 좋은 편이에요.'
  } else if (score <= 40) {
    tone = 'sell'; label = '약세'
    headline = '힘이 빠지고 있어요'
    kidLine = '지표가 약해지고 있어요.'
  } else {
    tone = 'hold'; label = '중립'
    headline = '방향을 보는 중이에요'
    kidLine = '아직 방향이 또렷하지 않아요.'
  }

  let status
  if (rsiV > 70) status = '단기간 많이 오른 편이에요'
  else if (rsiV < 30) status = '단기간 많이 내린 편이에요'
  else if (trendUp) status = '완만하게 오르는 흐름이에요'
  else status = '쉬어가는 흐름이에요'

  const reasons = []
  reasons.push(
    trendUp
      ? '단기 평균이 장기 평균 위에 있어요(상승 추세 구간).'
      : '단기 평균이 장기 평균 아래에 있어요(약한 구간).',
  )
  if (rsiV < 30) reasons.push(`RSI ${round(rsiV)} — 과매도 구간일 수 있어요.`)
  else if (rsiV > 70) reasons.push(`RSI ${round(rsiV)} — 과매수 구간일 수 있어요.`)
  else reasons.push(`RSI ${round(rsiV)} — 중립 수준이에요.`)
  reasons.push(`최근 흐름 ${pct(momentum)}.`)

  const strength = clamp(round(50 + Math.abs(score - 50) * 0.9), 55, 95)

  return {
    tone, label, headline, kidLine, status, reasons,
    score, strength, momentum,
    rsi: round(rsiV),
    backtest: backtest(series),
    // 하위호환 별칭
    signal: label,
    confidence: strength,
    reason: reasons[0],
  }
}
