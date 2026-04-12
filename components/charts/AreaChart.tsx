'use client'

import { yForVal, xForIdx, mean } from './chartUtils'

interface AreaChartProps {
  values: (number | null)[]
  min?: number
  max?: number
  color: string
  showAverage?: boolean
  xLabels?: string[]
  height?: number
  width?: number
  todayHighlight?: boolean
  revealed?: boolean
}

export default function AreaChart({
  values,
  min = 1,
  max = 8,
  color,
  showAverage = true,
  xLabels,
  height = 130,
  width = 300,
  todayHighlight = true,
  revealed = true,
}: AreaChartProps) {
  const PAD_LEFT = 24
  const PAD_RIGHT = 12
  const PAD_TOP = 10
  const PAD_BOTTOM = xLabels ? 22 : 12
  const plotW = width - PAD_LEFT - PAD_RIGHT
  const plotH = height - PAD_TOP - PAD_BOTTOM

  const yFor = (v: number) => yForVal(v, min, max, PAD_TOP, plotH)
  const xFor = (i: number) => xForIdx(i, values.length, PAD_LEFT, plotW)

  // Build area path from non-null values
  const points: { x: number; y: number; idx: number }[] = []
  values.forEach((v, i) => {
    if (v !== null) points.push({ x: xFor(i), y: yFor(v), idx: i })
  })

  if (points.length === 0) return null

  // Area path: line across top, close to bottom
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${PAD_TOP + plotH} L ${points[0].x.toFixed(1)} ${PAD_TOP + plotH} Z`

  const avg = showAverage ? mean(values) : null

  // Y-axis tick values
  const range = max - min
  const tickStep = range <= 8 ? 2 : Math.ceil(range / 4)
  const ticks: number[] = []
  for (let v = min + tickStep; v <= max; v += tickStep) ticks.push(v)

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{
        display: 'block',
        opacity: revealed ? 1 : 0,
        transition: 'opacity 0.6s ease 0.3s',
      }}
    >
      {/* Y-axis */}
      <line
        x1={PAD_LEFT} y1={PAD_TOP}
        x2={PAD_LEFT} y2={PAD_TOP + plotH}
        style={{ stroke: 'var(--chart-axis, rgba(255,255,255,0.12))' }}
        strokeWidth="1"
      />

      {/* X-axis */}
      <line
        x1={PAD_LEFT} y1={PAD_TOP + plotH}
        x2={PAD_LEFT + plotW} y2={PAD_TOP + plotH}
        style={{ stroke: 'var(--chart-axis, rgba(255,255,255,0.12))' }}
        strokeWidth="1"
      />

      {/* Y-axis labels */}
      {ticks.map(v => (
        <text
          key={v}
          x={PAD_LEFT - 6}
          y={yFor(v)}
          textAnchor="end"
          dominantBaseline="middle"
          style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }}
          fontSize="7"
          fontFamily="var(--font-inter), sans-serif"
        >
          {v}
        </text>
      ))}

      {/* X-axis labels */}
      {xLabels && xLabels.map((label, i) => (
        <text
          key={i}
          x={xFor(i)}
          y={height - 4}
          textAnchor="middle"
          style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }}
          fontSize="7"
          fontFamily="var(--font-inter), sans-serif"
        >
          {label}
        </text>
      ))}

      {/* Filled area */}
      <path
        d={areaPath}
        fill={color}
        fillOpacity={0.12}
      />

      {/* Stroke line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Average line — dashed */}
      {avg !== null && (
        <line
          x1={PAD_LEFT}
          y1={yFor(avg)}
          x2={PAD_LEFT + plotW}
          y2={yFor(avg)}
          style={{ stroke: 'var(--chart-avg, rgba(255,255,255,0.4))' }}
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
      )}

      {/* Data points */}
      {points.map((p, i) => {
        const isToday = todayHighlight && i === points.length - 1
        const opacity = isToday
          ? 1
          : points.length <= 2
            ? 0.5
            : 0.25 + (i / (points.length - 1)) * 0.6

        return (
          <circle
            key={p.idx}
            cx={p.x}
            cy={p.y}
            r={isToday ? 6 : 3}
            fill={isToday ? '#A0622A' : undefined}
            fillOpacity={opacity}
            style={{
              ...(isToday ? {} : { fill: 'var(--chart-dot-hist, #ffffff)' }),
              opacity: revealed ? 1 : 0,
              transition: `opacity 0.3s ease ${0.4 + i * 0.05}s`,
            }}
          />
        )
      })}
    </svg>
  )
}
