'use client'

import { useRef, useEffect, useState } from 'react'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'

// ── Data interfaces ───────────────────────────────────────────────────────────

export interface WordCountEntry {
  date: string
  wordCountIntention: number | null
  wordCountGratitude: number | null
  wordCountGreatAt:   number | null
  wordCountTotal:     number | null
}

export interface WritingStatsProps {
  wordCountHistory: (WordCountEntry | null)[]
  slotDates: string[]
}

// ── Brand colours ─────────────────────────────────────────────────────────────

const COPPER     = '#A0622A'
const STEEL_BLUE = '#4A7FA5'
const EMERALD    = '#3AB87A'

// ── X-axis label helper ───────────────────────────────────────────────────────

function getXLabel(dateStr: string, isLast: boolean): { line1: string; line2: string } {
  if (isLast) return { line1: 'POST', line2: 'DATE' }
  const d = new Date(dateStr + 'T00:00:00')
  const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return { line1: DAY_NAMES[d.getDay()], line2: `${d.getDate()}/${d.getMonth() + 1}` }
}

// ── Stacked bar chart — 14-day calendar ──────────────────────────────────────

function WordCountBarChart({
  data,
  slotDates,
  revealed,
}: {
  data: (WordCountEntry | null)[]
  slotDates: string[]
  revealed: boolean
}) {
  const W = 300, H = 160
  const PAD_LEFT = 28, PAD_RIGHT = 8, PAD_TOP = 22, PAD_BOTTOM = 28
  const plotW = W - PAD_LEFT - PAD_RIGHT
  const plotH = H - PAD_TOP - PAD_BOTTOM

  const N = data.length
  if (N === 0) return null

  const totals = data.map(e => e?.wordCountTotal ?? 0)
  const rawMax = Math.max(...totals, 1)
  const yMax   = Math.ceil(rawMax * 1.15 / 100) * 100

  function yForWords(n: number) { return PAD_TOP + plotH - (n / yMax) * plotH }
  function barHeight(n: number) { return (n / yMax) * plotH }

  const slotW = plotW / N
  const barW  = slotW * 0.72
  function barX(i: number) { return PAD_LEFT + i * slotW + slotW * 0.14 }
  function labelX(i: number) { return PAD_LEFT + i * slotW + slotW / 2 }

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

      {/* Y-axis ticks */}
      {yTicks.map(v => (
        <text key={v} x={PAD_LEFT - 4} y={yForWords(v)}
          textAnchor="end" dominantBaseline="middle"
          style={{ fill: 'var(--chart-text, rgba(255,255,255,0.52))' }}
          fontSize="7" fontFamily="var(--font-inter), sans-serif"
        >
          {v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v}
        </text>
      ))}

      {/* Stacked bars — skip null (no-post) slots */}
      {data.map((e, i) => {
        if (!e) return null
        const isLast = i === N - 1
        const opacity = isLast ? 1.0 : 0.55
        const total = e.wordCountTotal ?? 0

        const intentionH = barHeight(e.wordCountIntention ?? 0)
        const gratitudeH = barHeight(e.wordCountGratitude ?? 0)
        const greatAtH   = barHeight(e.wordCountGreatAt   ?? 0)

        const intentionY = PAD_TOP + plotH - intentionH
        const gratitudeY = intentionY - gratitudeH
        const greatAtY   = gratitudeY - greatAtH

        const x = barX(i)
        const topLabelY = greatAtY - 3

        return (
          <g key={i}>
            {intentionH > 0 && (
              <rect x={x} y={intentionY} width={barW} height={intentionH}
                fill={isLast ? COPPER : STEEL_BLUE} fillOpacity={opacity} />
            )}
            {gratitudeH > 0 && (
              <rect x={x} y={gratitudeY} width={barW} height={gratitudeH}
                fill={EMERALD} fillOpacity={opacity} />
            )}
            {greatAtH > 0 && (
              <rect x={x} y={greatAtY} width={barW} height={greatAtH}
                fill={isLast ? STEEL_BLUE : COPPER} fillOpacity={opacity} />
            )}
            {topLabelY >= PAD_TOP + 5 && total > 0 && (
              <text x={x + barW / 2} y={topLabelY}
                textAnchor="middle" dominantBaseline="auto"
                style={{ fill: 'var(--chart-text, rgba(255,255,255,0.52))' }}
                fontSize="7" fontFamily="var(--font-inter), sans-serif"
              >
                {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
              </text>
            )}
          </g>
        )
      })}

      {/* X-axis labels (2 lines) */}
      {slotDates.map((dateStr, i) => {
        const { line1, line2 } = getXLabel(dateStr, i === N - 1)
        const x = labelX(i)
        const isLast = i === N - 1
        return (
          <text key={i} x={x} textAnchor="middle" fontSize="6.5"
            fontFamily="var(--font-inter), sans-serif"
            style={{ fill: isLast ? 'var(--chart-text-bright)' : 'var(--chart-text)' }}
            fontWeight={isLast ? 700 : 400}
          >
            <tspan x={x} y={H - PAD_BOTTOM + 10}>{line1}</tspan>
            <tspan x={x} dy="8">{line2}</tspan>
          </text>
        )
      })}
    </svg>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function WritingStatsClient({ wordCountHistory, slotDates }: WritingStatsProps) {
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

  return (
    <section ref={sectionRef} id="writing-stats" className="journal-section" style={{ paddingTop: '2.5rem' }}>
      {/* Top-of-section copper divider */}
      <div style={{ height: 3, background: COPPER, marginBottom: '1.5rem' }} />

      <SectionInfoHeader
        title="Words Written"
        description="Word counts across the last 14 days, broken down by section."
        popupBody="Each journal is written in three sections: Today's Intention, Gratitude, and Something I'm Great At. The bars show the word count for each section stacked together. Days with no post are shown as empty columns."
      />

      <div className="wss-wrap">
        <div className="wss-chart-block">
          <WordCountBarChart data={wordCountHistory} slotDates={slotDates} revealed={revealed} />
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
      </div>
    </section>
  )
}
