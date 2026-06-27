// 종목 유니버스 (국내 + 해외 예시).
// symbol: 앱 내부 코드(관심종목 저장 키) / td: Twelve Data 심볼 / kis: KIS 조회용
// 해외 종목을 켜려면 아래 US 블록의 주석을 풀고 UI에서 함께 노출하면 된다.
export const UNIVERSE = [
  // ── 국내 (KRX) ──
  { symbol: '005930', name: '삼성전자', sector: 'IT', base: 78600, td: '005930:KRX', market: 'KR' },
  { symbol: '000660', name: 'SK하이닉스', sector: 'IT', base: 215000, td: '000660:KRX', market: 'KR' },
  { symbol: '373220', name: 'LG에너지솔루션', sector: '2차전지', base: 372000, td: '373220:KRX', market: 'KR' },
  { symbol: '207940', name: '삼성바이오로직스', sector: '바이오', base: 1042000, td: '207940:KRX', market: 'KR' },
  { symbol: '005380', name: '현대차', sector: '자동차', base: 248500, td: '005380:KRX', market: 'KR' },
  { symbol: '035420', name: 'NAVER', sector: 'IT', base: 213000, td: '035420:KRX', market: 'KR' },
  { symbol: '035720', name: '카카오', sector: 'IT', base: 41250, td: '035720:KRX', market: 'KR' },
  { symbol: '051910', name: 'LG화학', sector: '화학', base: 318000, td: '051910:KRX', market: 'KR' },
  { symbol: '006400', name: '삼성SDI', sector: '2차전지', base: 295000, td: '006400:KRX', market: 'KR' },
  { symbol: '068270', name: '셀트리온', sector: '바이오', base: 184600, td: '068270:KRX', market: 'KR' },
  { symbol: '105560', name: 'KB금융', sector: '금융', base: 86400, td: '105560:KRX', market: 'KR' },
  { symbol: '055550', name: '신한지주', sector: '금융', base: 58900, td: '055550:KRX', market: 'KR' },

  // ── 해외 (예시) — 켜려면 주석 해제 ──
  // { symbol: 'AAPL', name: '애플', sector: 'IT', base: 230, td: 'AAPL', market: 'US' },
  // { symbol: 'NVDA', name: '엔비디아', sector: 'IT', base: 130, td: 'NVDA', market: 'US' },
  // { symbol: 'TSLA', name: '테슬라', sector: '자동차', base: 250, td: 'TSLA', market: 'US' },
]
