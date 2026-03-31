'use client'

import { useRef, useEffect, useState } from 'react'

// ── Labels for each scale ───────────────────────────────────────────────────

const BRAIN_LABELS = ['Peaceful', 'Quiet', 'Active', 'Busy', 'Racing', 'Manic']
const BODY_LABELS  = ['Lethargic', 'Slow', 'Steady', 'Energised', 'Strong', 'Buzzing']
const HAPPY_LABELS = ['Far from happy', 'Low', 'Okay', 'Good', 'Happy', 'Joyful']
const STRESS_LABELS = ['Calm', 'Relaxed', 'Mild', 'Tense', 'Stressed', 'Overwhelmed']

// ── Colour interpolation — 1 = pale blue, 6 = intense (blue or crimson for stress) ──

function getScaleColor(value: number, isStress = false): string {
  const t = (value - 1) / 5  // 0 at value=1, 1 at value=6
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

// ── Segmented ring — 6 arc segments, animated CCW on reveal ──────────────────

function SegmentedRing({ value, color, size = 64, revealed }: {
  value: number
  color: string
  size?: number
  revealed: boolean
}) {
  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 5
  const SEGMENTS = 6
  const GAP_DEG   = 5
  const ARC_DEG   = 360 / SEGMENTS - GAP_DEG  // 55°

  // Arc length for dasharray (circumference fraction)
  const arcLength = (ARC_DEG / 360) * 2 * Math.PI * r

  function toXY(deg: number) {
    const rad = (deg - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arcPath(i: number) {
    const start = i * 60 + GAP_DEG / 2
    const end   = start + ARC_DEG
    const s = toXY(start)
    const e = toXY(end)
    // Reversed path: start from the clockwise-end and sweep counter-clockwise back to start.
    // sweep-flag 0 = CCW. This makes the stroke-dashoffset animation grow anti-clockwise.
    return `M ${e.x.toFixed(2)} ${e.y.toFixed(2)} A ${r} ${r} 0 0 0 ${s.x.toFixed(2)} ${s.y.toFixed(2)}`
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
                  ? 'stroke-dashoffset 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0s'
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
  brainScale: number
  bodyScale: number
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
      <h2 className="journal-section-title">How I Showed Up</h2>
      <div className="hss-grid">
        <ScaleCol title="Brain"  value={brainScale}  labels={BRAIN_LABELS}  revealed={revealed} />
        <ScaleCol title="Body"   value={bodyScale}   labels={BODY_LABELS}   revealed={revealed} />
        <ScaleCol title="Happy"  value={happyScale}  labels={HAPPY_LABELS}  revealed={revealed} />
        <ScaleCol title="Stress" value={stressScale} labels={STRESS_LABELS} isStress revealed={revealed} />
      </div>
    </section>
  )
}
