// 시세 프록시 서버 (의존성 없음 · Node 내장 http).
// 프론트는 /api/quotes 만 호출하고, 실제 데이터 제공처/키는 여기서만 다룬다.
// - 키 노출 방지(키는 서버 env)
// - CORS 허용
// - 캐싱(레이트리밋 보호)
// - provider 실패 시 시뮬레이션으로 폴백
import http from 'node:http'
import { getProvider } from './providers/index.js'
import { createCheckout } from './payments.js'
import { insight } from './ai.js'

// .env가 있으면 로드(없어도 무방). Node 22의 내장 로더 사용.
try { process.loadEnvFile?.('.env') } catch { /* .env 없음 → 기본값 사용 */ }

const PORT = Number(process.env.PORT || 8787)
const TTL = Number(process.env.CACHE_TTL_MS || 5000)
const provider = getProvider()

const cache = new Map()
async function cached(key, fn) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.t < TTL) return hit.v
  const v = await fn()
  cache.set(key, { t: Date.now(), v })
  return v
}

function send(res, code, body) {
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/api/')) return send(res, 404, { error: 'not found' })

  if (req.url.startsWith('/api/health')) {
    return send(res, 200, { ok: true, provider: provider.name, payments: Boolean(process.env.STRIPE_SECRET_KEY) })
  }

  // 결제 세션 생성
  if (req.method === 'POST' && req.url.startsWith('/api/checkout')) {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', async () => {
      try {
        const { origin } = JSON.parse(body || '{}')
        send(res, 200, await createCheckout(origin))
      } catch (e) {
        // 결제 실패 → 데모로 폴백(사용자가 막히지 않게)
        send(res, 200, { demo: true, error: String(e.message || e) })
      }
    })
    return
  }

  // AI 한 줄 코멘트(Gemini). 키 없으면 text:null → 프론트 기본 문구 사용.
  if (req.url.startsWith('/api/insight')) {
    try {
      const symbol = new URL(req.url, 'http://localhost').searchParams.get('symbol')
      const stocks = await cached('quotes', () => provider.getQuotes())
      const s = stocks.find((x) => x.symbol === symbol)
      const text = s ? await insight(s) : null
      return send(res, 200, { text })
    } catch {
      return send(res, 200, { text: null })
    }
  }

  if (req.url.startsWith('/api/quotes')) {
    try {
      const stocks = await cached('quotes', () => provider.getQuotes())
      return send(res, 200, { provider: provider.name, stocks })
    } catch (err) {
      // 실 provider 실패 → 시뮬레이션 폴백 (앱이 멈추지 않게)
      console.warn(`[market-proxy] ${provider.name} 실패, sim 폴백:`, err.message)
      try {
        const stocks = await getProvider('sim').getQuotes()
        return send(res, 200, { provider: 'sim(fallback)', warning: err.message, stocks })
      } catch (err2) {
        return send(res, 500, { error: String(err2.message || err2) })
      }
    }
  }

  return send(res, 404, { error: 'not found' })
})

server.listen(PORT, () => {
  console.log(`[market-proxy] provider=${provider.name} listening on http://localhost:${PORT}`)
})
