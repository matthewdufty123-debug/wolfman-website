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
  formatBipolar,
  bipolarAvg,
  toBipolar,
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
  history: (number | null)[]
  scaleKey: keyof typeof SCALE_COLORS
  onOpenLegend: (key: string) => void
}

function ScaleRow({ title, value, labels, history, scaleKey, onOpenLegend }: ScaleRowProps) {
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
  const rawAvg = previous.length > 0
    ? previous.reduce((a, b) => a + b, 0) / previous.length
    : null
  const avg = rawAvg !== null ? toBipolar(Math.round(rawAvg)) : null
  const bipolarToday = toBipolar(value)
  const deltaVsAvg = avg !== null ? bipolarToday - avg : null

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
      {/* Left 25% — Title + Ring + Word label (tappable → legend popup) */}
      <button
        className="hss-row-left hss-row-left--btn"
        onClick={() => onOpenLegend(scaleKey)}
        aria-label={`View ${title} scoring legend`}
      >
        <span className="hss-row-title">{title}</span>
        <div className="hss-digit-wrap">
          <SegmentedRing value={value} color={ringColor} revealed={revealed} displayValue={formatBipolar(value)} />
        </div>
        <span className="hss-row-word" style={{ color: ringColor }}>{label}</span>
      </button>

      {/* Right 75% — KPI summary + Area Chart + Delta */}
      <div className="hss-row-right">
        {hasEnoughData ? (
          <>
            {/* 3-KPI block */}
            <div className="chart-stat-summary hss-kpi-block">
              <div className="chart-stat-summary-item">
                <div className="chart-stat-summary-value" style={{ color: ringColor }}>{formatBipolar(value)}</div>
                <div className="chart-stat-summary-label">Today</div>
              </div>
              <div className="chart-stat-summary-item">
                <div className="chart-stat-summary-value">{rawAvg !== null ? bipolarAvg(rawAvg) : '—'}</div>
                <div className="chart-stat-summary-label">10-Day Avg</div>
              </div>
              <div className="chart-stat-summary-item">
                <div className="chart-stat-summary-value">
                  {deltaVsAvg !== null ? `${deltaVsAvg >= 0 ? '+' : ''}${deltaVsAvg}` : '—'}
                </div>
                <div className="chart-stat-summary-label">vs Avg</div>
              </div>
            </div>
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
              {rawAvg !== null && (
                <span className="hss-row-avg">avg {bipolarAvg(rawAvg)}</span>
              )}
              <DeltaIndicator todayValue={bipolarToday} avg={avg} previousCount={previous.length} revealed={revealed} />
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

const SCALE_META: Record<string, { title: string; labels: string[] }> = {
  brain:  { title: 'Brain Activity', labels: BRAIN_LABELS },
  body:   { title: 'Body Energy',    labels: BODY_LABELS },
  happy:  { title: 'Happiness',      labels: HAPPY_LABELS },
  stress: { title: 'Stress',         labels: STRESS_LABELS },
}

export default function HumanScoresSection({ brainScale, bodyScale, happyScale, stressScale, history }: Props) {
  const [legendKey, setLegendKey] = useState<string | null>(null)
  const chronological = [...history].reverse()

  const brainHistory  = chronological.map(e => e.brainScale)
  const bodyHistory   = chronological.map(e => e.bodyScale)
  const happyHistory  = chronological.map(e => e.happyScale)
  const stressHistory = chronological.map(e => e.stressScale)

  const legend = legendKey ? SCALE_META[legendKey] : null

  return (
    <section id="how-i-showed-up" className="journal-section">
      <SectionInfoHeader
        title="How I Showed Up"
        description="Four scales recorded each morning — how sharp the mind was, how alive the body felt, how happy and how stressed."
        popupBody="Before writing, Matthew rates himself on Brain Activity (Peaceful → Manic), Body Energy (Lethargic → Buzzing), Happiness (Far from happy → Joyful), and Stress (Calm → Overwhelmed). These honest snapshots build into a data picture of how his inner state shapes his intentions over time."
        popupLink={{ href: '/scores', label: 'About the morning scores' }}
      />
      <div className="hss-stacked">
        <ScaleRow title="Brain"  value={brainScale}  labels={BRAIN_LABELS}  history={brainHistory}  scaleKey="brain"  onOpenLegend={setLegendKey} />
        <ScaleRow title="Body"   value={bodyScale}   labels={BODY_LABELS}   history={bodyHistory}   scaleKey="body"   onOpenLegend={setLegendKey} />
        <ScaleRow title="Happy"  value={happyScale}  labels={HAPPY_LABELS}  history={happyHistory}  scaleKey="happy"  onOpenLegend={setLegendKey} />
        <ScaleRow title="Stress" value={stressScale} labels={STRESS_LABELS} history={stressHistory} scaleKey="stress" onOpenLegend={setLegendKey} />
      </div>

      {/* Scoring legend modal */}
      {legendKey && legend && (
        <>
          <div
            onClick={() => setLegendKey(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.4)',
              animation: 'ritual-fade-in 0.15s ease',
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${legend.title} scoring guide`}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 61,
              background: 'var(--bg, #fff)',
              borderRadius: 16,
              padding: '1.5rem 1.25rem 1.25rem',
              width: 'min(300px, calc(100vw - 2rem))',
              boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
              animation: 'ritual-pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <button
              onClick={() => setLegendKey(null)}
              aria-label="Close"
              style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1rem', color: 'var(--body-text)', opacity: 0.45,
                padding: '0.25rem', lineHeight: 1,
              }}
            >✕</button>

            <p style={{ margin: '0 0 1rem', fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--heading, #193343)', opacity: 0.7 }}>
              {legend.title}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {legend.labels.map((lbl, i) => {
                const rawVal = i + 1 // 1–8
                const bip = formatBipolar(rawVal)
                const color = getScaleColor(rawVal)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-lora)', fontWeight: 700, fontSize: '0.9rem', color, minWidth: '2rem', textAlign: 'right' }}>{bip}</span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--body-text)', opacity: 0.75 }}>{lbl}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
