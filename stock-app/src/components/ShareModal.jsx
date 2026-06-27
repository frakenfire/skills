import { useState } from 'react'
import { predict, formatPct } from '../data/market.js'

// SNS 홍보용 공유 카드. 종목 상태를 카드 + 복사 텍스트로 만들어 바이럴 루프를 만든다.
export default function ShareModal({ open, onClose, pick }) {
  const [copied, setCopied] = useState(false)
  if (!open || !pick) return null

  const p = predict(pick.stock)
  const shareText =
    `오늘의 종목 신호\n\n` +
    `${pick.stock.name} · ${p.label} (신호 강도 ${p.strength})\n` +
    `최근 흐름 ${formatPct(p.momentum)}\n\n` +
    `초보도 쉽게 보는 종목 신호, StockPulse에서 확인\n` +
    `#주식초보 #종목분석 #StockPulse`

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareText) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">공유하기</h2>

        <div className="share-card">
          <div className="share-card-top">오늘의 종목 신호</div>
          <div className="share-card-name">{pick.stock.name}</div>
          <div className="share-card-signal">{p.label}</div>
          <div className="share-card-conf">신호 강도 {p.strength}</div>
          <div className="share-card-brand">StockPulse · 초보를 위한 주식</div>
        </div>

        <div className="share-text">{shareText}</div>

        <button className="btn-toss" onClick={copy}>
          {copied ? '복사됐어요 — 붙여넣기 하세요' : '문구 복사하기'}
        </button>
        <button className="btn-toss-ghost" onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
