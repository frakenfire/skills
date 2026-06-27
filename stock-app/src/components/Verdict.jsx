// 초보·어린아이도 1초 만에 판단하는 신호등 카드.
// 🟢 사도 좋아요 / 🟡 기다려요 / 🔴 파는 걸 생각해봐요 + 점수.
export default function Verdict({ p, compact = false }) {
  return (
    <div className={`verdict vbg-${p.tone} ${compact ? 'compact' : ''}`}>
      <div className="verdict-light">{p.emoji}</div>
      <div className="verdict-main">
        <div className="verdict-headline">{p.headline}</div>
        {!compact && <div className="verdict-kid">{p.kidLine}</div>}
      </div>
      <div className="verdict-score">
        <div className="vs-num">{p.confidence}</div>
        <div className="vs-label">점</div>
      </div>
    </div>
  )
}
