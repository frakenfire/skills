// 프론트 시세 소스. 백엔드 프록시(/api/quotes)를 호출하고,
// 실패(서버 미기동·네트워크·CORS)하면 로컬 시뮬레이션으로 폴백한다.
// → 백엔드가 없어도 앱은 항상 동작한다.
import { snapshotAll } from './market.js'

// 백엔드 프록시 사용 여부(빌드 시 주입). 정적 데모(Pages)에선 off → 시뮬레이션만 사용.
const USE_API = import.meta.env.VITE_API === '1'

export async function loadStocks(tick = 0) {
  if (!USE_API) return snapshotAll(tick) // 백엔드 없이 동작(데모)
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

// AI 한 줄 코멘트(Gemini). 백엔드+키가 있을 때만. 없으면 null → 기본 문구 사용.
export async function fetchInsight(symbol) {
  if (!USE_API) return null
  try {
    const opts = AbortSignal.timeout ? { signal: AbortSignal.timeout(8000) } : {}
    const res = await fetch(`/api/insight?symbol=${encodeURIComponent(symbol)}`, opts)
    if (!res.ok) return null
    const data = await res.json()
    return data?.text || null
  } catch {
    return null
  }
}
