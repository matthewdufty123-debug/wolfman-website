'use client'

import { useRef, useEffect, useState } from 'react'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'
import SegmentedRing from '@/components/charts/SegmentedRing'
import DeltaIndicator from '@/components/charts/DeltaIndicator'
import AreaChart from '@/components/charts/AreaChart'
import {
  SCALE_COLORS,
  BRAIN_LABELS,
  BODY_LABELS,
  HAPPY_LABELS,
  STRESS_LABELS,
} from '@/components/charts/chartUtils'
import type { ScaleHistoryEntry } from '@/app/(main)/[username]/[slug]/_sections/HowIShowedUpSection'

// ── Colour interpolation — centre values off-white, extremes copper ──────────

function getScaleColor(value: number): string {
  // Distance from midpoint 4.5: 0.5 (centre) → 3.5 (extreme)
  const dist = Math.abs(value - 4.5)
  const t = Math.max(0, (dist - 0.5) / 3) // 0 at centre, 1 at extreme
  // Lerp off-white #E8E8E8 → copper #A0622A
  const r = Math.round(0xe8 + (0xa0 - 0xe8) * t)
  const g = Math.round(0xe8 + (0x62 - 0xe8) * t)
  const b = Math.round(0xe8 + (0x2a - 0xe8) * t)
  return `rgb(${r},${g},${b})`
}

// ── Scale row — self-contained IntersectionObserver ──────────────────────────

interface ScaleRowProps {
  title: string
  value: number | null
  labels: string[]
  isStress?: boolean
  history: (number | null)[]
  scaleKey: keyof typeof SCALE_COLORS
}

function ScaleRow({ title, value, labels, isStress = false, history, scaleKey }: ScaleRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = rowRef.current
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

  if (value == null) {
    return (
      <div ref={rowRef} className="hss-row">
        <div className="hss-row-left">
          <span className="hss-row-title">{title}</span>
          <span className="hss-col-empty">—</span>
        </div>
      </div>
    )
  }

  const ringColor = getScaleColor(value)
  const scaleColor = SCALE_COLORS[scaleKey]
  const label = labels[value - 1]
  const hasEnoughData = history.filter(v => v !== null).length >= 3

  const previous = history.slice(0, -1).filter((v): v is number => v !== null)
  const avg = previous.length > 0
    ? previous.reduce((a, b) => a + b, 0) / previous.length
    : null

  return (
    <div
      ref={rowRef}
      className="hss-row"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {/* Left 25% — Title + Ring + Word label */}
      <div className="hss-row-left">
        <span className="hss-row-title">{title}</span>
        <div className="hss-digit-wrap">
          <SegmentedRing value={value} color={ringColor} revealed={revealed} />
        </div>
        <span className="hss-row-word" style={{ color: ringColor }}>{label}</span>
      </div>

      {/* Right 75% — Area Chart + Delta */}
      <div className="hss-row-right">
        {hasEnoughData ? (
          <>
            <AreaChart
              values={history}
              min={1}
              max={8}
              color={scaleColor}
              showAverage
              revealed={revealed}
              centered
            />
            <div className="hss-chart-footer">
              {avg !== null && (
                <span className="hss-row-avg">avg {avg.toFixed(1)}</span>
              )}
              <DeltaIndicator todayValue={value} avg={avg} previousCount={previous.length} revealed={revealed} />
            </div>
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
  const chronological = [...history].reverse()

  const brainHistory  = chronological.map(e => e.brainScale)
  const bodyHistory   = chronological.map(e => e.bodyScale)
  const happyHistory  = chronological.map(e => e.happyScale)
  const stressHistory = chronological.map(e => e.stressScale)

  return (
    <section id="how-i-showed-up" className="journal-section">
      <SectionInfoHeader
        title="How I Showed Up"
        description="Four scales recorded each morning — how sharp the mind was, how alive the body felt, how happy and how stressed."
        popupBody="Before writing, Matthew rates himself on Brain Activity (Peaceful → Manic), Body Energy (Lethargic → Buzzing), Happiness (Far from happy → Joyful), and Stress (Calm → Overwhelmed). These honest snapshots build into a data picture of how his inner state shapes his intentions over time."
        popupLink={{ href: '/scores', label: 'About the morning scores' }}
      />
      <div className="hss-stacked">
        <ScaleRow title="Brain"  value={brainScale}  labels={BRAIN_LABELS}  history={brainHistory}  scaleKey="brain" />
        <ScaleRow title="Body"   value={bodyScale}   labels={BODY_LABELS}   history={bodyHistory}   scaleKey="body" />
        <ScaleRow title="Happy"  value={happyScale}  labels={HAPPY_LABELS}  history={happyHistory}  scaleKey="happy" />
        <ScaleRow title="Stress" value={stressScale} labels={STRESS_LABELS} isStress history={stressHistory} scaleKey="stress" />
      </div>
    </section>
  )
}
