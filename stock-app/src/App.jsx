import { useEffect, useState } from 'react'
import { snapshotAll, topPick } from './data/market.js'
import { loadStocks } from './data/source.js'
import { loadAlerts, saveAlerts, makeAlert, checkAlerts, ensurePermission } from './data/alerts.js'
import { useSubscription } from './monetization/SubscriptionContext.jsx'
import BottomNav from './components/BottomNav.jsx'
import PaywallModal from './components/PaywallModal.jsx'
import ShareModal from './components/ShareModal.jsx'
import OnboardingSheet from './components/OnboardingSheet.jsx'
import HomeView from './views/HomeView.jsx'
import PredictView from './views/PredictView.jsx'
import StocksView from './views/StocksView.jsx'
import MyView from './views/MyView.jsx'

const WATCH_KEY = 'stockpulse.watchlist.v1'
const ONBOARD_KEY = 'stockpulse.onboarded.v1'

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(WATCH_KEY)
    const arr = raw ? JSON.parse(raw) : null
    if (Array.isArray(arr)) return arr
  } catch { /* ignore */ }
  return []
}

export default function App() {
  const { plan, isPro } = useSubscription()
  const [tab, setTab] = useState('home')
  const [tick, setTick] = useState(0)
  const [watchlist, setWatchlist] = useState(loadWatchlist)
  const [alerts, setAlerts] = useState(loadAlerts)
  const [focus, setFocus] = useState(null)
  const [paywall, setPaywall] = useState({ open: false, reason: '' })
  const [share, setShare] = useState({ open: false, pick: null })
  const [toast, setToast] = useState('')
  const [onboard, setOnboard] = useState(() => {
    try { return !localStorage.getItem(ONBOARD_KEY) } catch { return false }
  })

  // 초기엔 시뮬레이션으로 즉시 렌더(빈 화면 방지), 이후 프록시에서 갱신
  const [stocks, setStocks] = useState(() => snapshotAll(0))

  // "라이브" 시세: 5초마다 갱신
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  // tick마다 프록시(/api/quotes)에서 시세 갱신. 실패 시 시뮬레이션 폴백.
  useEffect(() => {
    let alive = true
    loadStocks(tick).then((s) => { if (alive) setStocks(s) }).catch(() => {})
    return () => { alive = false }
  }, [tick])

  // 시세가 바뀌면 가격 알림 조건 점검 → 도달 시 실제 알림 발송
  useEffect(() => {
    if (alerts.length === 0) return
    const { alerts: next, fired } = checkAlerts(alerts, stocks)
    if (fired.length > 0) {
      setAlerts(next)
      saveAlerts(next)
      const f = fired[0]
      setToast(`🔔 ${f.name} 목표가 도달 (${f.price.toLocaleString('ko-KR')}원)`)
      setTimeout(() => setToast(''), 4000)
    }
  }, [stocks]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try { localStorage.setItem(WATCH_KEY, JSON.stringify(watchlist)) } catch { /* ignore */ }
  }, [watchlist])

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

  // 가격 알림 추가(Pro 전용) — 실제 브라우저 알림 권한까지 요청
  const addAlert = async (stock, target, dir) => {
    if (!isPro) { requirePro('가격 알림은 Pro 기능이에요'); return }
    const granted = await ensurePermission()
    const a = makeAlert(stock, target, dir)
    const next = [...alerts, a]
    setAlerts(next); saveAlerts(next)
    setToast(granted ? '알림을 설정했어요' : '알림을 설정했어요 (브라우저 알림 권한은 꺼져 있어요)')
    setTimeout(() => setToast(''), 3500)
  }
  const removeAlert = (id) => {
    const next = alerts.filter((a) => a.id !== id)
    setAlerts(next); saveAlerts(next)
  }

  const finishOnboard = (picks) => {
    if (picks && picks.length) setWatchlist(picks)
    try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* ignore */ }
    setOnboard(false)
  }

  return (
    <div className="phone">
      <header className="appbar">
        <div className="appbar-brand">StockPulse</div>
        {isPro
          ? <span className="appbar-pro">PRO</span>
          : <button className="appbar-up" onClick={() => requirePro('')}>업그레이드</button>}
      </header>

      <main className="scroll">
        {tab === 'home' && (
          <HomeView
            stocks={stocks} watchlist={watchlist}
            onOpenStock={openStock} onShare={openShare} onRequirePro={requirePro} goTab={setTab}
          />
        )}
        {tab === 'predict' && (
          <PredictView stocks={stocks} onOpenStock={openStock} onRequirePro={requirePro} onShare={openShare} />
        )}
        {tab === 'stocks' && (
          <StocksView
            stocks={stocks} watchlist={watchlist} alerts={alerts}
            onToggleWatch={toggleWatch} onRequirePro={requirePro}
            onAddAlert={addAlert} onRemoveAlert={removeAlert} focus={focus}
          />
        )}
        {tab === 'my' && (
          <MyView stocks={stocks} alerts={alerts} onRemoveAlert={removeAlert} onRequirePro={requirePro} />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}

      <BottomNav tab={tab} onChange={setTab} />

      <PaywallModal
        open={paywall.open} reason={paywall.reason}
        onClose={() => setPaywall({ open: false, reason: '' })}
      />
      <ShareModal open={share.open} pick={share.pick} onClose={() => setShare({ open: false, pick: null })} />
      <OnboardingSheet open={onboard} stocks={stocks} onDone={finishOnboard} />
    </div>
  )
}
