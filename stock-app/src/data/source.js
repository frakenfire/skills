// 프론트 시세 소스. 백엔드 프록시(/api/quotes)를 호출하고,
// 실패(서버 미기동·네트워크·CORS)하면 로컬 시뮬레이션으로 폴백한다.
// → 백엔드가 없어도 앱은 항상 동작한다.
import { snapshotAll } from './market.js'

export async function loadStocks(tick = 0) {
  try {
    const opts = AbortSignal.timeout ? { signal: AbortSignal.timeout(4000) } : {}
    const res = await fetch('/api/quotes', opts)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data?.stocks) && data.stocks.length > 0) return data.stocks
    throw new Error('빈 응답')
  } catch {
    // 폴백: 시뮬레이션
    return snapshotAll(tick)
  }
}
