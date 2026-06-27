// Twelve Data provider — 국내(KRX) + 해외 모두 지원, 무료 키 발급.
// https://twelvedata.com (무료: 800 req/day, 8 req/min)
// 필요한 env: TWELVEDATA_API_KEY
//
// time_series 한 번으로 분봉 series + 현재가(시계열 마지막) + 전일/시가 추정까지 얻는다.
import { UNIVERSE } from '../universe.js'

export const name = 'twelvedata'
const BASE = 'https://api.twelvedata.com'
const key = () => process.env.TWELVEDATA_API_KEY // 호출 시점에 읽기(.env 로드 이후)

async function fetchSeries(td) {
  const url = `${BASE}/time_series?symbol=${encodeURIComponent(td)}&interval=5min&outputsize=48&order=ASC&apikey=${key()}`
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
  if (!res.ok) throw new Error(`twelvedata ${res.status}`)
  const json = await res.json()
  if (json.status === 'error') throw new Error(json.message || 'twelvedata error')
  const values = json.values || []
  // ASC 정렬: 오래된 → 최신. 종가(close) 배열을 series로.
  return values.map((v) => Math.round(Number(v.close)))
}

export async function getQuotes() {
  if (!key()) throw new Error('TWELVEDATA_API_KEY 미설정')

  // 무료 플랜 분당 호출 제한이 있으므로 순차 호출(과도한 동시호출 방지).
  const out = []
  for (const u of UNIVERSE) {
    try {
      const series = await fetchSeries(u.td)
      if (series.length === 0) throw new Error('빈 시계열')
      const price = series[series.length - 1]
      const prevClose = series[0] // 일중 첫 봉을 기준선으로 사용(데모 단순화)
      const change = price - prevClose
      const changePct = (change / prevClose) * 100
      out.push({
        symbol: u.symbol,
        name: u.name,
        sector: u.sector,
        price,
        prevClose,
        change,
        changePct,
        series,
        volume: 0, // 거래량은 quote 엔드포인트 별도 호출 필요 — 데모에선 생략
      })
    } catch (e) {
      // 개별 종목 실패는 건너뛴다(전체가 죽지 않게).
      console.warn(`[twelvedata] ${u.symbol} 실패: ${e.message}`)
    }
  }
  if (out.length === 0) throw new Error('twelvedata: 전 종목 조회 실패')
  return out
}
