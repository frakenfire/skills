import { describe, it, expect } from 'vitest'
import { PLANS, planFor, canUse } from './plans.js'

describe('monetization plans', () => {
  it('무료 플랜은 관심종목 3개 한도', () => {
    expect(PLANS.free.watchlistLimit).toBe(3)
  })

  it('Pro 플랜은 관심종목 무제한', () => {
    expect(PLANS.pro.watchlistLimit).toBe(Infinity)
  })

  it('무료 플랜은 Pro 기능을 쓸 수 없다', () => {
    expect(canUse('free', 'realtimeAlerts')).toBe(false)
    expect(canUse('free', 'deepChart')).toBe(false)
    expect(canUse('free', 'aiInsight')).toBe(false)
  })

  it('Pro 플랜은 모든 기능을 쓸 수 있다', () => {
    expect(canUse('pro', 'realtimeAlerts')).toBe(true)
    expect(canUse('pro', 'deepChart')).toBe(true)
    expect(canUse('pro', 'aiInsight')).toBe(true)
    expect(canUse('pro', 'adFree')).toBe(true)
  })

  it('알 수 없는 티어는 무료로 폴백', () => {
    expect(planFor('nonsense').id).toBe('free')
  })

  it('Pro 가격은 월 9,900원', () => {
    expect(PLANS.pro.priceKRW).toBe(9900)
  })
})
