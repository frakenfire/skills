import { useSubscription } from '../monetization/SubscriptionContext.jsx'
import { topPick, marketMood, predict, formatKRW, formatPct } from '../data/market.js'
import { TIPS } from '../data/education.js'
import PredictionRow from '../components/PredictionRow.jsx'
import Verdict from '../components/Verdict.jsx'

// 홈: 인사 → 시장 한눈에 → 오늘의 AI 추천 → 관심종목 → 초보 팁
export default function HomeView({ stocks, watchlist, onOpenStock, onShare, onRequirePro, goTab }) {
  const { isPro } = useSubscription()
  const pick = topPick(stocks)
  const mood = marketMood(stocks)
  const p = predict(pick.stock)
  const watchStocks = stocks.filter((s) => watchlist.includes(s.symbol))

  return (
    <div className="view">
      <div className="hello">
        <p className="hello-sub">안녕하세요 👋</p>
        <h1 className="hello-title">오늘도 차근차근,<br />초보를 위한 주식</h1>
      </div>

      {/* 시장 한눈에 */}
      <div className="card mood-card">
        <div className="mood-left">
          <div className="card-label">오늘의 시장</div>
          <div className={`mood-label ${mood.avg >= 0 ? 'c-up' : 'c-down'}`}>
            {mood.label} {mood.avg >= 0 ? '▲' : '▼'} {Math.abs(mood.avg).toFixed(2)}%
          </div>
        </div>
        <div className="mood-right">
          <span className="c-up">▲ {mood.up}</span>
          <span className="c-down">▼ {mood.down}</span>
        </div>
      </div>

      {/* 오늘의 AI 추천 (핵심) */}
      <div className="card pick-card">
        <div className="pick-top">
          <span className="pick-tag">🤖 오늘의 AI 추천</span>
          <button className="share-mini" onClick={() => onShare(pick)}>공유</button>
        </div>
        <div className="pick-name">{pick.stock.name}</div>
        <div className="pick-price">
          {formatKRW(pick.stock.price)}
          <span className={pick.stock.change >= 0 ? 'c-up' : 'c-down'}> {formatPct(pick.stock.changePct)}</span>
        </div>

        <Verdict p={p} />

        <div className="now-status">지금 이 주식은? <b>{p.status}</b></div>
        <button className="btn-toss btn-sm" onClick={() => onOpenStock(pick.stock)}>자세히 보기</button>
      </div>

      {/* 관심종목 */}
      <div className="section-head">
        <h2>관심종목</h2>
        <button className="link" onClick={() => goTab('stocks')}>전체 →</button>
      </div>
      <div className="card list-card">
        {watchStocks.length === 0 ? (
          <p className="empty-line">★ 를 눌러 관심종목을 담아보세요.</p>
        ) : (
          watchStocks.map((s, i) => (
            <PredictionRow
              key={s.symbol}
              stock={s}
              locked={!isPro && i >= 1}
              onClick={onOpenStock}
              onLockedClick={() => onRequirePro('관심종목 AI 신호는 Pro에서 전부 보여요')}
            />
          ))
        )}
      </div>

      {/* 초보 팁 */}
      <div className="section-head">
        <h2>오늘의 한 줄 공부</h2>
        <button className="link" onClick={() => goTab('my')}>더보기 →</button>
      </div>
      <div className="card tip-card" onClick={() => goTab('my')}>
        <span className="tip-emoji">{TIPS[0].emoji}</span>
        <div>
          <div className="tip-title">{TIPS[0].title}</div>
          <div className="tip-body">{TIPS[0].body}</div>
        </div>
      </div>
    </div>
  )
}
