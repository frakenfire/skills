import { useSubscription } from '../monetization/SubscriptionContext.jsx'
import PredictionRow from '../components/PredictionRow.jsx'

const FREE_VISIBLE = 2 // 무료는 상위 2개 신호만

// AI 예측 탭: 전 종목 매수/매도/관망. 무료는 일부만, 나머지는 잠금→페이월.
export default function PredictView({ stocks, onOpenStock, onRequirePro, onShare }) {
  const { isPro } = useSubscription()

  return (
    <div className="view">
      <div className="view-head">
        <h1 className="view-h1">AI 매수·매도 예측</h1>
        <p className="view-desc">초보도 한눈에. 매수 📈 / 관망 ⏸️ / 매도 📉 신호를 알려드려요.</p>
      </div>

      <button className="cta-share" onClick={() => onShare(null)}>
        🧵 오늘의 예측을 스레드에 공유하고 친구에게 알려주세요
      </button>

      <div className="card list-card">
        {stocks.map((s, i) => (
          <PredictionRow
            key={s.symbol}
            stock={s}
            locked={!isPro && i >= FREE_VISIBLE}
            onClick={onOpenStock}
            onLockedClick={() => onRequirePro('전체 종목 AI 예측은 Pro에서 열려요')}
          />
        ))}
      </div>

      {!isPro && (
        <button className="unlock-banner" onClick={() => onRequirePro('전체 종목 AI 예측 보기')}>
          🔓 나머지 {Math.max(0, stocks.length - FREE_VISIBLE)}개 종목 신호 전부 보기 · 월 9,900원
        </button>
      )}

      <p className="disclaimer">※ AI 예측은 참고용 데모이며 투자권유가 아닙니다. 투자 책임은 본인에게 있어요.</p>
    </div>
  )
}
