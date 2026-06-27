import { useSubscription } from '../monetization/SubscriptionContext.jsx'
import { TIPS, GLOSSARY, EDU_SOURCES } from '../data/education.js'

// MY: 구독 상태 + 초보 공부(팁/용어) + 출처
export default function MyView({ onRequirePro }) {
  const { isPro, since, cancel } = useSubscription()

  return (
    <div className="view">
      <div className="view-head">
        <h1 className="view-h1">MY</h1>
      </div>

      {/* 구독 상태 카드 */}
      <div className={`card plan-card ${isPro ? 'pro' : ''}`}>
        {isPro ? (
          <>
            <div className="plan-badge">PRO 이용 중</div>
            <div className="plan-title">모든 AI 예측이 열려 있어요 🎉</div>
            {since && <div className="plan-sub">시작일 {new Date(since).toLocaleDateString('ko-KR')}</div>}
            <button className="btn-toss-ghost" onClick={cancel}>구독 해지 (데모)</button>
          </>
        ) : (
          <>
            <div className="plan-title">무료 플랜 이용 중</div>
            <div className="plan-sub">Pro로 전체 종목 AI 예측 · 상세차트 · 알림 · 관심종목 무제한</div>
            <button className="btn-toss" onClick={() => onRequirePro('Pro로 전체 기능 열기')}>
              Pro 업그레이드 · 월 9,900원
            </button>
          </>
        )}
      </div>

      {/* 초보 팁 */}
      <div className="section-head"><h2>초보를 위한 공부 💡</h2></div>
      <div className="tips-stack">
        {TIPS.map((t, i) => (
          <div className="card tip-card" key={i}>
            <span className="tip-emoji">{t.emoji}</span>
            <div>
              <div className="tip-title">{t.title}</div>
              <div className="tip-body">{t.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 용어 사전 */}
      <div className="section-head"><h2>쉬운 용어 사전 📖</h2></div>
      <div className="card glossary">
        {GLOSSARY.map((g) => (
          <div className="gloss-item" key={g.term}>
            <b>{g.term}</b>
            <span>{g.desc}</span>
          </div>
        ))}
      </div>

      <div className="sources">
        <div className="sources-title">참고 자료</div>
        {EDU_SOURCES.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.name}</a>
        ))}
      </div>

      <p className="disclaimer">※ 본 앱의 예측·분석은 데모이며 투자권유가 아닙니다.</p>
    </div>
  )
}
