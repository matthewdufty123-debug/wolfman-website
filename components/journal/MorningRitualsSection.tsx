'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'

const COPPER = '#A0622A'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getXLabel(dateStr: string, isLast: boolean): { line1: string; line2: string } {
  if (isLast) return { line1: 'POST', line2: 'DATE' }
  const d = new Date(dateStr + 'T00:00:00')
  const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return { line1: DAY_NAMES[d.getDay()], line2: `${d.getDate()}/${d.getMonth() + 1}` }
}

function SectionTopDivider() {
  return <div style={{ height: 3, background: COPPER, marginBottom: '1.5rem' }} />
}

function CopperDivider() {
  return <div style={{ height: 2, background: COPPER, margin: '1rem 0' }} />
}

function GreyDivider() {
  return <div style={{ height: 1, background: 'rgba(144,144,144,0.35)', margin: '0.6rem 0' }} />
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

interface BarChartProps {
  dailyCounts: (number | null)[]
  todayCount: number
  slotDates: string[]
}

function RitualBarChart({ dailyCounts, todayCount, slotDates }: BarChartProps) {
  const nonNullCounts = dailyCounts.filter((c): c is number => c !== null)
  const rawMax = nonNullCounts.length > 0 ? Math.max(...nonNullCounts) : 1
  // Y upper bound = max rituals - 1 (per spec), minimum 1 to avoid divide-by-zero
  const yMax = Math.max(rawMax - 1, 1)

  const N = dailyCounts.length
  const VW = 280, VH = 150
  const PL = 18, PR = 4, PT = 8, PB = 30
  const plotW = VW - PL - PR
  const plotH = VH - PT - PB
  const gap = 3
  const barW = N > 0 ? (plotW - (N - 1) * gap) / N : 0

  function xForBar(i: number) { return PL + i * (barW + gap) }
  function xForLabel(i: number) { return PL + i * (barW + gap) + barW / 2 }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Y-axis */}
      <line x1={PL} y1={PT} x2={PL} y2={PT + plotH} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* Bars */}
      {dailyCounts.map((count, i) => {
        if (count === null || count === 0) return null
        const h = Math.min((count / yMax) * plotH, plotH)
        const x = xForBar(i)
        const y = PT + plotH - h
        const isLast = i === N - 1
        return (
          <rect
            key={i}
            x={x} y={y}
            width={barW} height={h}
            rx={2}
            fill={isLast ? COPPER : '#70C0C8'}
            fillOpacity={isLast ? 0.9 : 0.5}
          />
        )
      })}

      {/* Y-axis labels */}
      <text x={PL - 4} y={PT + 3} textAnchor="end" fontSize="7" fontFamily="var(--font-inter), sans-serif" fill="rgba(255,255,255,0.35)">{yMax}</text>
      <text x={PL - 4} y={PT + plotH} textAnchor="end" dominantBaseline="auto" fontSize="7" fontFamily="var(--font-inter), sans-serif" fill="rgba(255,255,255,0.35)">0</text>

      {/* X-axis labels (2-line) */}
      {slotDates.map((date, i) => {
        const { line1, line2 } = getXLabel(date, i === N - 1)
        const x = xForLabel(i)
        const isLast = i === N - 1
        return (
          <text
            key={i}
            x={x}
            textAnchor="middle"
            fontSize="7"
            fontFamily="var(--font-inter), sans-serif"
            fill={isLast ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.38)'}
            fontWeight={isLast ? 700 : 400}
          >
            <tspan x={x} y={VH - PB + 10}>{line1}</tspan>
            <tspan x={x} dy="9">{line2}</tspan>
          </text>
        )
      })}
    </svg>
  )
}

// ── Ritual row ────────────────────────────────────────────────────────────────

interface RitualRowProps {
  ritualKey: string
  label: string
  Icon: React.FC<{ size?: number; color?: string }>
  color: string
  onSelect: (key: string) => void
  segments: (boolean | null)[]
  streak: number
}

function RitualRow({ ritualKey, label, Icon, color, onSelect, segments, streak }: RitualRowProps) {
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
      ([entry]) => {
        if (entry.isIntersecting) { setRevealed(true); observer.disconnect() }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Which indices are in the current streak (rightmost `streak` consecutive trues)
  const inStreakSet = new Set(
    Array.from({ length: Math.min(streak, segments.length) }, (_, j) => segments.length - 1 - j)
  )

  const streakDelay = 0.1 + segments.length * 0.04 + 0.2

  return (
    <div
      ref={rowRef}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
      }}
    >
      {/* Large bold ritual name */}
      <span style={{
        display: 'block',
        fontSize: '1rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color,
        fontFamily: 'var(--font-inter), sans-serif',
        marginBottom: '0.35rem',
      }}>
        {label}
      </span>

      {/* Icon | 14 pills | streak number — all same height */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
        {/* Icon circle — tappable for popup, small left breathing room */}
        <button
          onClick={() => onSelect(ritualKey)}
          aria-label={label}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, paddingLeft: '0.25rem' }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${color}22`, border: `1.5px solid ${color}`,
          }}>
            <Icon size={26} color={color} />
          </div>
        </button>

        {/* 14 pill indicators — slightly condensed */}
        <div style={{ display: 'flex', gap: '2px', flex: 1, height: 44 }}>
          {segments.map((slot, i) => {
            const filled = slot === true
            const inStreak = inStreakSet.has(i)
            const pillBg = filled
              ? (inStreak ? color : `${color}80`)
              : 'transparent'
            const pillBorder = slot === null
              ? `1.5px solid ${color}18`
              : filled
                ? `1.5px solid ${color}`
                : `1.5px solid ${color}35`
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRadius: 5,
                  background: pillBg,
                  border: pillBorder,
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? 'scaleY(1)' : 'scaleY(0.2)',
                  transition: 'opacity 0.25s ease, transform 0.25s ease',
                  transitionDelay: revealed ? `${0.1 + i * 0.04}s` : '0s',
                }}
              />
            )
          })}
        </div>

        {/* Streak number — same height as icon, small right breathing room */}
        <div style={{
          width: 40, height: 44, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingRight: '0.35rem',
        }}>
          {streak > 0 && (
            <span style={{
              fontSize: '2rem', fontWeight: 700,
              fontFamily: 'var(--font-lora), Georgia, serif',
              color, lineHeight: 1,
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(6px)',
              transition: `opacity 0.3s ease ${streakDelay}s, transform 0.3s ease ${streakDelay}s`,
              display: 'inline-block',
            }}>
              {streak}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────────

interface Props {
  checklist: Record<string, boolean>
  ritualStats: Record<string, { segments: (boolean | null)[]; streak: number }>
  slotDates: string[]
}

export default function MorningRitualsSection({ checklist, ritualStats, slotDates }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const active = activeKey ? ROUTINE_ICON_MAP[activeKey] : null

  // Only show rituals completed in this post
  const items = Object.entries(ROUTINE_ICON_MAP).filter(([key]) => Boolean(checklist[key]))

  // Bar chart: daily total ritual counts across the 14-day window
  const N = slotDates.length
  const allStats = Object.values(ritualStats)
  const dailyCounts: (number | null)[] = slotDates.map((_, dayIdx) => {
    // If all segments for this day are null, it's a no-post day
    const allNull = allStats.every(s => s.segments[dayIdx] === null)
    if (allNull) return null
    return allStats.reduce((sum, s) => sum + (s.segments[dayIdx] === true ? 1 : 0), 0)
  })
  const todayCount = items.length

  return (
    <section id="morning-rituals" className="journal-section" style={{ paddingTop: '2.5rem' }}>
      {/* Top-of-section copper divider */}
      <SectionTopDivider />

      <SectionInfoHeader
        title="Morning Rituals"
        description="The daily rituals completed"
        popupBody="Morning rituals are small, consistent practices — breathwork, sunlight, movement, stillness — that set the conditions for a good day. Each ritual Matthew completes is logged here. Tap any icon to learn more about it and see other journals where it featured."
        popupLink={{ href: '/rituals', label: 'Explore all rituals' }}
      />

      <CopperDivider />

      {items.length === 0 ? (
        <p className="journal-section-empty">No morning rituals recorded.</p>
      ) : (
        <>
          {/* Bar chart: left count column | right chart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '18%', flexShrink: 0, paddingLeft: '0.5rem',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: '3.5rem', fontWeight: 700, lineHeight: 1,
                fontFamily: 'var(--font-lora), Georgia, serif',
                color: 'var(--body-text)',
              }}>
                {todayCount}
              </span>
              <span style={{
                fontSize: '0.6rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                opacity: 0.55, marginTop: '0.15rem',
                fontFamily: 'var(--font-inter), sans-serif',
                color: 'var(--body-text)',
                lineHeight: 1.3,
              }}>
                Rituals<br />completed<br />in this post
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <RitualBarChart
                dailyCounts={dailyCounts}
                todayCount={todayCount}
                slotDates={slotDates}
              />
            </div>
          </div>

          <CopperDivider />

          {/* Rituals completed sub-section */}
          <div>
            <p style={{
              margin: '0 0 0.25rem',
              fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-inter), sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--body-text)',
            }}>
              Rituals Completed in this Post
            </p>
            <p style={{
              margin: '0 0 0.75rem',
              fontSize: '0.78rem', fontFamily: 'var(--font-inter), sans-serif',
              color: 'var(--body-text)', opacity: 0.55, lineHeight: 1.5,
            }}>
              Each bar shows whether the ritual was completed that day over the last 14 days. Bright bars are your current streak.
            </p>

            {/* Column header row — aligns with ritual pill rows */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '0.4rem' }}>
              {/* Spacer: icon width + left padding + gap */}
              <div style={{ width: 56, flexShrink: 0 }} />
              {/* Day labels */}
              <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
                {slotDates.map((_, i) => {
                  const isLast = i === N - 1
                  const colNum = N - i
                  return (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      {isLast ? (
                        <>
                          <span style={{ display: 'block', fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-inter)', lineHeight: 1.2 }}>POST</span>
                          <span style={{ display: 'block', fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-inter)', lineHeight: 1.2 }}>DATE</span>
                        </>
                      ) : (
                        <span style={{ display: 'block', fontSize: '0.5rem', fontWeight: 400, color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-inter)', lineHeight: 1 }}>
                          {colNum}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Day streak label — matches streak column width + padding */}
              <div style={{ width: 48, flexShrink: 0, textAlign: 'right', paddingRight: '0.35rem' }}>
                <span style={{
                  fontSize: '0.48rem', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  color: 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--font-inter), sans-serif',
                }}>
                  Day<br />Streak
                </span>
              </div>
            </div>

            <GreyDivider />

            {/* Ritual rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              {items.map(([key, { label, Icon, color }], idx) => {
                const stats = ritualStats[key] ?? { segments: [], streak: 0 }
                return (
                  <div key={key}>
                    <RitualRow
                      ritualKey={key}
                      label={label}
                      Icon={Icon}
                      color={color}
                      onSelect={setActiveKey}
                      segments={stats.segments}
                      streak={stats.streak}
                    />
                    {idx < items.length - 1 && <GreyDivider />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ritual info popup */}
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
          `}</style>
        </>
      )}
    </section>
  )
}
