import { predict, formatKRW, formatPct } from '../data/market.js'
import Sparkline from './Sparkline.jsx'

// 종목 1줄: 이름 · 미니차트 · 가격 · AI신호. 토스풍 카드 row.
// locked=true 이면 신호를 흐리게 가리고 클릭 시 페이월.
export default function PredictionRow({ stock, locked, onClick, onLockedClick }) {
  const p = predict(stock)
  const up = stock.change >= 0

  return (
    <button
      className="prow"
      onClick={() => (locked ? onLockedClick?.() : onClick?.(stock))}
    >
      <div className="prow-left">
        <div className="prow-name">{stock.name}</div>
        <div className="prow-code">{stock.price ? formatKRW(stock.price) : ''} · <span className={up ? 'c-up' : 'c-down'}>{formatPct(stock.changePct)}</span></div>
      </div>

      <Sparkline series={stock.series} up={up} width={64} height={28} />

      {locked ? (
        <div className="signal locked-signal">
          <span className="signal-pill blur">강세 92</span>
        </div>
      ) : (
        <div className="signal">
          <span className={`signal-pill s-${p.tone}`}>{p.label}</span>
          <span className="signal-conf">{p.strength}</span>
        </div>
      )}
    </button>
  )
}
