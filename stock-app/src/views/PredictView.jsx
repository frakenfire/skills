import { useSubscription } from '../monetization/SubscriptionContext.jsx'
import PredictionRow from '../components/PredictionRow.jsx'
import Icon from '../components/Icon.jsx'

const FREE_VISIBLE = 2 // 무료는 상위 2개만

// 신호 탭: 전 종목 강세/중립/약세. 무료는 일부만, 나머지는 잠금→페이월.
export default function PredictView({ stocks, onOpenStock, onRequirePro, onShare }) {
  const { isPro } = useSubscription()

  return (
    <div className="view">
      <div className="view-head">
        <h1 className="view-h1">오늘의 신호</h1>
        <p className="view-desc">지표로 본 종목 상태예요. 강세 · 중립 · 약세로 한눈에.</p>
      </div>

      <button className="cta-share" onClick={() => onShare(null)}>
        <Icon name="share" size={16} /> 오늘의 신호를 친구에게 공유하기
      </button>

      <div className="card list-card">
        {stocks.map((s, i) => (
          <PredictionRow
            key={s.symbol}
            stock={s}
            locked={!isPro && i >= FREE_VISIBLE}
            onClick={onOpenStock}
            onLockedClick={() => onRequirePro('전체 종목 신호는 Pro에서 열려요')}
          />
        ))}
      </div>

      {!isPro && (
        <button className="unlock-banner" onClick={() => onRequirePro('전체 종목 신호 보기')}>
          나머지 {Math.max(0, stocks.length - FREE_VISIBLE)}개 종목 신호 보기 · 월 9,900원
        </button>
      )}

      <p className="disclaimer">기술적 지표 기반의 정보 제공이며, 투자 권유가 아닙니다. 투자 판단과 책임은 본인에게 있습니다.</p>
    </div>
  )
}
