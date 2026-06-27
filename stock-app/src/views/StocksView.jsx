import { useState, useEffect } from 'react'
import { predict, formatKRW, formatPct } from '../data/market.js'
import { useSubscription } from '../monetization/SubscriptionContext.jsx'
import Sparkline from '../components/Sparkline.jsx'
import Verdict from '../components/Verdict.jsx'
import Icon from '../components/Icon.jsx'

// 종목 탭: 검색 + 목록 + 상세(인라인 확장)
export default function StocksView({
  stocks, watchlist, alerts, onToggleWatch, onRequirePro, onAddAlert, onRemoveAlert, focus,
}) {
  const { can } = useSubscription()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(focus || null)

  useEffect(() => { if (focus) setOpen(focus) }, [focus])

  const filtered = stocks.filter(
    (s) => s.name.includes(q) || s.symbol.includes(q) || s.sector.includes(q),
  )

  return (
    <div className="view">
      <div className="view-head"><h1 className="view-h1">종목</h1></div>

      <div className="search-wrap">
        <span className="search-ico"><Icon name="search" size={18} /></span>
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
          const myAlerts = alerts.filter((a) => a.symbol === s.symbol)
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
                ><Icon name="star" size={19} /></button>
              </div>

              {expanded && (
                <div className="stock-detail2">
                  <Verdict p={p} />
                  <div className="now-status">지금 흐름 · <b>{p.status}</b></div>
                  <ul className="reasons">
                    {p.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                  </ul>

                  <div className="kv2">
                    <div><span>전일종가</span><b>{formatKRW(s.prevClose)}</b></div>
                    <div><span>거래량</span><b>{new Intl.NumberFormat('ko-KR').format(s.volume)}</b></div>
                  </div>

                  {can('deepChart') ? (
                    <DeepChart series={s.series} up={up} />
                  ) : (
                    <button className="locked2" onClick={() => onRequirePro('상세 차트는 Pro 기능이에요')}>
                      <Icon name="lock" size={15} /> 상세 차트 · 이동평균 보기 (Pro)
                    </button>
                  )}

                  <AlertEditor
                    stock={s}
                    myAlerts={myAlerts}
                    onAddAlert={onAddAlert}
                    onRemoveAlert={onRemoveAlert}
                  />

                  <p className="mini-disc">기술적 지표 기반 정보 제공이며, 투자 권유가 아닙니다.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 가격 알림 설정 (Pro). 현재가 ±3%를 기본 목표로 제안.
function AlertEditor({ stock, myAlerts, onAddAlert, onRemoveAlert }) {
  const [target, setTarget] = useState(Math.round(stock.price * 1.03))
  const dir = target >= stock.price ? 'up' : 'down'

  return (
    <div className="alert-editor">
      <div className="ae-head">
        <span className="ae-title"><Icon name="bell" size={15} /> 가격 알림</span>
      </div>
      <div className="ae-row">
        <input
          className="ae-input"
          type="number"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
        />
        <span className="ae-dir">{dir === 'up' ? '이상일 때' : '이하일 때'}</span>
        <button className="ae-add" onClick={() => onAddAlert(stock, target, dir)}>설정</button>
      </div>
      {myAlerts.length > 0 && (
        <div className="ae-list">
          {myAlerts.map((a) => (
            <div key={a.id} className={`ae-item ${a.triggered ? 'done' : ''}`}>
              <span>{a.target.toLocaleString('ko-KR')}원 {a.dir === 'up' ? '이상' : '이하'}{a.triggered ? ' · 도달함' : ''}</span>
              <button onClick={() => onRemoveAlert(a.id)} aria-label="삭제">×</button>
            </div>
          ))}
        </div>
      )}
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
  const color = up ? '#e0364f' : '#2f6fed'
  return (
    <svg className="deep-chart2" viewBox={`0 0 ${w} ${h}`} width="100%">
      <polygon points={area} fill={color} opacity="0.07" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" />
      <polyline points={maLine} fill="none" stroke="#c2c8d0" strokeWidth="1.2" strokeDasharray="4 3" />
    </svg>
  )
}
