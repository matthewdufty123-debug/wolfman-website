'use client'

interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export default function Sparkline({
  data,
  color = 'var(--chart-sparkline, #A0622A)',
  width = 60,
  height = 20,
}: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const last = data[data.length - 1]
  const lastX = width - pad
  const lastY = pad + (1 - (last - min) / range) * (height - pad * 2)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  )
}
