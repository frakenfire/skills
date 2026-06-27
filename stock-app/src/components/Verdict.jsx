// 종목 상태 요약 카드 — 초보도 한눈에. (권유가 아니라 '상태' 서술)
export default function Verdict({ p, compact = false }) {
  return (
    <div className={`verdict vbg-${p.tone} ${compact ? 'compact' : ''}`}>
      <span className={`v-dot d-${p.tone}`} />
      <div className="verdict-main">
        <div className="verdict-row">
          <span className={`v-label l-${p.tone}`}>{p.label}</span>
          <span className="verdict-headline">{p.headline}</span>
        </div>
        {!compact && <div className="verdict-kid">{p.kidLine}</div>}
        {!compact && (
          <div className="verdict-meta">
            신호 강도 <b>{p.strength}</b> · 데모 백테스트 적중 {p.backtest.hitRate}%
          </div>
        )}
      </div>
    </div>
  )
}
