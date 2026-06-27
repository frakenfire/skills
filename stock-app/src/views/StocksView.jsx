import { useState, useEffect } from 'react'
import { predict, formatKRW, formatPct } from '../data/market.js'
import { useSubscription } from '../monetization/SubscriptionContext.jsx'
import Sparkline from '../components/Sparkline.jsx'

// 종목 탭: 검색 + 목록 + 상세(인라인 확장)
export default function StocksView({ stocks, watchlist, onToggleWatch, onRequirePro, focus }) {
  const { can } = useSubscription()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(focus || null)

  // 홈/예측에서 종목을 누르면 해당 종목을 펼친다.
  useEffect(() => { if (focus) setOpen(focus) }, [focus])

  const filtered = stocks.filter(
    (s) => s.name.includes(q) || s.symbol.includes(q) || s.sector.includes(q),
  )

  return (
    <div className="view">
      <div className="view-head">
        <h1 className="view-h1">종목</h1>
      </div>

      <div className="search-wrap">
        <span className="search-ico">🔍</span>
        <input
          className="search"
          placeholder="종목명 · 코드 · 업종 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="card list-card">
        {filtered.length === 0 && <p className="empty-line">검색 결과가 없어요.</p>}
        {filtered.map((s) => {
          const up = s.change >= 0
          const watched = watchlist.includes(s.symbol)
          const expanded = open === s.symbol
          const p = predict(s)
          return (
            <div key={s.symbol} className={`stock-item ${expanded ? 'open' : ''}`}>
              <div className="stock-item-row" onClick={() => setOpen(expanded ? null : s.symbol)}>
                <div className="prow-left">
                  <div className="prow-name">{s.name}</div>
                  <div className="prow-code">{s.symbol} · {s.sector}</div>
                </div>
                <Sparkline series={s.series} up={up} width={64} height={28} />
                <div className="sr-price2">
                  <b>{formatKRW(s.price)}</b>
                  <span className={up ? 'c-up' : 'c-down'}>{formatPct(s.changePct)}</span>
                </div>
                <button
                  className={`star ${watched ? 'on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onToggleWatch(s.symbol) }}
                  aria-label="관심종목"
                >{watched ? '★' : '☆'}</button>
              </div>

              {expanded && (
                <div className="stock-detail2">
                  <div className={`detail-signal s-${p.tone}`}>
                    {p.emoji} AI 신호: {p.signal} · 신뢰도 {p.confidence}%
                  </div>
                  <p className="detail-reason">{p.reason}</p>

                  <div className="kv2">
                    <div><span>전일종가</span><b>{formatKRW(s.prevClose)}</b></div>
                    <div><span>거래량</span><b>{new Intl.NumberFormat('ko-KR').format(s.volume)}</b></div>
                  </div>

                  {/* 상세 차트: Pro 게이팅 */}
                  {can('deepChart') ? (
                    <DeepChart series={s.series} up={up} />
                  ) : (
                    <button className="locked2" onClick={() => onRequirePro('상세 차트는 Pro 기능이에요')}>
                      🔒 상세 차트 · 이동평균 보기 (Pro)
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DeepChart({ series, up }) {
  const w = 380, h = 130, pad = 6
  const min = Math.min(...series), max = Math.max(...series)
  const range = max - min || 1
  const stepX = (w - pad * 2) / (series.length - 1)
  const toXY = (v, i) => [pad + i * stepX, h - pad - ((v - min) / range) * (h - pad * 2)]
  const line = series.map((v, i) => toXY(v, i).join(',')).join(' ')
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`
  const ma = series.map((_, i) => {
    const s = series.slice(Math.max(0, i - 4), i + 1)
    return s.reduce((a, b) => a + b, 0) / s.length
  })
  const maLine = ma.map((v, i) => toXY(v, i).join(',')).join(' ')
  const color = up ? '#f04452' : '#3182f6'
  return (
    <svg className="deep-chart2" viewBox={`0 0 ${w} ${h}`} width="100%">
      <polygon points={area} fill={color} opacity="0.08" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" />
      <polyline points={maLine} fill="none" stroke="#b0b8c1" strokeWidth="1.2" strokeDasharray="4 3" />
    </svg>
  )
}
