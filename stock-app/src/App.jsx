import { useEffect, useMemo, useState } from 'react'
import { snapshotAll, formatKRW, formatPct } from './data/market.js'
import { useSubscription } from './monetization/SubscriptionContext.jsx'
import Sparkline from './components/Sparkline.jsx'
import StockDetail from './components/StockDetail.jsx'
import PaywallModal from './components/PaywallModal.jsx'

const WATCH_KEY = 'stockpulse.watchlist.v1'

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(WATCH_KEY)
    const arr = raw ? JSON.parse(raw) : null
    if (Array.isArray(arr)) return arr
  } catch { /* ignore */ }
  return ['005930'] // 기본 관심종목: 삼성전자
}

export default function App() {
  const { isPro, plan, can, cancel } = useSubscription()
  const [tick, setTick] = useState(0)
  const [selected, setSelected] = useState('005930')
  const [watchlist, setWatchlist] = useState(loadWatchlist)
  const [paywall, setPaywall] = useState({ open: false, reason: '' })

  // "라이브" 시세: 4초마다 갱신
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    try { localStorage.setItem(WATCH_KEY, JSON.stringify(watchlist)) } catch { /* ignore */ }
  }, [watchlist])

  const stocks = useMemo(() => snapshotAll(tick), [tick])
  const selectedStock = stocks.find((s) => s.symbol === selected) || null
  const watchStocks = stocks.filter((s) => watchlist.includes(s.symbol))

  const requirePro = (reason) => setPaywall({ open: true, reason })

  const toggleWatch = (symbol) => {
    const isWatched = watchlist.includes(symbol)
    if (isWatched) {
      setWatchlist((w) => w.filter((s) => s !== symbol))
      return
    }
    // 수익화 게이트: 무료는 관심종목 한도 초과 시 페이월
    if (watchlist.length >= plan.watchlistLimit) {
      requirePro(`무료 플랜은 관심종목 ${plan.watchlistLimit}개까지입니다`)
      return
    }
    setWatchlist((w) => [...w, symbol])
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">📈</span> StockPulse
          <span className="brand-sub">실시간 주식정보</span>
        </div>
        <div className="topbar-right">
          {isPro ? (
            <>
              <span className="badge badge-pro">PRO</span>
              <button className="btn btn-ghost" onClick={cancel}>해지(데모)</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => requirePro('')}>
              Pro 업그레이드 · {plan && '9,900원/월'}
            </button>
          )}
        </div>
      </header>

      {/* 무료 사용자 업셀 배너 = freemium 수익화 노출 (Pro면 광고제거) */}
      {!can('adFree') && (
        <button className="upsell-banner" onClick={() => requirePro('광고 없이, 모든 기능을 한 번에')}>
          🚀 Pro로 업그레이드하면 실시간 알림 · 상세차트 · AI분석 · 관심종목 무제한 — 월 9,900원
          <span className="upsell-x">자세히 →</span>
        </button>
      )}

      <main className="layout">
        <section className="col col-list">
          <h2 className="col-title">전체 종목</h2>
          <div className="stock-list">
            {stocks.map((s) => {
              const up = s.change >= 0
              const watched = watchlist.includes(s.symbol)
              return (
                <div
                  key={s.symbol}
                  className={`stock-row ${selected === s.symbol ? 'active' : ''}`}
                  onClick={() => setSelected(s.symbol)}
                >
                  <div className="sr-name">
                    <b>{s.name}</b>
                    <span>{s.symbol}</span>
                  </div>
                  <Sparkline series={s.series} up={up} />
                  <div className={`sr-price ${up ? 'up' : 'down'}`}>
                    <b>{formatKRW(s.price)}</b>
                    <span>{formatPct(s.changePct)}</span>
                  </div>
                  <button
                    className={`star ${watched ? 'on' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleWatch(s.symbol) }}
                    aria-label="관심종목"
                    title={watched ? '관심종목 해제' : '관심종목 추가'}
                  >
                    {watched ? '★' : '☆'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="col col-detail">
          <StockDetail stock={selectedStock} onRequirePro={requirePro} />
        </section>

        <aside className="col col-watch">
          <div className="watch-head">
            <h2 className="col-title">관심종목</h2>
            <span className="watch-count">
              {watchlist.length}{plan.watchlistLimit === Infinity ? '' : ` / ${plan.watchlistLimit}`}
            </span>
          </div>

          {watchStocks.length === 0 && (
            <p className="watch-empty">★ 를 눌러 관심종목을 추가하세요.</p>
          )}
          {watchStocks.map((s) => {
            const up = s.change >= 0
            return (
              <div key={s.symbol} className="watch-row" onClick={() => setSelected(s.symbol)}>
                <b>{s.name}</b>
                <span className={up ? 'up' : 'down'}>
                  {formatKRW(s.price)} · {formatPct(s.changePct)}
                </span>
              </div>
            )
          })}

          {/* 알림: Pro 전용 */}
          <div className="alert-box">
            <div className="panel-head">
              <h3>가격 알림</h3>
              {!can('realtimeAlerts') && <span className="lock-tag">Pro</span>}
            </div>
            {can('realtimeAlerts') ? (
              <p className="alert-on">✓ 실시간 알림이 켜져 있습니다.</p>
            ) : (
              <button className="btn btn-outline btn-block" onClick={() => requirePro('실시간 가격 알림은 Pro 기능입니다')}>
                🔔 알림 켜기 (Pro)
              </button>
            )}
          </div>
        </aside>
      </main>

      <footer className="footer">
        데모 앱 · 시세는 시뮬레이션 데이터입니다 · 투자권유 아님
      </footer>

      <PaywallModal
        open={paywall.open}
        reason={paywall.reason}
        onClose={() => setPaywall({ open: false, reason: '' })}
      />
    </div>
  )
}
