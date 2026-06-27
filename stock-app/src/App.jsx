import { useEffect, useMemo, useState } from 'react'
import { snapshotAll, topPick } from './data/market.js'
import { useSubscription } from './monetization/SubscriptionContext.jsx'
import BottomNav from './components/BottomNav.jsx'
import PaywallModal from './components/PaywallModal.jsx'
import ShareModal from './components/ShareModal.jsx'
import HomeView from './views/HomeView.jsx'
import PredictView from './views/PredictView.jsx'
import StocksView from './views/StocksView.jsx'
import MyView from './views/MyView.jsx'

const WATCH_KEY = 'stockpulse.watchlist.v1'

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(WATCH_KEY)
    const arr = raw ? JSON.parse(raw) : null
    if (Array.isArray(arr)) return arr
  } catch { /* ignore */ }
  return ['005930', '035720'] // 기본: 삼성전자, 카카오
}

export default function App() {
  const { plan, isPro } = useSubscription()
  const [tab, setTab] = useState('home')
  const [tick, setTick] = useState(0)
  const [watchlist, setWatchlist] = useState(loadWatchlist)
  const [focus, setFocus] = useState(null)
  const [paywall, setPaywall] = useState({ open: false, reason: '' })
  const [share, setShare] = useState({ open: false, pick: null })

  // "라이브" 시세: 5초마다 갱신
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    try { localStorage.setItem(WATCH_KEY, JSON.stringify(watchlist)) } catch { /* ignore */ }
  }, [watchlist])

  const stocks = useMemo(() => snapshotAll(tick), [tick])

  const requirePro = (reason) => setPaywall({ open: true, reason })
  const openShare = (pick) => setShare({ open: true, pick: pick || topPick(stocks) })

  const openStock = (stock) => { setFocus(stock.symbol); setTab('stocks') }

  const toggleWatch = (symbol) => {
    const isWatched = watchlist.includes(symbol)
    if (isWatched) { setWatchlist((w) => w.filter((s) => s !== symbol)); return }
    if (watchlist.length >= plan.watchlistLimit) {
      requirePro(`무료는 관심종목 ${plan.watchlistLimit}개까지예요`)
      return
    }
    setWatchlist((w) => [...w, symbol])
  }

  return (
    <div className="phone">
      <header className="appbar">
        <div className="appbar-brand"><span className="appbar-logo">📈</span> StockPulse</div>
        {isPro
          ? <span className="appbar-pro">PRO</span>
          : <button className="appbar-up" onClick={() => requirePro('')}>Pro</button>}
      </header>

      <main className="scroll">
        {tab === 'home' && (
          <HomeView
            stocks={stocks}
            watchlist={watchlist}
            onOpenStock={openStock}
            onShare={openShare}
            onRequirePro={requirePro}
            goTab={setTab}
          />
        )}
        {tab === 'predict' && (
          <PredictView
            stocks={stocks}
            onOpenStock={openStock}
            onRequirePro={requirePro}
            onShare={openShare}
          />
        )}
        {tab === 'stocks' && (
          <StocksView
            stocks={stocks}
            watchlist={watchlist}
            onToggleWatch={toggleWatch}
            onRequirePro={requirePro}
            focus={focus}
          />
        )}
        {tab === 'my' && <MyView onRequirePro={requirePro} />}
      </main>

      <BottomNav tab={tab} onChange={setTab} />

      <PaywallModal
        open={paywall.open}
        reason={paywall.reason}
        onClose={() => setPaywall({ open: false, reason: '' })}
      />
      <ShareModal
        open={share.open}
        pick={share.pick}
        onClose={() => setShare({ open: false, pick: null })}
      />
    </div>
  )
}
