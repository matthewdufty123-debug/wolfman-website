'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'
import DeltaIndicator from '@/components/charts/DeltaIndicator'
import { mean } from '@/components/charts/chartUtils'

const COPPER = '#A0622A'

const SPARKS = [
  { x: 0,   y: -38 },
  { x: 27,  y: -27 },
  { x: 38,  y:   0 },
  { x: 27,  y:  27 },
  { x: 0,   y:  38 },
  { x: -27, y:  27 },
  { x: -38, y:   0 },
  { x: -27, y: -27 },
]

type StreakTier = 'none' | 'low' | 'mid' | 'high' | 'epic'

function getStreakTier(n: number): StreakTier {
  if (n === 0) return 'none'
  if (n <= 5)  return 'low'
  if (n <= 7)  return 'mid'
  if (n <= 9)  return 'high'
  return 'epic'
}

interface Props {
  checklist: Record<string, boolean>
  ritualStats: Record<string, { segments: boolean[], streak: number }>
}

// ── Per-row component ─────────────────────────────────────────────────────────

interface RitualRowProps {
  ritualKey: string
  label: string
  Icon: React.FC<{ size?: number; color?: string }>
  color: string
  onSelect: (key: string) => void
  segments: boolean[]
  streak: number
}

function RitualRow({ ritualKey, label, Icon, color, onSelect, segments, streak }: RitualRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [streakVisible, setStreakVisible] = useState(false)

  // Timing constants
  const SEGMENT_START = 0.2
  const SEGMENT_STEP  = 0.055
  const streakDelay   = SEGMENT_START + 9 * SEGMENT_STEP + 0.2  // ~1.0s

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      setStreakVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Mount sparks only after the streak number has appeared — avoids animation-on-mount bug
  useEffect(() => {
    if (!revealed) return
    const t = setTimeout(() => setStreakVisible(true), (streakDelay + 0.2) * 1000)
    return () => clearTimeout(t)
  }, [revealed, streakDelay])

  const tier = getStreakTier(streak)

  // Pad segments on the left so today is always slot 10 (rightmost)
  const paddedSegments: (boolean | null)[] = [
    ...Array(Math.max(0, 10 - segments.length)).fill(null),
    ...segments,
  ]

  return (
    <div
      ref={rowRef}
      className="ritual-row"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
      }}
    >
      {/* 20% — icon only */}
      <button
        className="ritual-row-left"
        onClick={() => onSelect(ritualKey)}
        aria-label={label}
      >
        <div className="ritual-row-icon" style={{ background: `${color}22`, border: `1.5px solid ${color}` }}>
          <Icon size={32} color={color} />
        </div>
      </button>

      {/* 50% — label + segment track */}
      <div className="ritual-row-track">
        <span className="ritual-row-label" style={{ color }}>{label}</span>
        <div className="ritual-track-pills">
          {paddedSegments.map((filled, i) => (
            <div
              key={i}
              className="ritual-segment"
              style={{
                background: filled ? color : 'transparent',
                border: `1.5px solid ${filled ? color : `${color}40`}`,
                opacity: revealed ? (filled === null ? 0.15 : 1) : 0,
                transform: revealed ? 'scaleY(1)' : 'scaleY(0.2)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                transitionDelay: revealed ? `${SEGMENT_START + i * SEGMENT_STEP}s` : '0s',
              }}
            />
          ))}
          <span className="ritual-track-today">current day</span>
        </div>
      </div>

      {/* 30% — streak */}
      {tier !== 'none' && (
        <div className="ritual-row-streak">
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(6px)',
              transition: `opacity 0.3s ease ${streakDelay}s, transform 0.3s ease ${streakDelay}s`,
            }}
          >
            {/* Firework sparks — mount only after streak is visible to guarantee animation fires */}
            {tier === 'epic' && streakVisible && (
              <>
                {/* Expanding burst ring */}
                <div
                  style={{
                    position: 'absolute',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: `2px solid ${color}`,
                    top: '50%',
                    left: '50%',
                    marginTop: -6,
                    marginLeft: -6,
                    animation: 'ritual-burst-ring 0.7s ease-out forwards',
                  }}
                />
                {SPARKS.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: color,
                      top: '50%',
                      left: '50%',
                      marginTop: -3,
                      marginLeft: -3,
                      animation: `ritual-spark 0.75s ease-out ${i * 0.04}s forwards`,
                      ['--spark-x' as string]: `${s.x}px`,
                      ['--spark-y' as string]: `${s.y}px`,
                    } as React.CSSProperties}
                  />
                ))}
              </>
            )}

            <span
              className={`ritual-streak-number ritual-streak--${tier}`}
              style={tier !== 'low' ? { color } : undefined}
            >
              {streak}
            </span>
            <span className="ritual-streak-label">journal streak</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function MorningRitualsSection({ checklist, ritualStats }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const active = activeKey ? ROUTINE_ICON_MAP[activeKey] : null

  const items = Object.entries(ROUTINE_ICON_MAP).filter(([key]) => Boolean(checklist[key]))

  return (
    <section id="morning-rituals" className="journal-section">
      <SectionInfoHeader
        title="Morning Rituals"
        description="The daily rituals Matthew completed this morning before sitting down to write."
        popupBody="Morning rituals are small, consistent practices — breathwork, sunlight, movement, stillness — that set the conditions for a good day. Each ritual Matthew completes is logged here. Tap any icon to learn more about it and see other journals where it featured."
        popupLink={{ href: '/rituals', label: 'Explore all rituals' }}
      />

      {items.length === 0 ? (
        <p className="journal-section-empty">No morning rituals recorded.</p>
      ) : (
        <>
          {/* Summary + 10-day bar chart */}
          {(() => {
            const todayCount = items.length
            const allSegments = Object.values(ritualStats)
            const dayCount = allSegments[0]?.segments.length ?? 0
            const dailyCounts: number[] = []
            for (let d = 0; d < dayCount; d++) {
              let count = 0
              for (const s of allSegments) {
                if (s.segments[d]) count++
              }
              dailyCounts.push(count)
            }
            const avg = mean(dailyCounts)

            // Bar chart dimensions
            const W = 280
            const H = 130
            const PL = 20
            const PR = 8
            const PT = 14
            const PB = 4
            const plotW = W - PL - PR
            const plotH = H - PT - PB
            const barMax = Math.max(10, ...dailyCounts)
            const gap = 3
            const barW = dailyCounts.length > 0 ? (plotW - (dailyCounts.length - 1) * gap) / dailyCounts.length : 0

            return (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '0.5rem 0' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-lora), Georgia, serif', color: 'var(--body-text)', lineHeight: 1 }}>
                      {todayCount}
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', opacity: 0.5, marginLeft: '0.4rem', fontFamily: 'var(--font-inter), sans-serif', color: 'var(--body-text)' }}>
                      Rituals Today
                    </span>
                  </div>
                  {avg !== null && (
                    <span className="hss-row-avg">avg {avg.toFixed(1)}</span>
                  )}
                </div>

                {dailyCounts.length >= 2 && (
                  <svg
                    width="100%"
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="xMidYMid meet"
                    aria-hidden="true"
                    style={{ display: 'block', margin: '0.5rem 0' }}
                  >
                    {/* Y-axis */}
                    <line x1={PL} y1={PT} x2={PL} y2={PT + plotH} style={{ stroke: 'var(--chart-axis, rgba(255,255,255,0.12))' }} strokeWidth="1" />
                    {/* Bars */}
                    {dailyCounts.map((count, i) => {
                      const x = PL + i * (barW + gap)
                      const h = (count / barMax) * plotH
                      const y = PT + plotH - h
                      const isToday = i === dailyCounts.length - 1
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={y}
                          width={barW}
                          height={h}
                          rx={2}
                          fill={isToday ? COPPER : '#70C0C8'}
                          fillOpacity={isToday ? 0.9 : 0.5}
                        />
                      )
                    })}
                    {/* Average dashed line */}
                    {avg !== null && (
                      <line
                        x1={PL}
                        y1={PT + plotH - (avg / barMax) * plotH}
                        x2={PL + plotW}
                        y2={PT + plotH - (avg / barMax) * plotH}
                        style={{ stroke: 'var(--chart-avg, rgba(255,255,255,0.4))' }}
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                      />
                    )}
                    {/* Y-axis label */}
                    <text x={PL - 4} y={PT + 3} textAnchor="end" style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }} fontSize="7" fontFamily="var(--font-inter), sans-serif">{barMax}</text>
                    <text x={PL - 4} y={PT + plotH} textAnchor="end" dominantBaseline="auto" style={{ fill: 'var(--chart-text, rgba(255,255,255,0.35))' }} fontSize="7" fontFamily="var(--font-inter), sans-serif">0</text>
                  </svg>
                )}

                {avg !== null && dailyCounts.length >= 2 && (
                  <div className="hss-chart-footer" style={{ marginTop: '0.25rem' }}>
                    <DeltaIndicator
                      todayValue={todayCount}
                      avg={avg}
                      previousCount={dailyCounts.length - 1}
                      revealed={true}
                      label="Rituals"
                    />
                  </div>
                )}
              </>
            )
          })()}

          <p className="ritual-context-note">Each bar shows whether the ritual was completed on that day&apos;s journal. The rightmost bar is the current day.</p>
          <div className="morning-rituals-stack">
            {items.map(([key, { label, Icon, color }]) => {
              const stats = ritualStats[key] ?? { segments: [], streak: 0 }
              return (
                <RitualRow
                  key={key}
                  ritualKey={key}
                  label={label}
                  Icon={Icon}
                  color={color}
                  onSelect={setActiveKey}
                  segments={stats.segments}
                  streak={stats.streak}
                />
              )
            })}
          </div>

          {/* Popup */}
          {activeKey && active && (
            <>
              <div
                onClick={() => setActiveKey(null)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 60,
                  background: 'rgba(0,0,0,0.35)',
                  animation: 'ritual-fade-in 0.15s ease',
                }}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={active.label}
                onClick={() => setActiveKey(null)}
                style={{
                  position: 'fixed',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 61,
                  background: 'var(--bg, #fff)',
                  borderRadius: 16,
                  padding: '2rem 1.5rem 1.5rem',
                  width: 'min(300px, calc(100vw - 2rem))',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
                  animation: 'ritual-pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  cursor: 'pointer',
                }}
              >
                <button
                  onClick={() => setActiveKey(null)}
                  aria-label="Close"
                  style={{
                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '1rem', color: 'var(--body-text)', opacity: 0.45,
                    padding: '0.25rem', lineHeight: 1,
                  }}
                >✕</button>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.875rem' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${active.color}22`,
                    border: `2px solid ${active.color}`,
                  }}>
                    <active.Icon size={36} color={active.color} />
                  </div>
                </div>

                <p style={{ margin: '0 0 0.3rem', textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: 'var(--heading, #193343)', fontFamily: 'var(--font-inter)' }}>{active.label}</p>
                <p style={{ margin: '0 0 0.875rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: active.color, fontFamily: 'var(--font-inter)' }}>✓ Completed this morning</p>
                <p style={{ margin: '0 0 1.25rem', textAlign: 'center', fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--body-text)', fontFamily: 'var(--font-lora)' }}>{active.description}</p>

                <Link
                  href={`/morning-ritual/${activeKey}`}
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'block', textAlign: 'center', background: '#214459', color: '#fff', borderRadius: 8, padding: '0.7rem 1rem', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-inter)' }}
                >
                  See all journals with this ritual →
                </Link>
              </div>
            </>
          )}

          <style>{`
            @keyframes ritual-fade-in   { from { opacity: 0 } to { opacity: 1 } }
            @keyframes ritual-pop-in    { from { opacity: 0; transform: translate(-50%,-50%) scale(0.92) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
            @keyframes ritual-spark     { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--spark-x),var(--spark-y)) scale(0); opacity: 0; } }
            @keyframes ritual-burst-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(5); opacity: 0; } }
          `}</style>
        </>
      )}
    </section>
  )
}
