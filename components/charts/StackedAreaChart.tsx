'use client'

interface Series {
  label: string
  values: number[]
  color: string
}

interface Props {
  series: Series[]  // bottom series first
  dates: string[]   // same length as values arrays
  height?: number
  width?: number
}

function fmtAxisDate(d: string): string {
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()]}`
}

export default function StackedAreaChart({ series, dates, height = 140, width = 300 }: Props) {
  const PAD_LEFT = 8
  const PAD_RIGHT = 8
  const PAD_TOP = 10
  const PAD_BOT = 18
  const plotW = width - PAD_LEFT - PAD_RIGHT
  const plotH = height - PAD_TOP - PAD_BOT

  const n = dates.length
  if (n === 0 || series.length === 0) return null

  // Cumulative stacks: cumulatives[i] = [stack0, stack1, stack2, ...]
  const cumulatives: number[][] = dates.map((_, i) => {
    let cum = 0
    return series.map(s => { cum += s.values[i] ?? 0; return cum })
  })

  const maxVal = Math.max(...cumulatives.map(row => row[row.length - 1]), 1)

  const xFor = (i: number) => PAD_LEFT + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const yFor = (v: number) => PAD_TOP + plotH - (v / maxVal) * plotH

  // Build filled area path for each series layer
  const layers = series.map((s, si) => {
    const topPts = cumulatives.map((row, i) => ({ x: xFor(i), y: yFor(row[si]) }))
    const botPts = si === 0
      ? cumulatives.map((_, i) => ({ x: xFor(i), y: yFor(0) }))
      : cumulatives.map((row, i) => ({ x: xFor(i), y: yFor(row[si - 1]) }))

    const topEdge = topPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const botEdgeRev = [...botPts].reverse().map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const areaPath = `${topEdge} ${botEdgeRev} Z`
    const strokePath = topEdge

    return { areaPath, strokePath, color: s.color, label: s.label }
  })

  // X-axis label indices: first, middle, last
  const labelIdxs = n <= 2
    ? dates.map((_, i) => i)
    : [0, Math.floor((n - 1) / 2), n - 1]

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        {/* Baseline */}
        <line
          x1={PAD_LEFT} y1={PAD_TOP + plotH}
          x2={PAD_LEFT + plotW} y2={PAD_TOP + plotH}
          stroke="var(--chart-axis, rgba(255,255,255,0.1))"
          strokeWidth="1"
        />

        {/* Series layers — bottom first */}
        {layers.map((layer, i) => (
          <g key={i}>
            <path d={layer.areaPath} fill={layer.color} fillOpacity={0.65} />
            <path d={layer.strokePath} fill="none" stroke={layer.color} strokeWidth="1.5" strokeOpacity={0.9} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}

        {/* X-axis labels */}
        {labelIdxs.map((idx, li) => (
          <text
            key={idx}
            x={xFor(idx)}
            y={height - 3}
            textAnchor={li === 0 ? 'start' : li === labelIdxs.length - 1 ? 'end' : 'middle'}
            fill="var(--chart-text, rgba(255,255,255,0.35))"
            fontSize="7"
            fontFamily="var(--font-inter), sans-serif"
          >
            {fmtAxisDate(dates[idx])}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginTop: '0.4rem',
        paddingLeft: '0.25rem',
      }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: s.color,
              opacity: 0.75,
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '0.62rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--body-text)',
              opacity: 0.5,
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
