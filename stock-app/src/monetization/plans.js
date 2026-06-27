// 수익화의 핵심: 무료 vs Pro 티어 정의.
// 기능 게이팅(feature gating)이 코드 한 곳에서 관리되도록 모았다.

export const PLANS = {
  free: {
    id: 'free',
    name: '무료',
    priceKRW: 0,
    priceLabel: '0원',
    period: '',
    watchlistLimit: 3, // 무료는 관심종목 3개까지
    features: {
      realtimeAlerts: false, // 가격 알림
      deepChart: false, // 상세 차트(분봉 확대 + 지표)
      aiInsight: false, // AI 종목 분석
      adFree: false, // 광고 제거 (이 데모는 freemium이라 무료엔 안내배너 노출)
      exportCsv: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceKRW: 9900,
    priceLabel: '9,900원',
    period: '/월',
    watchlistLimit: Infinity, // Pro는 무제한
    features: {
      realtimeAlerts: true,
      deepChart: true,
      aiInsight: true,
      adFree: true,
      exportCsv: true,
    },
  },
}

// Pro에서만 열리는 기능들의 사람이 읽을 라벨 (페이월/가격표에서 사용)
export const PRO_FEATURE_LABELS = [
  { key: 'realtimeAlerts', label: '목표가 가격 알림' },
  { key: 'deepChart', label: '상세 차트 · 이동평균' },
  { key: 'aiInsight', label: '전 종목 신호 · 백테스트' },
  { key: 'watchlist', label: '관심종목 무제한 (무료는 3개)' },
  { key: 'adFree', label: '업셀 배너 제거' },
  { key: 'exportCsv', label: '데이터 CSV 내보내기' },
]

export function planFor(tierId) {
  return PLANS[tierId] || PLANS.free
}

// 특정 기능이 현재 티어에서 사용 가능한지 판단하는 단일 진입점.
export function canUse(tierId, featureKey) {
  return Boolean(planFor(tierId).features[featureKey])
}
