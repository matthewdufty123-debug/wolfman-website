'use client'

import { useRef, useEffect, useState } from 'react'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'
import ZoneDistribution from '@/components/charts/ZoneDistribution'

// ── Data interfaces ──────────────────────────────────────────────────────────

export interface WordCountEntry {
  date: string
  wordCountIntention: number | null
  wordCountGratitude: number | null
  wordCountGreatAt:   number | null
  wordCountTotal:     number | null
}

export interface PostingFrequencyData {
  current30Count:  number
  previous30Count: number
}

export interface MonthlyData {
  currentMonth:       { date: string }[]
  previousMonth:      { date: string }[]
  currentMonthLabel:  string
  previousMonthLabel: string
  currentMonthIndex:  number
  previousMonthIndex: number
  currentYear:        number
  previousYear:       number
}

export interface WritingStatsProps {
  wordCountHistory: WordCountEntry[]
  frequencyData:    PostingFrequencyData | null
  monthlyData:      MonthlyData | null
  postDate:         string
  isOwner:          boolean
}

// ── Brand colours ────────────────────────────────────────────────────────────

const COPPER     = '#A0622A'
const STEEL_BLUE = '#4A7FA5'
const EMERALD    = '#3AB87A'

// ── Chart 1: Stacked Word Count Bars ────────────────────────────────────────

function WordCountBarChart({ data, revealed }: { data: WordCountEntry[]; revealed: boolean }) {
  const W = 300, H = 160
  const PAD_LEFT = 28, PAD_RIGHT = 16, PAD_TOP = 22, PAD_BOTTOM = 26
  const plotW = W - PAD_LEFT - PAD_RIGHT
  const plotH = H - PAD_TOP - PAD_BOTTOM

  const barCount = data.length
  if (barCount === 0) return null

  const totals = data.map(e => e.wordCountTotal ?? 0)
  const rawMax = Math.max(...totals, 1)
  const yMax   = Math.ceil(rawMax / 100) * 100

  function yForWords(n: number) { return PAD_TOP + plotH - (n / yMax) * plotH }
  function barHeight(n: number) { return (n / yMax) * plotH }

  const slotW = plotW / barCount
  const barW  = slotW * 0.72
  function barX(i: number) { return PAD_LEFT + i * slotW + slotW * 0.14 }

  const avg = totals.reduce((a, b) => a + b, 0) / barCount
  const avgY = yForWords(avg)

  // Y-axis tick values
  const yTicks = [0, Math.round(yMax / 2), yMax]

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ opacity: revealed ? 1 : 0, transition: 'opacity 0.6s ease 0.5s' }}
    >
      {/* Axis lines */}
      <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + plotH}
        style={{ stroke: 'var(--chart-axis, rgba(255,255,255,0.12))' }} strokeWidth="1" />
      <line x1={PAD_LEFT} y1={PAD_TOP + plotH} x2={PAD_LEFT + plotW} y2={PAD_TOP + plotH}
        style={{ stroke: 'var(--chart-axis, rgba(255,255,255,0.12))' }} strokeWidth="1" />

      {/* Y-axis tick labels */}
      {yTicks.map(v => (
        <text key={v}
          x={PAD_LEFT - 4} y={yForWords(v)}
          textAnchor="end" dominantBaseline="middle"
          style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }}
          fontSize="7" fontFamily="var(--font-inter), sans-serif"
        >
          {v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v}
        </text>
      ))}

      {/* Average dashed line */}
      <line x1={PAD_LEFT} y1={avgY} x2={PAD_LEFT + plotW} y2={avgY}
        style={{ stroke: 'var(--chart-avg, rgba(255,255,255,0.4))' }}
        strokeWidth="1.5" strokeDasharray="6 4" />

      {/* Stacked bars */}
      {data.map((e, i) => {
        const isToday = i === barCount - 1
        const opacity = isToday ? 1.0 : 0.55
        const total = e.wordCountTotal ?? 0

        const intentionH = barHeight(e.wordCountIntention ?? 0)
        const gratitudeH = barHeight(e.wordCountGratitude ?? 0)
        const greatAtH   = barHeight(e.wordCountGreatAt   ?? 0)

        const intentionY = PAD_TOP + plotH - intentionH
        const gratitudeY = intentionY - gratitudeH
        const greatAtY   = gratitudeY - greatAtH

        const x = barX(i)
        const labelY = greatAtY - 3

        return (
          <g key={i}>
            {intentionH > 0 && (
              <rect x={x} y={intentionY} width={barW} height={intentionH}
                fill={STEEL_BLUE} fillOpacity={opacity} />
            )}
            {gratitudeH > 0 && (
              <rect x={x} y={gratitudeY} width={barW} height={gratitudeH}
                fill={EMERALD} fillOpacity={opacity} />
            )}
            {greatAtH > 0 && (
              <rect x={x} y={greatAtY} width={barW} height={greatAtH}
                fill={COPPER} fillOpacity={opacity} />
            )}
            {/* Total label above bar — hide if too close to top edge */}
            {labelY >= PAD_TOP + 5 && total > 0 && (
              <text
                x={x + barW / 2} y={labelY}
                textAnchor="middle" dominantBaseline="auto"
                style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }}
                fontSize="7" fontFamily="var(--font-inter), sans-serif"
              >
                {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
              </text>
            )}
          </g>
        )
      })}

      {/* X-axis label */}
      <text
        x={PAD_LEFT + plotW / 2} y={H - 4}
        textAnchor="middle"
        style={{ fill: 'var(--chart-text, rgba(255,255,255,0.3))' }}
        fontSize="7" fontFamily="var(--font-inter), sans-serif"
      >
        {`Today and ${Math.max(barCount - 1, 0)} journal history`}
      </text>
    </svg>
  )
}

// ── Chart 2: Posting Frequency ───────────────────────────────────────────────

function PostingFrequencyBlock({ data, revealed }: { data: PostingFrequencyData; revealed: boolean }) {
  const { current30Count, previous30Count } = data
  const pct = Math.round((current30Count / 30) * 100)
  const diff = current30Count - previous30Count
  const isUp = diff > 0
  const isEqual = diff === 0
  const noBoth = current30Count === 0 && previous30Count === 0

  return (
    <div
      className="wss-freq-block"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease 0.7s, transform 0.5s ease 0.7s',
      }}
    >
      <p className="wss-chart-title">How Often</p>
      <div className="wss-freq-row">
        <div>
          <div className="wss-freq-stat">{current30Count} journals</div>
          <div className="wss-freq-sub">{pct}% of days in 30-day window</div>
        </div>

        {!noBoth && !isEqual && (
          <div className="wss-delta">
            <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
              {isUp
                ? <polygon points="7,0 14,10 0,10" fill={COPPER} />
                : <polygon points="0,0 14,0 7,10" fill={COPPER} />
              }
            </svg>
            <span className="wss-delta-value">{isUp ? '+' : ''}{diff}</span>
            <span className="wss-delta-label">vs prev 30 days</span>
          </div>
        )}
        {!noBoth && isEqual && (
          <div className="wss-delta">
            <span className="wss-delta-value">=</span>
            <span className="wss-delta-label">same as prev 30 days</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Chart 3: Cumulative Monthly Line ────────────────────────────────────────

interface CumulativePoint { day: number; count: number }

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function buildCumulative(
  dates: { date: string }[],
  year: number,
  monthIdx: number,
): CumulativePoint[] {
  const totalDays = daysInMonth(year, monthIdx)
  const dayCounts: Record<number, number> = {}
  for (const { date } of dates) {
    const d = new Date(date + 'T12:00:00Z')
    if (d.getUTCFullYear() === year && d.getUTCMonth() === monthIdx) {
      const day = d.getUTCDate()
      dayCounts[day] = (dayCounts[day] ?? 0) + 1
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

function MonthlyLineChart({
  data,
  postDate,
  revealed,
}: {
  data: MonthlyData
  postDate: string
  revealed: boolean
}) {
  const combined = data.currentMonth.length + data.previousMonth.length
  if (combined < 3) {
    return (
      <div className="wss-building-data">
        <span>We&rsquo;re building your data</span>
        <span style={{ fontSize: '0.55rem', opacity: 0.7, marginTop: 2 }}>
          {combined} of 3 journals needed
        </span>
      </div>
    )
  }

  const W = 300, H = 130
  const PAD_LEFT = 28, PAD_RIGHT = 16, PAD_TOP = 20, PAD_BOTTOM = 26
  const plotW = W - PAD_LEFT - PAD_RIGHT
  const plotH = H - PAD_TOP - PAD_BOTTOM

  const todayD = new Date(postDate + 'T12:00:00Z')
  const todayDay = todayD.getUTCDate()

  const curPoints  = buildCumulative(data.currentMonth,  data.currentYear,  data.currentMonthIndex)
  const prevPoints = buildCumulative(data.previousMonth, data.previousYear, data.previousMonthIndex)

  const daysInCurrent  = daysInMonth(data.currentYear,  data.currentMonthIndex)
  const daysInPrevious = daysInMonth(data.previousYear, data.previousMonthIndex)
  const xMax = Math.max(daysInCurrent, daysInPrevious, 1)

  const maxCount = Math.max(data.currentMonth.length, data.previousMonth.length, 1)
  const yMax = Math.max(Math.ceil(maxCount / 5) * 5, 5)

  function xForDay(d: number) {
    if (xMax <= 1) return PAD_LEFT + plotW / 2
    return PAD_LEFT + ((d - 1) / (xMax - 1)) * plotW
  }
  function yForCount(n: number) { return PAD_TOP + plotH - (n / yMax) * plotH }

  function toPolyline(pts: CumulativePoint[], upToDay?: number): string {
    const filtered = upToDay != null ? pts.filter(p => p.day <= upToDay) : pts
    return filtered.map(p => `${xForDay(p.day).toFixed(1)},${yForCount(p.count).toFixed(1)}`).join(' ')
  }

  const todayCount = curPoints.find(p => p.day === todayDay)?.count ?? 0

  // X-axis tick days to label
  const xTicks = Array.from(new Set([1, 10, 20, xMax].filter(d => d >= 1 && d <= xMax)))

  // Legend position — top right
  const legendX = PAD_LEFT + plotW - 4
  const legendY1 = PAD_TOP + 2
  const legendY2 = PAD_TOP + 14

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ opacity: revealed ? 1 : 0, transition: 'opacity 0.6s ease 0.9s' }}
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
        >{v}</text>
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

      {/* Current month line — copper solid, up to today */}
      {curPoints.filter(p => p.day <= todayDay).length > 0 && (
        <polyline
          fill="none"
          stroke={COPPER}
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
          stroke={COPPER} strokeWidth="1.5" strokeOpacity="0.2" strokeDasharray="3 4"
        />
      )}

      {/* Today's dot */}
      <circle
        cx={xForDay(todayDay)} cy={yForCount(todayCount)}
        r="5" fill={COPPER}
      />

      {/* Legend — top right */}
      <line x1={legendX - 40} y1={legendY1} x2={legendX - 28} y2={legendY1}
        stroke={COPPER} strokeWidth="2" />
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

// ── Main export ──────────────────────────────────────────────────────────────

export default function WritingStatsClient({
  wordCountHistory,
  frequencyData,
  monthlyData,
  postDate,
  isOwner,
}: WritingStatsProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Reverse to chronological (oldest left, newest right)
  const chronological = [...wordCountHistory].reverse()

  return (
    <section ref={sectionRef} id="writing-stats" className="journal-section">
      <SectionInfoHeader
        title="Words Written"
        description="Word counts across the last 10 journals, broken down by section."
        popupBody="Each journal is written in three sections: Today's Intention, Gratitude, and Something I'm Great At. The bars show the word count for each section stacked together, with the dashed line showing the average across recent journals."
      />

      {/* Summary stats */}
      {(() => {
        const totals = chronological.map(e => e.wordCountTotal ?? 0)
        const todayTotal = totals[totals.length - 1] ?? 0
        const prevTotals = totals.slice(0, -1).filter(v => v > 0)
        const avg = prevTotals.length > 0
          ? Math.round(prevTotals.reduce((a, b) => a + b, 0) / prevTotals.length)
          : null
        const delta = avg !== null ? todayTotal - avg : null

        // Word count zones
        const validTotals = totals.filter(v => v > 0)
        const zones = [
          { label: '0–199', min: 0, max: 199 },
          { label: '200–399', min: 200, max: 399 },
          { label: '400–599', min: 400, max: 599 },
          { label: '600–799', min: 600, max: 799 },
          { label: '800–999', min: 800, max: 999 },
          { label: '1000+', min: 1000, max: Infinity },
        ].map(z => {
          const count = validTotals.filter(v => v >= z.min && v <= z.max).length
          return { label: z.label, count, percentage: validTotals.length > 0 ? (count / validTotals.length) * 100 : 0 }
        }).filter(z => z.count > 0)

        return (
          <div style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s',
          }}>
            <div className="chart-stat-summary">
              <div className="chart-stat-summary-item">
                <div className="chart-stat-summary-value">{todayTotal.toLocaleString()}</div>
                <div className="chart-stat-summary-label">Today</div>
              </div>
              <div className="chart-stat-summary-item">
                <div className="chart-stat-summary-value">{avg !== null ? avg.toLocaleString() : '—'}</div>
                <div className="chart-stat-summary-label">10-Day Avg</div>
              </div>
              <div className="chart-stat-summary-item">
                <div className="chart-stat-summary-value">
                  {delta !== null ? `${delta >= 0 ? '+' : ''}${delta}` : '—'}
                </div>
                <div className="chart-stat-summary-label">vs Average</div>
              </div>
            </div>

            {zones.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p className="chart-card-title" style={{ marginBottom: '0.5rem' }}>Where your word counts land</p>
                <ZoneDistribution zones={zones} color={STEEL_BLUE} sortByValue />
              </div>
            )}
          </div>
        )
      })()}

      <div className="wss-wrap">
        {/* Chart 1 — Stacked bars (everyone) */}
        <div className="wss-chart-block">
          <WordCountBarChart data={chronological} revealed={revealed} />
          <div className="wss-bar-legend">
            <span className="wss-legend-item">
              <span className="wss-legend-swatch" style={{ background: STEEL_BLUE }} />
              Intention
            </span>
            <span className="wss-legend-item">
              <span className="wss-legend-swatch" style={{ background: EMERALD }} />
              Gratitude
            </span>
            <span className="wss-legend-item">
              <span className="wss-legend-swatch" style={{ background: COPPER }} />
              Great At
            </span>
          </div>
        </div>

        {/* Chart 2 — Posting frequency (owner only) */}
        {isOwner && frequencyData && (
          <PostingFrequencyBlock data={frequencyData} revealed={revealed} />
        )}

        {/* Chart 3 — Cumulative monthly line (owner only) */}
        {isOwner && monthlyData && (
          <div
            className="wss-monthly-block"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.5s ease 0.9s, transform 0.5s ease 0.9s',
            }}
          >
            <p className="wss-chart-title">This Month vs Last</p>
            <MonthlyLineChart data={monthlyData} postDate={postDate} revealed={revealed} />
          </div>
        )}
      </div>
    </section>
  )
}
