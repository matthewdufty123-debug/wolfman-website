'use client'

import { useRef, useEffect, useState } from 'react'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'
import type { ScaleHistoryEntry } from '@/app/(main)/[username]/[slug]/_sections/HowIShowedUpSection'

// ── Labels for each scale ───────────────────────────────────────────────────

const BRAIN_LABELS  = ['Completely Silent', 'Very Peaceful', 'Quite Quiet', 'Chill', 'Active', 'Busy', 'Hyper Focused', 'Totally Manic']
const BODY_LABELS   = ['Nothing to Give', 'Running Empty', 'Sluggish', 'Slow', 'Steady', 'Energised', 'Firing Hard', 'Absolutely Buzzing']
const HAPPY_LABELS  = ['Completely Lost', 'Struggling', 'Bit Low', 'Flat', 'Okay', 'Happy', 'Bike Smiles', 'Absolutely Joyful']
const STRESS_LABELS = ['Completely Overwhelmed', 'Anxious', 'Stressed', 'Unsettled', 'Peaceful', 'Focused', 'Primed', 'Hunt Mode']

// ── Brand colours ───────────────────────────────────────────────────────────

const COPPER = '#A0622A'

// ── Colour interpolation — 1 = pale blue, 8 = intense ──────────────────────

function getScaleColor(value: number, isStress = false): string {
  const t = (value - 1) / 7
  if (isStress) {
    const rVal = Math.round(0xa8 + (0xc8 - 0xa8) * t)
    const gVal = Math.round(0xd0 + (0x78 - 0xd0) * t)
    const bVal = Math.round(0xe0 + (0x40 - 0xe0) * t)
    return `rgb(${rVal},${gVal},${bVal})`
  }
  const rVal = Math.round(0xa8 + (0x2a - 0xa8) * t)
  const gVal = Math.round(0xd0 + (0x6a - 0xd0) * t)
  const bVal = Math.round(0xe0 + (0xb0 - 0xe0) * t)
  return `rgb(${rVal},${gVal},${bVal})`
}

// ── Segmented ring ──────────────────────────────────────────────────────────

function SegmentedRing({ value, color, size = 64, revealed }: {
  value: number
  color: string
  size?: number
  revealed: boolean
}) {
  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 5
  const SEGMENTS    = 8
  const GAP_DEG     = 4
  const ARC_DEG     = 360 / SEGMENTS - GAP_DEG
  const STAGGER_S   = 0.13

  const arcLength = (ARC_DEG / 360) * 2 * Math.PI * r

  function toXY(deg: number) {
    const rad = (deg - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arcPath(i: number) {
    const startAngle = -(i * 45 + GAP_DEG / 2)
    const endAngle   = startAngle - ARC_DEG
    const s = toXY(startAngle)
    const e = toXY(endAngle)
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 0 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}>
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const isFilled = i < value
          return (
            <path
              key={i}
              d={arcPath(i)}
              fill="none"
              stroke={color}
              strokeWidth={3.5}
              strokeOpacity={isFilled ? 1 : 0.15}
              strokeLinecap="round"
              strokeDasharray={isFilled ? arcLength : undefined}
              strokeDashoffset={isFilled ? (revealed ? 0 : arcLength) : undefined}
              style={isFilled ? {
                transition: revealed
                  ? `stroke-dashoffset 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${i * STAGGER_S}s`
                  : 'none',
              } : undefined}
            />
          )
        })}
      </svg>
      <span style={{
        fontFamily: 'var(--font-lora), Georgia, serif',
        fontSize: '1.5rem',
        fontWeight: 700,
        color,
        lineHeight: 1,
        position: 'relative',
      }}>
        {value}
      </span>
    </div>
  )
}

// ── Trend chart (pure SVG) ──────────────────────────────────────────────────

interface TrendChartProps {
  values: (number | null)[]  // index 0 = oldest, last = today
  todayValue: number
  revealed: boolean
  chartId: string
}

function ScaleTrendChart({ values, todayValue, revealed, chartId }: TrendChartProps) {
  const W = 280
  const H = 120
  const PAD_LEFT = 24
  const PAD_RIGHT = 12
  const PAD_TOP = 12
  const PAD_BOTTOM = 24
  const plotW = W - PAD_LEFT - PAD_RIGHT
  const plotH = H - PAD_TOP - PAD_BOTTOM

  const yForVal = (v: number) => PAD_TOP + plotH - ((v - 1) / 7) * plotH

  const pointCount = values.length
  const xForIdx = (i: number) => {
    if (pointCount <= 1) return PAD_LEFT + plotW / 2
    return PAD_LEFT + (i / (pointCount - 1)) * plotW
  }

  const previous = values.slice(0, -1).filter((v): v is number => v !== null)
  const avg = previous.length > 0
    ? previous.reduce((a, b) => a + b, 0) / previous.length
    : null

  const copperGradId = `copper-grad-${chartId}`
  const avgGradId = `avg-grad-${chartId}`

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{
        opacity: revealed ? 1 : 0,
        transition: 'opacity 0.6s ease 0.5s',
      }}
    >
      <defs>
        <linearGradient id={copperGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={COPPER} stopOpacity="0.4" />
          <stop offset="100%" stopColor={COPPER} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={avgGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Y-axis labels — even numbers only */}
      {[2, 4, 6, 8].map(v => (
        <text
          key={v}
          x={PAD_LEFT - 6}
          y={yForVal(v)}
          textAnchor="end"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize="8"
          fontFamily="var(--font-inter), sans-serif"
        >
          {v}
        </text>
      ))}

      {/* Today's value line — full width, copper gradient */}
      <line
        x1={PAD_LEFT}
        y1={yForVal(todayValue)}
        x2={PAD_LEFT + plotW}
        y2={yForVal(todayValue)}
        stroke={`url(#${copperGradId})`}
        strokeWidth="2"
      />

      {/* Average line — full width, off-white gradient, dashed */}
      {avg !== null && (
        <line
          x1={PAD_LEFT}
          y1={yForVal(avg)}
          x2={PAD_LEFT + plotW}
          y2={yForVal(avg)}
          stroke={`url(#${avgGradId})`}
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
      )}

      {/* Data points — rendered after lines so dots sit on top */}
      {values.map((v, i) => {
        if (v === null) return null
        const isToday = i === values.length - 1
        const opacity = isToday
          ? 1
          : pointCount <= 2
            ? 0.5
            : 0.25 + (i / (pointCount - 2)) * 0.6

        return (
          <circle
            key={i}
            cx={xForIdx(i)}
            cy={yForVal(v)}
            r={isToday ? 5 : 3.5}
            fill={isToday ? COPPER : '#ffffff'}
            fillOpacity={opacity}
            style={{
              opacity: revealed ? 1 : 0,
              transition: `opacity 0.3s ease ${0.6 + i * 0.06}s`,
            }}
          />
        )
      })}

      {/* X-axis label */}
      <text
        x={PAD_LEFT + plotW / 2}
        y={H - 4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize="7"
        fontFamily="var(--font-inter), sans-serif"
      >
        {`Today and ${Math.max(values.length - 1, 0)} journal history`}
      </text>
    </svg>
  )
}

// ── Delta indicator ─────────────────────────────────────────────────────────

function DeltaIndicator({ todayValue, avg, previousCount, revealed }: {
  todayValue: number
  avg: number | null
  previousCount: number
  revealed: boolean
}) {
  if (avg === null) return null

  const diff = todayValue - avg
  const isUp = diff > 0
  const isEqual = Math.abs(diff) < 0.05
  const displayDiff = Math.abs(diff).toFixed(1)

  return (
    <div
      className="hss-delta"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease 0.8s, transform 0.5s ease 0.8s',
      }}
    >
      {!isEqual && (
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" className="hss-delta-arrow">
          {isUp ? (
            <polygon points="8,0 16,12 0,12" fill={COPPER} />
          ) : (
            <polygon points="0,0 16,0 8,12" fill={COPPER} />
          )}
        </svg>
      )}
      <span className="hss-delta-value" style={{ color: COPPER }}>
        {isEqual ? '=' : `${isUp ? '+' : '-'} ${displayDiff}`}
      </span>
      <span className="hss-delta-label">Points</span>
      <span className="hss-delta-sub">
        Compared to <span className="hss-delta-underline">{previousCount} journal</span> average
      </span>
    </div>
  )
}

// ── Scale row ───────────────────────────────────────────────────────────────

interface ScaleRowProps {
  title: string
  value: number | null
  labels: string[]
  isStress?: boolean
  revealed: boolean
  history: (number | null)[]
  scaleKey: string
}

function ScaleRow({ title, value, labels, isStress = false, revealed, history, scaleKey }: ScaleRowProps) {
  if (value == null) {
    return (
      <div className="hss-row">
        <div className="hss-row-left">
          <span className="hss-row-title">{title}</span>
          <span className="hss-col-empty">—</span>
        </div>
      </div>
    )
  }

  const color = getScaleColor(value, isStress)
  const label = labels[value - 1]
  const hasEnoughData = history.filter(v => v !== null).length >= 3

  const previous = history.slice(0, -1).filter((v): v is number => v !== null)
  const avg = previous.length > 0
    ? previous.reduce((a, b) => a + b, 0) / previous.length
    : null

  return (
    <div
      className="hss-row"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {/* Left 25% — Title + Ring */}
      <div className="hss-row-left">
        <span className="hss-row-title">{title}</span>
        <div className="hss-digit-wrap">
          <SegmentedRing value={value} color={color} revealed={revealed} />
        </div>
      </div>

      {/* Right 75% — Word label + Chart + Delta */}
      <div className="hss-row-right">
        <span className="hss-row-word" style={{ color }}>{label}</span>
        {hasEnoughData ? (
          <>
            <ScaleTrendChart
              values={history}
              todayValue={value}
              revealed={revealed}
              chartId={scaleKey}
            />
            <DeltaIndicator todayValue={value} avg={avg} previousCount={previous.length} revealed={revealed} />
          </>
        ) : (
          <div className="hss-building-data">
            <span>We&rsquo;re building your data</span>
            <span className="hss-building-sub">
              {history.filter(v => v !== null).length} of 3 journals needed
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main section ────────────────────────────────────────────────────────────

interface Props {
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
  history: ScaleHistoryEntry[]
}

export default function HumanScoresSection({ brainScale, bodyScale, happyScale, stressScale, history }: Props) {
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
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const chronological = [...history].reverse()

  const brainHistory  = chronological.map(e => e.brainScale)
  const bodyHistory   = chronological.map(e => e.bodyScale)
  const happyHistory  = chronological.map(e => e.happyScale)
  const stressHistory = chronological.map(e => e.stressScale)

  return (
    <section ref={sectionRef} id="how-i-showed-up" className="journal-section">
      <SectionInfoHeader
        title="How I Showed Up"
        description="Four scales recorded each morning — how sharp the mind was, how alive the body felt, how happy and how stressed."
        popupBody="Before writing, Matthew rates himself on Brain Activity (Peaceful → Manic), Body Energy (Lethargic → Buzzing), Happiness (Far from happy → Joyful), and Stress (Calm → Overwhelmed). These honest snapshots build into a data picture of how his inner state shapes his intentions over time."
        popupLink={{ href: '/scores', label: 'About the morning scores' }}
      />
      <div className="hss-stacked">
        <ScaleRow title="Brain"  value={brainScale}  labels={BRAIN_LABELS}  revealed={revealed} history={brainHistory}  scaleKey="brain" />
        <ScaleRow title="Body"   value={bodyScale}   labels={BODY_LABELS}   revealed={revealed} history={bodyHistory}   scaleKey="body" />
        <ScaleRow title="Happy"  value={happyScale}  labels={HAPPY_LABELS}  revealed={revealed} history={happyHistory}  scaleKey="happy" />
        <ScaleRow title="Stress" value={stressScale} labels={STRESS_LABELS} isStress revealed={revealed} history={stressHistory} scaleKey="stress" />
      </div>
    </section>
  )
}
