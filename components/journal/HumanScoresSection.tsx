'use client'

import { useRef, useEffect, useState } from 'react'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'
import SegmentedRing from '@/components/charts/SegmentedRing'
import {
  BRAIN_LABELS,
  BODY_LABELS,
  HAPPY_LABELS,
  STRESS_LABELS,
  formatBipolar,
  toBipolar,
} from '@/components/charts/chartUtils'
import type { ScaleHistoryEntry } from '@/app/(main)/[username]/[slug]/_sections/HowIShowedUpSection'

// ── Fixed pastel colours — one per scale, consistent throughout ───────────────

const SCALE_PASTELS = {
  brain:  'var(--chart-line)',
  body:   'var(--chart-line)',
  happy:  'var(--chart-line)',
  stress: 'var(--chart-line)',
} as const

type ScaleKey = keyof typeof SCALE_PASTELS

// ── Dynamic colour — used only in the legend modal ────────────────────────────

function getScaleColor(value: number): string {
  const dist = Math.abs(value - 4.5)
  const t = Math.max(0, (dist - 0.5) / 3)
  const r = Math.round(0xe8 + (0xa0 - 0xe8) * t)
  const g = Math.round(0xe8 + (0x62 - 0xe8) * t)
  const b = Math.round(0xe8 + (0x2a - 0xe8) * t)
  return `rgb(${r},${g},${b})`
}

// ── Dividers ──────────────────────────────────────────────────────────────────

function SectionTopDivider() {
  return <div style={{ height: 3, background: '#A0622A', marginBottom: '1.5rem' }} />
}

function RowDivider() {
  return <div style={{ height: 1, background: 'var(--sub-divider)', margin: '1.25rem 0' }} />
}

// ── X-axis label helper ───────────────────────────────────────────────────────

function getXLabel(dateStr: string, isLast: boolean): { line1: string; line2: string } {
  if (isLast) return { line1: 'POST', line2: 'DATE' }
  const d = new Date(dateStr + 'T00:00:00')
  const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return { line1: DAY_NAMES[d.getDay()], line2: `${d.getDate()}/${d.getMonth() + 1}` }
}

// ── Logarithmic regression ────────────────────────────────────────────────────

function logRegression(pts: { x: number; y: number }[]): { a: number; b: number } | null {
  if (pts.length < 2) return null
  const n = pts.length
  const lnXs = pts.map(p => Math.log(p.x + 1))
  const sumLnX = lnXs.reduce((a, b) => a + b, 0)
  const sumY = pts.reduce((a, p) => a + p.y, 0)
  const sumLnXY = pts.reduce((a, p, i) => a + lnXs[i] * p.y, 0)
  const sumLnX2 = lnXs.reduce((a, v) => a + v * v, 0)
  const denom = n * sumLnX2 - sumLnX * sumLnX
  if (Math.abs(denom) < 1e-10) return null
  const b = (n * sumLnXY - sumLnX * sumY) / denom
  const a = (sumY - b * sumLnX) / n
  return { a, b }
}

// ── Scale trend chart ─────────────────────────────────────────────────────────

interface TrendChartProps {
  values: (number | null)[]
  labels: string[]
  color: string
  dates: string[]
  revealed: boolean
}

function ScaleTrendChart({ values, labels, color, dates, revealed }: TrendChartProps) {
  const VW = 400, VH = 212
  const PLOT_LEFT = 108, PLOT_RIGHT = 396
  const PAD_TOP = 8, PAD_BOTTOM = 32
  const plotW = PLOT_RIGHT - PLOT_LEFT
  const plotH = VH - PAD_TOP - PAD_BOTTOM
  const N = values.length

  function yFor(rawV: number) {
    return PAD_TOP + ((8 - rawV) / 7) * plotH
  }
  function xFor(i: number) {
    return PLOT_LEFT + (i / Math.max(N - 1, 1)) * plotW
  }

  const Y_ROWS = [8, 7, 6, 5, 4, 3, 2, 1]

  // Data line — smooth cubic bezier curves, skip null gaps
  const nonNullPts: { idx: number; rawV: number }[] = []
  const segments: { x: number; y: number }[][] = []
  let currentSeg: { x: number; y: number }[] = []
  values.forEach((v, i) => {
    if (v === null) {
      if (currentSeg.length > 0) { segments.push(currentSeg); currentSeg = [] }
      return
    }
    nonNullPts.push({ idx: i, rawV: v })
    currentSeg.push({ x: xFor(i), y: yFor(v) })
  })
  if (currentSeg.length > 0) segments.push(currentSeg)

  let linePath = ''
  segments.forEach(pts => {
    if (pts.length === 0) return
    linePath += `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} `
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i]
      const cpx = ((p0.x + p1.x) / 2).toFixed(1)
      linePath += `C ${cpx} ${p0.y.toFixed(1)}, ${cpx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} `
    }
  })

  // Log trend line (≥3 non-null points)
  let trendPath: string | null = null
  if (nonNullPts.length >= 3) {
    const reg = logRegression(nonNullPts.map(p => ({ x: p.idx, y: p.rawV })))
    if (reg) {
      trendPath = Array.from({ length: N }, (_, i) => {
        const yRaw = reg.a + reg.b * Math.log(i + 1)
        const yClamped = Math.max(1, Math.min(8, yRaw))
        return `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(yClamped).toFixed(1)}`
      }).join(' ')
    }
  }

  if (nonNullPts.length === 0) return null

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ display: 'block', opacity: revealed ? 1 : 0, transition: 'opacity 0.6s ease 0.3s' }}
    >
      {/* Y-axis rows */}
      {Y_ROWS.map(rawV => {
        const y = yFor(rawV)
        const bip = toBipolar(rawV)
        const bipStr = bip > 0 ? `+ ${bip}` : `\u2212 ${Math.abs(bip)}`
        const labelText = labels[rawV - 1]
        const isMid = rawV === 5 || rawV === 4
        return (
          <g key={rawV}>
            <line x1={PLOT_LEFT} y1={y} x2={PLOT_RIGHT} y2={y}
              style={{ stroke: 'var(--chart-axis)' }}
              strokeWidth={isMid ? 1.5 : 1}
              strokeOpacity={isMid ? 1 : 0.5}
            />
            <text x={22} y={y} textAnchor="end" dominantBaseline="middle"
              fontSize="7.5" fontFamily="var(--font-inter), sans-serif"
              style={{ fill: 'var(--chart-label)' }} fontWeight="600"
            >{bipStr}</text>
            <text x={27} y={y} textAnchor="start" dominantBaseline="middle"
              fontSize="7" fontFamily="var(--font-inter), sans-serif"
              style={{ fill: 'var(--chart-text)' }}
            >{labelText}</text>
          </g>
        )
      })}

      {/* Log trend line */}
      {trendPath && (
        <path d={trendPath} fill="none"
          style={{ stroke: 'var(--chart-trend)' }} strokeWidth={1.5}
          strokeDasharray="6 4" strokeLinecap="round"
        />
      )}

      {/* Data line */}
      {linePath && (
        <path d={linePath} fill="none"
          stroke={color} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
        />
      )}

      {/* Data dots */}
      {nonNullPts.map((p, seqIdx) => {
        const isLast = p.idx === N - 1
        const dotOpacity = isLast ? 1 : 0.15 + (seqIdx / Math.max(nonNullPts.length - 1, 1)) * 0.65
        return (
          <circle key={p.idx}
            cx={xFor(p.idx)} cy={yFor(p.rawV)}
            r={isLast ? 5.5 : 2.5}
            fill={isLast ? '#A0622A' : color}
            fillOpacity={dotOpacity}
            style={{ opacity: revealed ? 1 : 0, transition: `opacity 0.3s ease ${0.4 + seqIdx * 0.04}s` }}
          />
        )
      })}

      {/* X-axis labels (2 lines) */}
      {dates.map((dateStr, i) => {
        const { line1, line2 } = getXLabel(dateStr, i === N - 1)
        const x = xFor(i)
        const isLast = i === N - 1
        return (
          <text key={i} x={x} textAnchor="middle" fontSize="7"
            fontFamily="var(--font-inter), sans-serif"
            style={{ fill: isLast ? 'var(--chart-text-bright)' : 'var(--chart-text)' }}
            fontWeight={isLast ? 700 : 400}
          >
            <tspan x={x} y={VH - PAD_BOTTOM + 10}>{line1}</tspan>
            <tspan x={x} dy="9">{line2}</tspan>
          </text>
        )
      })}
    </svg>
  )
}

// ── Scale row ─────────────────────────────────────────────────────────────────

interface ScaleRowProps {
  title: string
  description: string
  value: number | null
  labels: string[]
  scaleValues: (number | null)[]
  scaleKey: ScaleKey
  dates: string[]
  onOpenLegend: (key: string) => void
}

function ScaleRow({ title, description, value, labels, scaleValues, scaleKey, dates, onOpenLegend }: ScaleRowProps) {
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
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const nonNullCount = scaleValues.filter(v => v !== null).length
  const hasEnoughData = nonNullCount >= 3
  // Fixed pastel colour — consistent for this scale throughout
  const color = SCALE_PASTELS[scaleKey]
  const label = value !== null ? labels[value - 1] : null

  return (
    <div
      ref={rowRef}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {/* Title — same font size as the word label */}
      <div style={{ marginBottom: '0.3rem' }}>
        <span style={{
          fontSize: '2rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color, fontFamily: 'var(--font-inter), sans-serif',
          lineHeight: 1,
        }}>
          {title}
        </span>
      </div>

      {/* Description — own row below title */}
      <div style={{ marginBottom: '0.75rem' }}>
        <span style={{
          fontSize: '0.78rem', fontFamily: 'var(--font-inter), sans-serif',
          color, opacity: 0.65,
        }}>
          {description}
        </span>
      </div>

      {value !== null ? (
        <>
          {/* Score row: ring → copper arrow → large word */}
          <button
            onClick={() => onOpenLegend(scaleKey)}
            aria-label={`View ${title} scoring legend`}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: 0, marginBottom: '0.75rem', maxWidth: '100%',
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <SegmentedRing value={value} color={color} revealed={revealed} displayValue={formatBipolar(value)} />
            </div>
            {/* Copper arrow */}
            <svg width="44" height="32" viewBox="0 0 44 32" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M 0 10 L 28 10 L 28 2 L 44 16 L 28 30 L 28 22 L 0 22 Z" fill="#A0622A" fillOpacity={0.75} />
            </svg>
            {/* Word label — same colour and size as title */}
            <span style={{
              fontSize: '2rem', fontWeight: 700,
              fontFamily: 'var(--font-lora), Georgia, serif',
              color, lineHeight: 1.1,
              textAlign: 'left', flex: 1, minWidth: 0,
            }}>
              {label}
            </span>
          </button>

          {/* Chart */}
          {hasEnoughData ? (
            <ScaleTrendChart
              values={scaleValues}
              labels={labels}
              color={color}
              dates={dates}
              revealed={revealed}
            />
          ) : (
            <div className="hss-building-data">
              <span>We&rsquo;re building your data</span>
              <span className="hss-building-sub">{nonNullCount} of 3 journals needed</span>
            </div>
          )}
        </>
      ) : (
        <span className="hss-col-empty">—</span>
      )}
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────────

interface Props {
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
  history: ScaleHistoryEntry[]
}

const SCALE_META: Record<ScaleKey, { title: string; description: string; labels: string[] }> = {
  brain:  { title: 'Brain',  description: 'How sharp and active the mind felt',     labels: BRAIN_LABELS  },
  body:   { title: 'Body',   description: 'How alive and energised the body felt',  labels: BODY_LABELS   },
  happy:  { title: 'Happy',  description: 'How happy and content the mood was',     labels: HAPPY_LABELS  },
  stress: { title: 'Stress', description: 'How calm or pressured the morning felt', labels: STRESS_LABELS },
}

const SCALE_KEYS: ScaleKey[] = ['brain', 'body', 'happy', 'stress']

export default function HumanScoresSection({ brainScale, bodyScale, happyScale, stressScale, history }: Props) {
  const [legendKey, setLegendKey] = useState<string | null>(null)

  const dates        = history.map(e => e.date)
  const brainValues  = history.map(e => e.brainScale)
  const bodyValues   = history.map(e => e.bodyScale)
  const happyValues  = history.map(e => e.happyScale)
  const stressValues = history.map(e => e.stressScale)

  const legend = legendKey ? SCALE_META[legendKey as ScaleKey] : null

  const scaleValues: Record<ScaleKey, (number | null)[]> = {
    brain: brainValues, body: bodyValues, happy: happyValues, stress: stressValues,
  }
  const scaleCurrentValue: Record<ScaleKey, number | null> = {
    brain: brainScale, body: bodyScale, happy: happyScale, stress: stressScale,
  }

  return (
    <section id="how-i-showed-up" className="journal-section" style={{ paddingTop: '2.5rem' }}>
      {/* Top-of-section copper divider */}
      <SectionTopDivider />

      <SectionInfoHeader
        title="How I Showed Up"
        description="Four morning scales — mind sharpness, body energy, happiness, and stress."
        popupBody="Before writing, Matthew rates himself on Brain Activity (Peaceful → Manic), Body Energy (Lethargic → Buzzing), Happiness (Far from happy → Joyful), and Stress (Calm → Overwhelmed). These honest snapshots build into a data picture of how his inner state shapes his intentions over time."
        popupLink={{ href: '/scores', label: 'About the morning scores' }}
      />

      <div className="hss-stacked">
        {SCALE_KEYS.map((key, idx) => (
          <div key={key}>
            <ScaleRow
              title={SCALE_META[key].title}
              description={SCALE_META[key].description}
              value={scaleCurrentValue[key]}
              labels={SCALE_META[key].labels}
              scaleValues={scaleValues[key]}
              scaleKey={key}
              dates={dates}
              onOpenLegend={setLegendKey}
            />
            {/* Copper divider between scale rows — not after the last */}
            {idx < SCALE_KEYS.length - 1 && <RowDivider />}
          </div>
        ))}
      </div>

      {/* Scoring legend modal */}
      {legendKey && legend && (
        <>
          <div
            onClick={() => setLegendKey(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.4)', animation: 'ritual-fade-in 0.15s ease' }}
          />
          <div
            role="dialog" aria-modal="true"
            aria-label={`${legend.title} scoring guide`}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 61, background: 'var(--bg, #fff)',
              borderRadius: 16, padding: '1.5rem 1.25rem 1.25rem',
              width: 'min(300px, calc(100vw - 2rem))',
              boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
              animation: 'ritual-pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <button
              onClick={() => setLegendKey(null)}
              aria-label="Close"
              style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--body-text)', opacity: 0.45, padding: '0.25rem', lineHeight: 1 }}
            >✕</button>
            <p style={{ margin: '0 0 1rem', fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--heading, #193343)', opacity: 0.7 }}>
              {legend.title}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {legend.labels.map((lbl, i) => {
                const rawVal = i + 1
                const bip = formatBipolar(rawVal)
                const clr = getScaleColor(rawVal)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-lora)', fontWeight: 700, fontSize: '0.9rem', color: clr, minWidth: '2rem', textAlign: 'right' }}>{bip}</span>
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
