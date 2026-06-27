import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { PLANS, planFor, canUse } from './plans.js'

// 구독 상태를 앱 전역에서 공유. localStorage에 영속화하여 새로고침해도 유지된다.
const STORAGE_KEY = 'stockpulse.subscription.v1'
const SubscriptionContext = createContext(null)

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { tier: 'free', since: null }
    const parsed = JSON.parse(raw)
    if (parsed && (parsed.tier === 'free' || parsed.tier === 'pro')) return parsed
  } catch {
    /* 손상된 값은 무시하고 기본값 사용 */
  }
  return { tier: 'free', since: null }
}

export function SubscriptionProvider({ children }) {
  const [state, setState] = useState(loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* 저장 실패는 치명적이지 않음 */
    }
  }, [state])

  // Stripe 결제 후 success_url(?paid=1)로 돌아오면 Pro로 전환하고 URL을 정리한다.
  // ※ MVP: 클라이언트 확인. 운영 시에는 Stripe 웹훅으로 서버 검증 권장(README 참고).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('paid') === '1') {
        setState({ tier: 'pro', since: new Date().toISOString() })
      }
      if (params.has('paid')) {
        params.delete('paid')
        const qs = params.toString()
        window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
      }
    } catch { /* ignore */ }
  }, [])

  // 결제 시작: 서버에 Checkout 세션을 요청한다.
  // - Stripe 키가 있으면 결제 페이지로 이동(실결제)
  // - 없으면(데모) 즉시 Pro 업그레이드
  const startCheckout = useCallback(async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url // Stripe 결제 페이지로 이동
        return { redirected: true }
      }
    } catch { /* 백엔드 없음 → 데모로 폴백 */ }
    await new Promise((r) => setTimeout(r, 700))
    setState({ tier: 'pro', since: new Date().toISOString() })
    return { demo: true }
  }, [])

  // 데모 즉시 업그레이드(폴백/테스트용)
  const upgrade = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 700))
    setState({ tier: 'pro', since: new Date().toISOString() })
    return { ok: true }
  }, [])

  const cancel = useCallback(() => {
    setState({ tier: 'free', since: null })
  }, [])

  const value = useMemo(
    () => ({
      tier: state.tier,
      since: state.since,
      plan: planFor(state.tier),
      isPro: state.tier === 'pro',
      can: (featureKey) => canUse(state.tier, featureKey),
      plans: PLANS,
      startCheckout,
      upgrade,
      cancel,
    }),
    [state, startCheckout, upgrade, cancel],
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}
