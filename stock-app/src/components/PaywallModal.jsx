import { useState } from 'react'
import { useSubscription } from '../monetization/SubscriptionContext.jsx'
import { PRO_FEATURE_LABELS } from '../monetization/plans.js'

// 수익화 전환 지점 (토스풍 바텀시트).
export default function PaywallModal({ open, onClose, reason }) {
  const { plans, startCheckout } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!open) return null

  const handleUpgrade = async () => {
    setLoading(true)
    const res = await startCheckout()
    if (res.redirected) return // Stripe 결제 페이지로 이동 중
    setLoading(false)
    setDone(true) // 데모 결제 완료
    setTimeout(() => { setDone(false); onClose() }, 1100)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        {done ? (
          <div className="pay-success">
            <div className="pay-check">✓</div>
            <h2>Pro 시작! 🎉</h2>
            <p>모든 AI 예측이 열렸어요.</p>
          </div>
        ) : (
          <>
            <div className="pay-emoji">🔓</div>
            <h2 className="sheet-title">{reason || 'Pro로 전체 예측 보기'}</h2>
            <p className="sheet-sub">
              모든 종목의 매수·매도 신호를 월 <strong>{plans.pro.priceLabel}</strong>에. 언제든 해지 가능해요.
            </p>

            <ul className="pay-features">
              {PRO_FEATURE_LABELS.map((f) => (
                <li key={f.key}><span className="pay-dot">✓</span>{f.label}</li>
              ))}
            </ul>

            <button className="btn-toss" onClick={handleUpgrade} disabled={loading}>
              {loading ? '시작하는 중…' : `Pro 시작하기 · ${plans.pro.priceLabel}${plans.pro.period}`}
            </button>
            <p className="sheet-fineprint">데모 결제예요. 실제 청구는 없어요.</p>
          </>
        )}
      </div>
    </div>
  )
}
