// 기술적 지표 기반 매매 신호 엔진.
// 공식은 공개된 표준 알고리즘(RSI 14 + 단기/장기 이동평균 크로스오버)을 사용한다.
// 참고: technicalindicators, debut-js/Indicators 등 오픈소스의 표준 구현.
// ※ 본 신호는 교육/참고용이며 투자권유가 아님.

const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const round = (n) => Math.round(n)

// 단순이동평균
export function sma(values, period) {
  const p = Math.min(period, values.length)
  const s = values.slice(-p)
  return s.reduce((a, b) => a + b, 0) / p
}

// RSI (Wilder 평활) — 표준 14기간
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

// 종합 분석 → 초보가 바로 이해하는 신호.
export function analyze(series) {
  const last = series[series.length - 1]
  const rsiV = rsi(series, 14)
  const short = sma(series, 5)
  const long = sma(series, 20)
  const trendUp = short >= long // 골든크로스 상태(상승 추세)
  const lookback = Math.max(0, series.length - 12)
  const momentum = ((last - series[lookback]) / series[lookback]) * 100

  // 0~100 점수: 추세(이평) + 진입(RSI) + 모멘텀 결합
  let score = 50
  score += trendUp ? 14 : -14
  if (rsiV < 30) score += 18          // 과매도 → 쌀 수 있음
  else if (rsiV < 45) score += 8
  else if (rsiV > 70) score -= 18     // 과매수 → 조심
  else if (rsiV > 55) score -= 6
  score += clamp(momentum, -6, 6) * 1.2
  score = clamp(round(score), 5, 95)

  let tone, signal, emoji, headline, kidLine
  if (score >= 62) {
    tone = 'buy'; signal = '매수'; emoji = '🟢'
    headline = '지금 사도 좋아요'
    kidLine = '싸고 분위기도 좋아요. 사볼 만해요.'
  } else if (score <= 40) {
    tone = 'sell'; signal = '매도'; emoji = '🔴'
    headline = '파는 걸 생각해봐요'
    kidLine = '비싸거나 힘이 빠지고 있어요. 쉬어가요.'
  } else {
    tone = 'hold'; signal = '관망'; emoji = '🟡'
    headline = '조금 더 기다려요'
    kidLine = '아직 애매해요. 조금 더 지켜봐요.'
  }

  // "지금 이 주식은?" 한 줄 상태
  let status
  if (rsiV > 70) status = '많이 올라서 뜨거워요 🔥'
  else if (rsiV < 30) status = '많이 내려서 차가워요 🧊'
  else if (trendUp) status = '오르는 중이에요 📈'
  else status = '쉬어가는 중이에요 😌'

  // 쉬운 말 근거
  const reasons = []
  reasons.push(
    trendUp
      ? '단기 평균이 장기 평균보다 위예요 — 상승 흐름이에요.'
      : '단기 평균이 장기 평균 아래예요 — 아직 약해요.',
  )
  if (rsiV < 30) reasons.push(`RSI ${round(rsiV)} — 많이 떨어져서 저렴할 수 있어요.`)
  else if (rsiV > 70) reasons.push(`RSI ${round(rsiV)} — 너무 올라 조심할 때예요.`)
  else reasons.push(`RSI ${round(rsiV)} — 보통 수준이에요.`)
  reasons.push(`최근 흐름 ${pct(momentum)}.`)

  const confidence = clamp(round(50 + Math.abs(score - 50) * 0.9), 55, 95)

  return {
    tone, signal, emoji, headline, kidLine, status, reasons,
    score, confidence, momentum,
    rsi: round(rsiV),
    reason: reasons[0], // 하위호환
  }
}
