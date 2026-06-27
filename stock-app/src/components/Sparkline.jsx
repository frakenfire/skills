// 의존성 없는 SVG 스파크라인. 무료/Pro 모두 노출되지만,
// Pro의 상세 차트(DeepChart)는 별도로 더 풍부하게 그린다.
export default function Sparkline({ series, up, width = 120, height = 36, strokeWidth = 1.8 }) {
  if (!series || series.length === 0) return null
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1
  const stepX = width / (series.length - 1)
  const points = series
    .map((v, i) => {
      const x = i * stepX
      const y = height - ((v - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const color = up ? '#e5494d' : '#2f6fed' // 한국 관습: 상승 빨강, 하락 파랑
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}
