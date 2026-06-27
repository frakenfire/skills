// 시세 데이터 레이어.
// 실제 서비스에서는 여기를 KRX/벤더 API 또는 자체 백엔드로 교체한다.
// 데모에서는 시드 기반 의사난수로 "라이브처럼" 움직이는 가짜 시세를 만든다.

export const SEED_STOCKS = [
  { symbol: '005930', name: '삼성전자', sector: 'IT', base: 78600 },
  { symbol: '000660', name: 'SK하이닉스', sector: 'IT', base: 215000 },
  { symbol: '373220', name: 'LG에너지솔루션', sector: '2차전지', base: 372000 },
  { symbol: '207940', name: '삼성바이오로직스', sector: '바이오', base: 1042000 },
  { symbol: '005380', name: '현대차', sector: '자동차', base: 248500 },
  { symbol: '035420', name: 'NAVER', sector: 'IT', base: 213000 },
  { symbol: '035720', name: '카카오', sector: 'IT', base: 41250 },
  { symbol: '051910', name: 'LG화학', sector: '화학', base: 318000 },
  { symbol: '006400', name: '삼성SDI', sector: '2차전지', base: 295000 },
  { symbol: '068270', name: '셀트리온', sector: '바이오', base: 184600 },
  { symbol: '105560', name: 'KB금융', sector: '금융', base: 86400 },
  { symbol: '055550', name: '신한지주', sector: '금융', base: 58900 },
]

// 결정적 의사난수 (시드 → [0,1))
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSymbol(symbol) {
  let h = 0
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0
  return h
}

// 한 종목의 일중 분봉 시계열(스파크라인용)을 생성한다.
export function buildSeries(symbol, base, points = 48, tick = 0) {
  const rand = mulberry32(hashSymbol(symbol) + tick)
  const series = []
  let price = base
  for (let i = 0; i < points; i++) {
    const drift = (rand() - 0.5) * base * 0.012
    price = Math.max(base * 0.85, price + drift)
    series.push(Math.round(price))
  }
  return series
}

// 현재가/등락 스냅샷. tick을 올리면 값이 갱신되어 "라이브"처럼 보인다.
export function snapshot(stock, tick = 0) {
  const series = buildSeries(stock.symbol, stock.base, 48, tick)
  const price = series[series.length - 1]
  const prevClose = stock.base
  const change = price - prevClose
  const changePct = (change / prevClose) * 100
  return {
    ...stock,
    price,
    prevClose,
    change,
    changePct,
    series,
    // 거래량도 가짜로 생성
    volume: Math.round(
      stock.base * (0.4 + mulberry32(hashSymbol(stock.symbol) + tick + 7)()) * 100,
    ),
  }
}

export function snapshotAll(tick = 0) {
  return SEED_STOCKS.map((s) => snapshot(s, tick))
}

export const formatKRW = (n) =>
  new Intl.NumberFormat('ko-KR').format(Math.round(n)) + '원'

export const formatPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

// ─────────────────────────────────────────────
// AI 매수/매도/관망 예측 (이 앱의 핵심 후킹 기능)
// 시뮬레이션 시계열의 모멘텀·변동성으로 결정적 신호를 만든다.
// 실서비스에선 이 함수를 실제 모델/리서치 API로 교체한다.
// ※ 데모이며 투자권유가 아님.
// ─────────────────────────────────────────────
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

export function predict(stock) {
  const s = stock.series
  const recent = s.slice(-12)
  const first = recent[0]
  const last = recent[recent.length - 1]
  const momentum = ((last - first) / first) * 100 // 최근 추세 %

  // 변동성: 인접 변화율의 평균 절대값
  let vol = 0
  for (let i = 1; i < recent.length; i++) {
    vol += Math.abs((recent[i] - recent[i - 1]) / recent[i - 1])
  }
  vol = (vol / (recent.length - 1)) * 100

  let signal, tone, emoji, reason
  if (momentum > 1.0) {
    signal = '매수'
    tone = 'buy'
    emoji = '📈'
    reason = `최근 흐름이 ${formatPct(momentum)}로 우상향이에요. 상승 분위기가 이어질 가능성이 있어요.`
  } else if (momentum < -1.0) {
    signal = '매도'
    tone = 'sell'
    emoji = '📉'
    reason = `최근 흐름이 ${formatPct(momentum)}로 약해요. 지금은 쉬어가는 걸 고려해 보세요.`
  } else {
    signal = '관망'
    tone = 'hold'
    emoji = '⏸️'
    reason = '뚜렷한 방향이 없어요. 조금 더 지켜본 뒤 판단하는 게 안전해요.'
  }

  // 신뢰도: 모멘텀이 강하고 변동성이 낮을수록 높게
  const confidence = Math.round(
    clamp(58 + Math.abs(momentum) * 7 - vol * 2, 52, 93),
  )

  return { signal, tone, emoji, reason, confidence, momentum }
}

// 오늘의 추천: 매수 신뢰도가 가장 높은 종목 하나
export function topPick(stocks) {
  const scored = stocks
    .map((s) => ({ stock: s, p: predict(s) }))
    .filter((x) => x.p.tone === 'buy')
    .sort((a, b) => b.p.confidence - a.p.confidence)
  return scored[0] || { stock: stocks[0], p: predict(stocks[0]) }
}

// 시장 요약(코스피처럼): 전 종목 평균 등락
export function marketMood(stocks) {
  const avg = stocks.reduce((a, s) => a + s.changePct, 0) / stocks.length
  const up = stocks.filter((s) => s.change >= 0).length
  let label, tone
  if (avg > 0.3) { label = '강세'; tone = 'buy' }
  else if (avg < -0.3) { label = '약세'; tone = 'sell' }
  else { label = '보합'; tone = 'hold' }
  return { avg, up, down: stocks.length - up, total: stocks.length, label, tone }
}
