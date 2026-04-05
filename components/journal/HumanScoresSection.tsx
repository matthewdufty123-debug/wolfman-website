'use client'

import { useRef, useEffect, useState } from 'react'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'

// ── Labels for each scale ───────────────────────────────────────────────────

const BRAIN_LABELS  = ['Completely Silent', 'Very Peaceful', 'Quite Quiet', 'Chill', 'Active', 'Busy', 'Hyper Focused', 'Totally Manic']
const BODY_LABELS   = ['Nothing to Give', 'Running Empty', 'Sluggish', 'Slow', 'Steady', 'Energised', 'Firing Hard', 'Absolutely Buzzing']
const HAPPY_LABELS  = ['Completely Lost', 'Struggling', 'Bit Low', 'Flat', 'Okay', 'Happy', 'Bike Smiles', 'Absolutely Joyful']
const STRESS_LABELS = ['Completely Overwhelmed', 'Anxious', 'Stressed', 'Unsettled', 'Peaceful', 'Focused', 'Primed', 'Hunt Mode']

// ── Colour interpolation — 1 = pale blue, 8 = intense (blue or crimson for stress) ──

function getScaleColor(value: number, isStress = false): string {
  const t = (value - 1) / 7  // 0 at value=1, 1 at value=8
  if (isStress) {
    // Pale blue → copper/terracotta: #A8D0E0 → #C87840 (warm, not alarming)
    const rVal = Math.round(0xa8 + (0xc8 - 0xa8) * t)
    const gVal = Math.round(0xd0 + (0x78 - 0xd0) * t)
    const bVal = Math.round(0xe0 + (0x40 - 0xe0) * t)
    return `rgb(${rVal},${gVal},${bVal})`
  }
  // Pale blue → royal blue: #A8D0E0 → #2A6AB0
  const rVal = Math.round(0xa8 + (0x2a - 0xa8) * t)
  const gVal = Math.round(0xd0 + (0x6a - 0xd0) * t)
  const bVal = Math.round(0xe0 + (0xb0 - 0xe0) * t)
  return `rgb(${rVal},${gVal},${bVal})`
}

// ── Segmented ring — 8 arc segments, sequential CCW fill from top ────────────
//
// Segments are positioned counter-clockwise from 12 o'clock.
// Segment 0 is nearest the top; segment 7 completes the ring going left/down/right.
// On reveal, filled segments animate in order 0→value-1 with staggered delays,
// creating the effect of the ring filling from zero up to the scored value CCW.

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
  const ARC_DEG     = 360 / SEGMENTS - GAP_DEG  // 41° per segment
  const STAGGER_S   = 0.13  // seconds between each segment starting

  // True arc length for strokeDasharray
  const arcLength = (ARC_DEG / 360) * 2 * Math.PI * r

  function toXY(deg: number) {
    const rad = (deg - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  // Segments go CCW from top: segment i starts just CCW of 12 o'clock.
  // Path drawn CCW (sweep-flag 0) so dashoffset reveals from the 12-o'clock end
  // toward the CCW end, matching the fill direction.
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

// ── Scale column ─────────────────────────────────────────────────────────────

interface ScaleColProps {
  title: string
  value: number | null
  labels: string[]
  isStress?: boolean
  revealed: boolean
}

function ScaleCol({ title, value, labels, isStress = false, revealed }: ScaleColProps) {
  if (value == null) {
    return (
      <div className="hss-col">
        <span className="hss-col-title">{title}</span>
        <span className="hss-col-empty">—</span>
      </div>
    )
  }
  const color = getScaleColor(value, isStress)
  const label = labels[value - 1]
  return (
    <div
      className="hss-col"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <span className="hss-col-title">{title}</span>
      <div className="hss-digit-wrap">
        <SegmentedRing value={value} color={color} revealed={revealed} />
      </div>
      <span className="hss-col-word" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Main section ─────────────────────────────────────────────────────────────

interface Props {
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
}

export default function HumanScoresSection({ brainScale, bodyScale, happyScale, stressScale }: Props) {
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
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="how-i-showed-up" className="journal-section">
      <SectionInfoHeader
        title="How I Showed Up"
        description="Four scales recorded each morning — how sharp the mind was, how alive the body felt, how happy and how stressed."
        popupBody="Before writing, Matthew rates himself on Brain Activity (Peaceful → Manic), Body Energy (Lethargic → Buzzing), Happiness (Far from happy → Joyful), and Stress (Calm → Overwhelmed). These honest snapshots build into a data picture of how his inner state shapes his intentions over time."
        popupLink={{ href: '/scores', label: 'About the morning scores' }}
      />
      <div className="hss-grid">
        <ScaleCol title="Brain"  value={brainScale}  labels={BRAIN_LABELS}  revealed={revealed} />
        <ScaleCol title="Body"   value={bodyScale}   labels={BODY_LABELS}   revealed={revealed} />
        <ScaleCol title="Happy"  value={happyScale}  labels={HAPPY_LABELS}  revealed={revealed} />
        <ScaleCol title="Stress" value={stressScale} labels={STRESS_LABELS} isStress revealed={revealed} />
      </div>
    </section>
  )
}
