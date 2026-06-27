import { useState } from 'react'

// 첫 진입: 관심 종목 1~3개를 고르게 해서 개인화를 바로 시작한다.
const MAX = 3

export default function OnboardingSheet({ open, stocks, onDone }) {
  const [picked, setPicked] = useState([])
  if (!open) return null

  const toggle = (sym) => {
    setPicked((p) =>
      p.includes(sym) ? p.filter((s) => s !== sym) : p.length < MAX ? [...p, sym] : p,
    )
  }

  return (
    <div className="modal-backdrop">
      <div className="sheet onboard">
        <div className="sheet-handle" />
        <h2 className="sheet-title">관심 종목을 골라보세요</h2>
        <p className="sheet-sub">최대 {MAX}개. 홈에서 바로 흐름을 확인할 수 있어요.</p>

        <div className="onboard-grid">
          {stocks.map((s) => (
            <button
              key={s.symbol}
              className={`chip ${picked.includes(s.symbol) ? 'on' : ''}`}
              onClick={() => toggle(s.symbol)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <button className="btn-toss" onClick={() => onDone(picked)}>
          {picked.length ? `${picked.length}개로 시작하기` : '시작하기'}
        </button>
        <button className="btn-toss-ghost" onClick={() => onDone([])}>나중에 할게요</button>
      </div>
    </div>
  )
}
