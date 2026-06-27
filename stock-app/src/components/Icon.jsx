// 라인 아이콘(feather 스타일). 이모지 대신 사용해 제품 톤을 정돈한다.
const PATHS = {
  home: <><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>,
  signal: <><polyline points="2 13 7 13 10 4 14 20 17 11 22 11" /></>,
  chart: <><line x1="6" y1="20" x2="6" y2="13" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="18" y1="20" x2="18" y2="9" /></>,
  user: <><path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21" /><circle cx="12" cy="7.5" r="4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></>,
  bell: <><path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5" /><path d="M13.5 20a2 2 0 0 1-3 0" /></>,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><line x1="8.1" y1="13.2" x2="15.9" y2="17.8" /><line x1="15.9" y1="6.2" x2="8.1" y2="10.8" /></>,
  lock: <><rect x="4" y="10.5" width="16" height="10" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  star: <><polygon points="12 3 14.6 8.5 20.5 9.3 16.2 13.4 17.3 19.3 12 16.5 6.7 19.3 7.8 13.4 3.5 9.3 9.4 8.5" /></>,
  check: <><polyline points="20 6.5 9.5 17 4.5 12" /></>,
  chevron: <><polyline points="9 5 16 12 9 19" /></>,
  trend: <><polyline points="3 17 9.5 10.5 13.5 14.5 21 7" /><polyline points="15 7 21 7 21 13" /></>,
  shield: <><path d="M12 3l7 2.5v5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5v-5z" /></>,
}

export default function Icon({ name, size = 22, stroke = 1.8, fill = 'none', className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === 'star' ? 'currentColor' : fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
