import { useSubscription } from '../monetization/SubscriptionContext.jsx'
import { formatKRW, formatPct } from '../data/market.js'

// 종목 상세. 기본 정보는 무료, 상세차트/AI분석/알림은 Pro 게이팅.
export default function StockDetail({ stock, onRequirePro }) {
  const { can } = useSubscription()
  if (!stock) {
    return (
      <div className="detail empty">
        <p>왼쪽에서 종목을 선택하세요.</p>
      </div>
    )
  }

  const up = stock.change >= 0
  const cls = up ? 'up' : 'down'

  return (
    <div className="detail">
      <div className="detail-head">
        <div>
          <div className="detail-name">{stock.name}</div>
          <div className="detail-symbol">{stock.symbol} · {stock.sector}</div>
        </div>
        <div className={`detail-price ${cls}`}>
          <div className="big">{formatKRW(stock.price)}</div>
          <div className="chg">
            {up ? '▲' : '▼'} {formatKRW(Math.abs(stock.change))} ({formatPct(stock.changePct)})
          </div>
        </div>
      </div>

      {/* 상세 차트: Pro 전용 */}
      <section className="panel">
        <div className="panel-head">
          <h3>상세 차트</h3>
          {!can('deepChart') && <span className="lock-tag">Pro</span>}
        </div>
        {can('deepChart') ? (
          <DeepChart series={stock.series} up={up} />
        ) : (
          <LockedBlock
            text="분봉 확대 · 이동평균 · 거래량 지표"
            onClick={() => onRequirePro('상세 차트는 Pro 기능입니다')}
          />
        )}
      </section>

      {/* AI 분석: Pro 전용 */}
      <section className="panel">
        <div className="panel-head">
          <h3>AI 종목 분석</h3>
          {!can('aiInsight') && <span className="lock-tag">Pro</span>}
        </div>
        {can('aiInsight') ? (
          <AiInsight stock={stock} />
        ) : (
          <LockedBlock
            text="모멘텀 · 밸류에이션 · 리스크 요약 리포트"
            onClick={() => onRequirePro('AI 종목 분석은 Pro 기능입니다')}
          />
        )}
      </section>

      <section className="panel">
        <div className="panel-head"><h3>기본 정보 (무료)</h3></div>
        <div className="kv-grid">
          <div><span>전일종가</span><b>{formatKRW(stock.prevClose)}</b></div>
          <div><span>거래량</span><b>{new Intl.NumberFormat('ko-KR').format(stock.volume)}</b></div>
          <div><span>업종</span><b>{stock.sector}</b></div>
          <div><span>종목코드</span><b>{stock.symbol}</b></div>
        </div>
      </section>
    </div>
  )
}

function LockedBlock({ text, onClick }) {
  return (
    <button className="locked-block" onClick={onClick}>
      <span className="locked-ico">🔒</span>
      <span>{text}</span>
      <span className="locked-cta">Pro로 잠금 해제 →</span>
    </button>
  )
}

// Pro 전용 상세차트: 면적 + 이동평균선
function DeepChart({ series, up }) {
  const w = 560, h = 200, pad = 8
  const min = Math.min(...series), max = Math.max(...series)
  const range = max - min || 1
  const stepX = (w - pad * 2) / (series.length - 1)
  const toXY = (v, i) => [pad + i * stepX, h - pad - ((v - min) / range) * (h - pad * 2)]
  const line = series.map((v, i) => toXY(v, i).join(',')).join(' ')
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`

  // 단순 5-이동평균
  const ma = series.map((_, i) => {
    const s = series.slice(Math.max(0, i - 4), i + 1)
    return s.reduce((a, b) => a + b, 0) / s.length
  })
  const maLine = ma.map((v, i) => toXY(v, i).join(',')).join(' ')
  const color = up ? '#e5494d' : '#2f6fed'

  return (
    <svg className="deep-chart" viewBox={`0 0 ${w} ${h}`} width="100%">
      <polygon points={area} fill={color} opacity="0.10" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" />
      <polyline points={maLine} fill="none" stroke="#999" strokeWidth="1.2" strokeDasharray="4 3" />
    </svg>
  )
}

function AiInsight({ stock }) {
  const up = stock.change >= 0
  const momentum = up ? '단기 상승 모멘텀' : '단기 조정 흐름'
  const score = Math.min(95, 50 + Math.round(Math.abs(stock.changePct) * 8))
  return (
    <div className="ai-insight">
      <div className="ai-score">
        <div className="ai-score-num">{score}</div>
        <div className="ai-score-label">시그널 점수</div>
      </div>
      <ul className="ai-points">
        <li><b>{momentum}</b> — 최근 분봉 기준 {formatPct(stock.changePct)} 변동.</li>
        <li>업종({stock.sector}) 내 상대강도는 데모 기준 중립~양호.</li>
        <li className="ai-disc">※ 데모 분석이며 투자권유가 아닙니다.</li>
      </ul>
    </div>
  )
}
