import { useState } from 'react'
import { predict, formatPct } from '../data/market.js'

// 스레드/SNS 홍보용 공유 카드.
// "오늘의 AI 추천"을 예쁜 카드 + 복사 가능한 텍스트로 만들어 바이럴 루프를 만든다.
export default function ShareModal({ open, onClose, pick }) {
  const [copied, setCopied] = useState(false)
  if (!open || !pick) return null

  const p = predict(pick.stock)
  const shareText =
    `📊 오늘의 AI 주식 예측\n\n` +
    `${pick.stock.name} → ${p.emoji} ${p.signal} (신뢰도 ${p.confidence}%)\n` +
    `최근 흐름 ${formatPct(p.momentum)}\n\n` +
    `초보도 쉽게 보는 매수·매도 신호, StockPulse에서 무료로 확인 👉\n` +
    `#주식초보 #주식추천 #StockPulse`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
    } catch {
      /* 클립보드 권한 없으면 무시 */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">스레드에 공유하기</h2>

        {/* 미리보기 카드 */}
        <div className="share-card">
          <div className="share-card-top">📊 오늘의 AI 예측</div>
          <div className="share-card-name">{pick.stock.name}</div>
          <div className={`share-card-signal s-${p.tone}`}>{p.emoji} {p.signal}</div>
          <div className="share-card-conf">AI 신뢰도 {p.confidence}%</div>
          <div className="share-card-brand">StockPulse · 초보를 위한 주식 신호</div>
        </div>

        <div className="share-text">{shareText}</div>

        <button className="btn-toss" onClick={copy}>
          {copied ? '✓ 복사됐어요! 스레드에 붙여넣기' : '문구 복사하기'}
        </button>
        <button className="btn-toss-ghost" onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
