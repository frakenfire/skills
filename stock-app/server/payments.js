// 결제: Stripe Checkout 세션 생성. SDK 없이 REST 직접 호출(시니어 효율 — 의존성 0).
// STRIPE_SECRET_KEY 가 있으면 실제 결제, 없으면 { demo:true } 반환 → 프론트는 데모 업그레이드.
//
// 필요한 env:
//   STRIPE_SECRET_KEY=sk_live_... (또는 sk_test_...)
//   STRIPE_PRICE_ID=price_...     (선택: 대시보드에서 만든 월 구독 가격. 없으면 ₩9,900/월 인라인 생성)

export async function createCheckout(origin) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return { demo: true, reason: 'STRIPE_SECRET_KEY 미설정' }

  const base = origin || 'http://localhost:5173'
  const params = new URLSearchParams()
  params.set('mode', 'subscription')
  params.set('line_items[0][quantity]', '1')
  if (process.env.STRIPE_PRICE_ID) {
    params.set('line_items[0][price]', process.env.STRIPE_PRICE_ID)
  } else {
    // KRW는 zero-decimal → unit_amount 9900 = ₩9,900
    params.set('line_items[0][price_data][currency]', 'krw')
    params.set('line_items[0][price_data][unit_amount]', '9900')
    params.set('line_items[0][price_data][recurring][interval]', 'month')
    params.set('line_items[0][price_data][product_data][name]', 'StockPulse Pro')
  }
  params.set('success_url', `${base}/?paid=1`)
  params.set('cancel_url', `${base}/?paid=0`)

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    signal: AbortSignal.timeout(8000),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || `stripe ${res.status}`)
  return { url: json.url }
}
