import { useState } from 'react'
import { useSubscription } from '../monetization/SubscriptionContext.jsx'
import { PRO_FEATURE_LABELS } from '../monetization/plans.js'

// 수익화 전환 지점. Pro 기능을 누르거나 관심종목 한도를 넘으면 뜬다.
export default function PaywallModal({ open, onClose, reason }) {
  const { plans, upgrade } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!open) return null

  const handleUpgrade = async () => {
    setLoading(true)
    const res = await upgrade()
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => {
        setDone(false)
        onClose()
      }, 1100)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>

        {done ? (
          <div className="upgrade-success">
            <div className="check">✓</div>
            <h2>Pro 활성화 완료</h2>
            <p>모든 프리미엄 기능이 열렸습니다.</p>
          </div>
        ) : (
          <>
            <div className="modal-badge">StockPulse Pro</div>
            <h2 className="modal-title">
              {reason || '프리미엄 기능입니다'}
            </h2>
            <p className="modal-sub">
              월 <strong>{plans.pro.priceLabel}</strong>로 모든 잠금을 해제하세요. 언제든 해지 가능.
            </p>

            <ul className="feature-list">
              {PRO_FEATURE_LABELS.map((f) => (
                <li key={f.key}>
                  <span className="dot">✓</span>
                  {f.label}
                </li>
              ))}
            </ul>

            <button className="btn btn-primary btn-block" onClick={handleUpgrade} disabled={loading}>
              {loading ? '결제 처리 중…' : `Pro 시작하기 · ${plans.pro.priceLabel}${plans.pro.period}`}
            </button>
            <p className="modal-fineprint">
              데모 결제입니다. 실제 카드 청구는 발생하지 않습니다.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
