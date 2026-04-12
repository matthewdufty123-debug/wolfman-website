'use client'

import { useRef, useEffect, useState } from 'react'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'

// ── Data interfaces ──────────────────────────────────────────────────────────

export interface WordCountEntry {
  date: string
  wordCountIntention: number | null
  wordCountGratitude: number | null
  wordCountGreatAt:   number | null
  wordCountTotal:     number | null
}

export interface CalendarDay {
  date: string
  hasPost: boolean
}

export interface WritingStatsProps {
  wordCountHistory: WordCountEntry[]
  calendarDays?: CalendarDay[]
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
  const yMax   = Math.ceil(rawMax * 1.15 / 100) * 100

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

// ── Main export ──────────────────────────────────────────────────────────────

export default function WritingStatsClient({
  wordCountHistory,
  calendarDays,
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

        {/* 10-day posting calendar */}
        {calendarDays && calendarDays.length > 0 && (
          <div
            className="wss-calendar"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.5s ease 0.7s, transform 0.5s ease 0.7s',
            }}
          >
            <p className="wss-chart-title">Last 10 Days</p>
            <div className="wss-calendar-row">
              {calendarDays.map((day, i) => {
                const d = new Date(day.date + 'T12:00:00Z')
                const label = d.getUTCDate().toString()
                const isToday = i === calendarDays.length - 1
                return (
                  <div key={day.date} className="wss-calendar-day">
                    <div
                      className={`wss-calendar-dot${day.hasPost ? ' wss-calendar-dot--filled' : ''}`}
                      style={{
                        background: day.hasPost
                          ? (isToday ? COPPER : STEEL_BLUE)
                          : 'transparent',
                        borderColor: day.hasPost
                          ? (isToday ? COPPER : STEEL_BLUE)
                          : 'var(--chart-zone-track, rgba(74,127,165,0.15))',
                      }}
                    />
                    <span className="wss-calendar-label">{label}</span>
                  </div>
                )
              })}
            </div>
            <p className="wss-calendar-count">
              {calendarDays.filter(d => d.hasPost).length} of 10 days
            </p>
          </div>
        )}

      </div>
    </section>
  )
}
