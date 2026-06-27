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

  // 가짜 결제 흐름. 실제로는 Stripe/IAP 결제 검증 후 서버 entitlement로 대체.
  const upgrade = useCallback(async () => {
    // 결제 처리 지연을 흉내내어 UI의 로딩 상태를 검증할 수 있게 한다.
    await new Promise((r) => setTimeout(r, 900))
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
      upgrade,
      cancel,
    }),
    [state, upgrade, cancel],
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}
