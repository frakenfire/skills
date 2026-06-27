// 토스풍 하단 탭 네비게이션
const TABS = [
  { id: 'home', icon: '🏠', label: '홈' },
  { id: 'predict', icon: '🤖', label: 'AI예측' },
  { id: 'stocks', icon: '📊', label: '종목' },
  { id: 'my', icon: '👤', label: 'MY' },
]

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="bottomnav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`navbtn ${tab === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="navicon">{t.icon}</span>
          <span className="navlabel">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
