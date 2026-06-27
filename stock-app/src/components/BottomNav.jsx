import Icon from './Icon.jsx'

const TABS = [
  { id: 'home', icon: 'home', label: '홈' },
  { id: 'predict', icon: 'signal', label: '신호' },
  { id: 'stocks', icon: 'chart', label: '종목' },
  { id: 'my', icon: 'user', label: 'MY' },
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
          <Icon name={t.icon} size={22} stroke={tab === t.id ? 2.1 : 1.8} />
          <span className="navlabel">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
