'use client'

import { useState, useMemo } from 'react'
import TimePeriodToggle from '@/components/charts/TimePeriodToggle'
import ChartCard from '@/components/charts/ChartCard'
import CumulativeChart from '@/components/charts/CumulativeChart'
import type { CumulativeChartData } from '@/components/charts/CumulativeChart'
import ScaleTrendsPanel from './ScaleTrendsPanel'
import RitualTrendsPanel from './RitualTrendsPanel'
import WritingTrendsPanel from './WritingTrendsPanel'

// ── Section theme colours ─────────────────────────────────────────────────────

const THEME_JOURNALS = '#4A7FA5'  // Steel Blue
const THEME_RITUALS  = '#70C0C8'  // Teal
const THEME_WORDS    = '#A0622A'  // Copper

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
  const [period, setPeriod] = useState<'3m' | 'ytd'>('3m')

  const cutoff = useMemo(() => threeMonthsAgo(), [])

  const filteredScaleData = useMemo(
    () => period === 'ytd' ? scaleData : scaleData.filter(r => r.date >= cutoff),
    [scaleData, period, cutoff]
  )

  const filteredWordData = useMemo(
    () => period === 'ytd' ? wordCountData : wordCountData.filter(r => r.date >= cutoff),
    [wordCountData, period, cutoff]
  )

  return (
    <>
      <TimePeriodToggle period={period} onChange={setPeriod} />

      {/* Cumulative month-vs-last charts */}
      {journalsCumulative && (
        <ChartCard title="Journals This Month" accentColor={THEME_JOURNALS}>
          <CumulativeChart data={journalsCumulative} color={THEME_JOURNALS} />
        </ChartCard>
      )}

      {filteredScaleData.length > 0 && (
        <ScaleTrendsPanel data={filteredScaleData} username={username} />
      )}

      {ritualsCumulative && (
        <ChartCard title="Rituals This Month" accentColor={THEME_RITUALS}>
          <CumulativeChart data={ritualsCumulative} color={THEME_RITUALS} />
        </ChartCard>
      )}

      {filteredScaleData.length > 0 && (
        <RitualTrendsPanel data={filteredScaleData} />
      )}

      {wordsCumulative && (
        <ChartCard title="Words This Month" accentColor={THEME_WORDS}>
          <CumulativeChart data={wordsCumulative} color={THEME_WORDS} formatLarge />
        </ChartCard>
      )}

      {filteredWordData.length > 0 && (
        <WritingTrendsPanel data={filteredWordData} />
      )}

      {filteredScaleData.length === 0 && filteredWordData.length === 0 && (
        <p className="journal-no-chart">
          No data for this period yet — it will appear here as journals are written.
        </p>
      )}
    </>
  )
}
