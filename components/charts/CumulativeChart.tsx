'use client'

interface CumulativePoint { day: number; count: number }

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

/**
 * Build cumulative points from either:
 * - An array of { date } entries (counts occurrences per day), or
 * - A Record<date, number> of pre-aggregated daily values
 */
function buildCumulative(
  source: { date: string }[] | Record<string, number>,
  year: number,
  monthIdx: number,
): CumulativePoint[] {
  const totalDays = daysInMonth(year, monthIdx)
  const dayCounts: Record<number, number> = {}

  if (Array.isArray(source)) {
    for (const { date } of source) {
      const d = new Date(date + 'T12:00:00Z')
      if (d.getUTCFullYear() === year && d.getUTCMonth() === monthIdx) {
        const day = d.getUTCDate()
        dayCounts[day] = (dayCounts[day] ?? 0) + 1
      }
    }
  } else {
    for (const [date, value] of Object.entries(source)) {
      const d = new Date(date + 'T12:00:00Z')
      if (d.getUTCFullYear() === year && d.getUTCMonth() === monthIdx) {
        dayCounts[d.getUTCDate()] = (dayCounts[d.getUTCDate()] ?? 0) + value
      }
    }
  }

  const points: CumulativePoint[] = []
  let running = 0
  for (let day = 1; day <= totalDays; day++) {
    running += dayCounts[day] ?? 0
    points.push({ day, count: running })
  }
  return points
}

export interface CumulativeChartData {
  /** Array of { date } for count-based cumulative, or Record<date, number> for value-based */
  currentMonth:       { date: string }[] | Record<string, number>
  previousMonth:      { date: string }[] | Record<string, number>
  currentMonthLabel:  string
  previousMonthLabel: string
  currentMonthIndex:  number
  previousMonthIndex: number
  currentYear:        number
  previousYear:       number
}

interface Props {
  data: CumulativeChartData
  /** Color for the current-month line */
  color?: string
  /** Which day to highlight as "today" (defaults to current day of month) */
  todayDay?: number
  /** Format large numbers (e.g. words) with k suffix */
  formatLarge?: boolean
}

export default function CumulativeChart({
  data,
  color = '#A0622A',
  todayDay: todayDayProp,
  formatLarge = false,
}: Props) {
  const curSource = data.currentMonth
  const prevSource = data.previousMonth
  const curLen = Array.isArray(curSource) ? curSource.length : Object.values(curSource).reduce((a, b) => a + b, 0)
  const prevLen = Array.isArray(prevSource) ? prevSource.length : Object.values(prevSource).reduce((a, b) => a + b, 0)
  if (curLen + prevLen === 0) return null

  const W = 300, H = 130
  const PAD_LEFT = 28, PAD_RIGHT = 16, PAD_TOP = 20, PAD_BOTTOM = 26
  const plotW = W - PAD_LEFT - PAD_RIGHT
  const plotH = H - PAD_TOP - PAD_BOTTOM

  const todayDay = todayDayProp ?? new Date().getUTCDate()

  const curPoints  = buildCumulative(curSource,  data.currentYear,  data.currentMonthIndex)
  const prevPoints = buildCumulative(prevSource, data.previousYear, data.previousMonthIndex)

  const daysInCurrent  = daysInMonth(data.currentYear,  data.currentMonthIndex)
  const daysInPrevious = daysInMonth(data.previousYear, data.previousMonthIndex)
  const xMax = Math.max(daysInCurrent, daysInPrevious, 1)

  const maxCount = Math.max(
    curPoints[curPoints.length - 1]?.count ?? 0,
    prevPoints[prevPoints.length - 1]?.count ?? 0,
    1,
  )
  const yMax = formatLarge
    ? Math.ceil(maxCount * 1.1 / 100) * 100  // round to nearest 100 for words
    : Math.max(Math.ceil(maxCount / 5) * 5, 5)

  function xForDay(d: number) {
    if (xMax <= 1) return PAD_LEFT + plotW / 2
    return PAD_LEFT + ((d - 1) / (xMax - 1)) * plotW
  }
  function yForCount(n: number) { return PAD_TOP + plotH - (n / yMax) * plotH }

  function toPolyline(pts: CumulativePoint[], upToDay?: number): string {
    const filtered = upToDay != null ? pts.filter(p => p.day <= upToDay) : pts
    return filtered.map(p => `${xForDay(p.day).toFixed(1)},${yForCount(p.count).toFixed(1)}`).join(' ')
  }

  function fmtY(v: number): string {
    if (formatLarge && v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`
    return String(v)
  }

  const todayCount = curPoints.find(p => p.day === todayDay)?.count ?? 0
  const xTicks = Array.from(new Set([1, 10, 20, xMax].filter(d => d >= 1 && d <= xMax)))

  const legendX = PAD_LEFT + plotW - 4
  const legendY1 = PAD_TOP + 2
  const legendY2 = PAD_TOP + 14

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Axis lines */}
      <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + plotH}
        style={{ stroke: 'var(--chart-axis, rgba(255,255,255,0.12))' }} strokeWidth="1" />
      <line x1={PAD_LEFT} y1={PAD_TOP + plotH} x2={PAD_LEFT + plotW} y2={PAD_TOP + plotH}
        style={{ stroke: 'var(--chart-axis, rgba(255,255,255,0.12))' }} strokeWidth="1" />

      {/* Y-axis ticks */}
      {[0, yMax].map(v => (
        <text key={v}
          x={PAD_LEFT - 4} y={yForCount(v)}
          textAnchor="end" dominantBaseline="middle"
          style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }}
          fontSize="7" fontFamily="var(--font-inter), sans-serif"
        >{fmtY(v)}</text>
      ))}

      {/* X-axis tick labels */}
      {xTicks.map(d => (
        <text key={d}
          x={xForDay(d)} y={H - 4}
          textAnchor="middle"
          style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }}
          fontSize="7" fontFamily="var(--font-inter), sans-serif"
        >{d}</text>
      ))}

      {/* Previous month line — dashed, muted */}
      {prevPoints.length > 1 && (
        <polyline
          fill="none"
          style={{ stroke: 'var(--chart-avg, rgba(255,255,255,0.4))' }}
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={toPolyline(prevPoints)}
        />
      )}

      {/* Current month line — coloured solid, up to today */}
      {curPoints.filter(p => p.day <= todayDay).length > 0 && (
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={toPolyline(curPoints, todayDay)}
        />
      )}

      {/* Faint continuation from today to end of month */}
      {todayDay < daysInCurrent && (
        <line
          x1={xForDay(todayDay)} y1={yForCount(todayCount)}
          x2={xForDay(daysInCurrent)} y2={yForCount(todayCount)}
          stroke={color} strokeWidth="1.5" strokeOpacity="0.2" strokeDasharray="3 4"
        />
      )}

      {/* Today's dot */}
      <circle
        cx={xForDay(todayDay)} cy={yForCount(todayCount)}
        r="5" fill={color}
      />

      {/* Legend — top right */}
      <line x1={legendX - 40} y1={legendY1} x2={legendX - 28} y2={legendY1}
        stroke={color} strokeWidth="2" />
      <text x={legendX - 25} y={legendY1} dominantBaseline="middle"
        style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }}
        fontSize="7" fontFamily="var(--font-inter), sans-serif"
      >{data.currentMonthLabel}</text>

      <line x1={legendX - 40} y1={legendY2} x2={legendX - 28} y2={legendY2}
        style={{ stroke: 'var(--chart-avg, rgba(255,255,255,0.4))' }}
        strokeWidth="1.5" strokeDasharray="5 3" />
      <text x={legendX - 25} y={legendY2} dominantBaseline="middle"
        style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }}
        fontSize="7" fontFamily="var(--font-inter), sans-serif"
      >{data.previousMonthLabel}</text>
    </svg>
  )
}
