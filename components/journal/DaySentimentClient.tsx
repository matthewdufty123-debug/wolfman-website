'use client'

import { useRef, useEffect, useState } from 'react'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'
import RelativeEffort from '@/components/charts/RelativeEffort'
import ZoneDistribution from '@/components/charts/ZoneDistribution'
import { FEEL_LABELS } from '@/components/charts/chartUtils'

const EMERALD = '#3AB87A'

interface Props {
  todayValue: number
  history: number[]
}

export default function DaySentimentClient({ todayValue, history }: Props) {
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

  const avg = history.length > 1
    ? history.slice(0, -1).reduce((a, b) => a + b, 0) / (history.length - 1)
    : null

  const todayLabel = FEEL_LABELS[todayValue - 1] ?? ''

  // Build zone distribution — 6 levels (1–6)
  const zones = FEEL_LABELS.map((label, i) => {
    const level = i + 1
    const count = history.filter(v => v === level).length
    return {
      label,
      count,
      percentage: history.length > 0 ? (count / history.length) * 100 : 0,
    }
  }).reverse() // Best Day Ever at top

  return (
    <section ref={sectionRef} id="day-sentiment" className="journal-section">
      <SectionInfoHeader
        title="How The Day Felt"
        description="End-of-day sentiment — a simple reflection on how the day went."
        popupBody="After the day is done, a single rating captures how it felt — from 'Want to Forget' to 'Best Day Ever'. No judgement, just an honest record of where the day landed."
      />

      <div style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s',
      }}>
        <RelativeEffort
          value={todayValue}
          min={1}
          max={6}
          average={avg}
          color={EMERALD}
          label={todayLabel}
        />

        {history.length >= 3 && (
          <div style={{ marginTop: '1.25rem' }}>
            <p className="chart-card-title" style={{ marginBottom: '0.5rem' }}>Where your days land</p>
            <ZoneDistribution zones={zones} color={EMERALD} />
          </div>
        )}
      </div>
    </section>
  )
}
