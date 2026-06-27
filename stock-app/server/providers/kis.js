// 한국투자증권(KIS) provider — 국내 + 해외 주식 모두 지원, 무료(증권계좌 필요).
// https://apiportal.koreainvestment.com
//
// 필요한 env: KIS_APP_KEY, KIS_APP_SECRET  (실전: KIS_BASE=https://openapi.koreainvestment.com:9443)
//
// 흐름:
//  1) 접근토큰 발급: POST /oauth2/tokenP  { grant_type, appkey, appsecret }  → access_token (24h 캐시 권장)
//  2) 국내 현재가: GET /uapi/domestic-stock/v1/quotations/inquire-price
//        headers: authorization: Bearer <token>, appkey, appsecret, tr_id: FHKST01010100
//        params:  FID_COND_MRKT_DIV_CODE=J, FID_INPUT_ISCD=<6자리코드>
//  3) 분봉(차트): GET /uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice (tr_id: FHKST03010200)
//  4) 해외 현재가: GET /uapi/overseas-price/v1/quotations/price (tr_id: HHDFS00000300)
//
// 토큰 발급/조회는 계정 자격증명이 필요해 여기서는 구조만 잡아둔다. 실제 키를 넣고
// 아래 TODO를 채우면 동작한다. 미설정 시 명확한 에러를 던져 프록시가 sim으로 폴백한다.
import { UNIVERSE } from '../universe.js'

export const name = 'kis'
// env는 호출 시점에 읽는다(.env 로드 이후).
const base = () => process.env.KIS_BASE || 'https://openapi.koreainvestment.com:9443'
const appKey = () => process.env.KIS_APP_KEY
const appSecret = () => process.env.KIS_APP_SECRET

let tokenCache = { token: null, exp: 0 }

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.exp) return tokenCache.token
  const res = await fetch(`${base()}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', appkey: appKey(), appsecret: appSecret() }),
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) throw new Error(`KIS 토큰 발급 실패 ${res.status}`)
  const json = await res.json()
  tokenCache = { token: json.access_token, exp: Date.now() + 23 * 60 * 60 * 1000 } // 23h
  return tokenCache.token
}

export async function getQuotes() {
  if (!appKey() || !appSecret()) {
    throw new Error('KIS 미설정: KIS_APP_KEY / KIS_APP_SECRET 환경변수를 설정하세요')
  }
  const token = await getToken()

  const out = []
  for (const u of UNIVERSE.filter((x) => x.market === 'KR')) {
    // TODO: inquire-price + inquire-time-itemchartprice 호출 후 아래 모양으로 매핑.
    //   const res = await fetch(`${BASE}/uapi/domestic-stock/v1/quotations/inquire-price?...`, {
    //     headers: { authorization: `Bearer ${token}`, appkey: APP_KEY, appsecret: APP_SECRET, tr_id: 'FHKST01010100' },
    //   })
    //   const j = await res.json(); const o = j.output
    //   out.push({ symbol:u.symbol, name:u.name, sector:u.sector,
    //     price:Number(o.stck_prpr), prevClose:Number(o.stck_sdpr),
    //     change:Number(o.prdy_vrss), changePct:Number(o.prdy_ctrt),
    //     series:[...분봉종가...], volume:Number(o.acml_vol) })
    void token; void u
  }
  if (out.length === 0) {
    throw new Error('KIS provider: 시세 호출 미구현(스캐폴드). 위 TODO를 채우세요.')
  }
  return out
}
