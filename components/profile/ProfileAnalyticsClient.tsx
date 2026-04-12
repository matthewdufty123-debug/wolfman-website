'use client'

import { useMemo } from 'react'
import ChartCard from '@/components/charts/ChartCard'
import CumulativeChart from '@/components/charts/CumulativeChart'
import type { CumulativeChartData } from '@/components/charts/CumulativeChart'
import ScaleTrendsPanel from './ScaleTrendsPanel'
import RitualTrendsPanel from './RitualTrendsPanel'
import WritingTrendsPanel from './WritingTrendsPanel'

// ── Section theme colours ─────────────────────────────────────────────────────

const THEME_JOURNALS = '#4A7FA5'  // Steel Blue

// ── Shared data types ───────────────────────────────────────────────────────

export interface ScaleDataRow {
  date: string
  slug: string
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
  routineChecklist: Record<string, boolean> | null
}

export interface WordCountDataRow {
  date: string
  wordCountIntention: number
  wordCountGratitude: number
  wordCountGreatAt: number
  wordCountTotal: number
}

interface Props {
  scaleData: ScaleDataRow[]
  wordCountData: WordCountDataRow[]
  username: string
  journalsCumulative?: CumulativeChartData
  ritualsCumulative?: CumulativeChartData
  wordsCumulative?: CumulativeChartData
}

function threeMonthsAgo(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return d.toISOString().slice(0, 10)
}

export default function ProfileAnalyticsClient({
  scaleData,
  wordCountData,
  username,
  journalsCumulative,
  ritualsCumulative,
  wordsCumulative,
}: Props) {
  const cutoff = useMemo(() => threeMonthsAgo(), [])

  const filteredScaleData = useMemo(
    () => scaleData.filter(r => r.date >= cutoff),
    [scaleData, cutoff]
  )

  const filteredWordData = useMemo(
    () => wordCountData.filter(r => r.date >= cutoff),
    [wordCountData, cutoff]
  )

  return (
    <>
      {/* Journal Postings section */}
      <section className="journal-section" style={{ paddingTop: 0 }}>
        <h2 className="journal-section-title">Journal Postings</h2>
        {journalsCumulative && (
          <ChartCard title="This Month" accentColor={THEME_JOURNALS}>
            <CumulativeChart data={journalsCumulative} color={THEME_JOURNALS} />
          </ChartCard>
        )}
      </section>

      {/* How I Showed Up section */}
      {filteredScaleData.length > 0 && (
        <section className="journal-section" style={{ paddingTop: 0 }}>
          <h2 className="journal-section-title">How I Showed Up</h2>
          <ScaleTrendsPanel data={filteredScaleData} username={username} />
        </section>
      )}

      {/* Morning Rituals section */}
      <section className="journal-section" style={{ paddingTop: 0 }}>
        <h2 className="journal-section-title">Morning Rituals</h2>
        {filteredScaleData.length > 0 && (
          <RitualTrendsPanel data={filteredScaleData} ritualsCumulative={ritualsCumulative} />
        )}
      </section>

      {/* Words Written section */}
      <section className="journal-section" style={{ paddingTop: 0 }}>
        <h2 className="journal-section-title">Words Written</h2>
        {filteredWordData.length > 0 && (
          <WritingTrendsPanel data={filteredWordData} wordsCumulative={wordsCumulative} />
        )}
      </section>

      {filteredScaleData.length === 0 && filteredWordData.length === 0 && (
        <p className="journal-no-chart">
          No data for this period yet — it will appear here as journals are written.
        </p>
      )}
    </>
  )
}
