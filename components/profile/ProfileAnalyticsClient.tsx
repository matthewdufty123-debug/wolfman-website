'use client'

import { useState, useMemo } from 'react'
import TimePeriodToggle from '@/components/charts/TimePeriodToggle'
import ScaleTrendsPanel from './ScaleTrendsPanel'
import RitualTrendsPanel from './RitualTrendsPanel'
import WritingTrendsPanel from './WritingTrendsPanel'
import SentimentTrendsPanel from './SentimentTrendsPanel'

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

export interface SentimentDataRow {
  date: string
  feelAboutToday: number
}

interface Props {
  scaleData: ScaleDataRow[]
  wordCountData: WordCountDataRow[]
  sentimentData: SentimentDataRow[]
  username: string
}

function threeMonthsAgo(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return d.toISOString().slice(0, 10)
}

export default function ProfileAnalyticsClient({
  scaleData,
  wordCountData,
  sentimentData,
  username,
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

  const filteredSentimentData = useMemo(
    () => period === 'ytd' ? sentimentData : sentimentData.filter(r => r.date >= cutoff),
    [sentimentData, period, cutoff]
  )

  return (
    <>
      <TimePeriodToggle period={period} onChange={setPeriod} />

      {filteredScaleData.length > 0 && (
        <ScaleTrendsPanel data={filteredScaleData} username={username} />
      )}

      {filteredScaleData.length > 0 && (
        <RitualTrendsPanel data={filteredScaleData} />
      )}

      {filteredWordData.length > 0 && (
        <WritingTrendsPanel data={filteredWordData} />
      )}

      {filteredSentimentData.length > 0 && (
        <SentimentTrendsPanel data={filteredSentimentData} />
      )}

      {filteredScaleData.length === 0 && filteredWordData.length === 0 && (
        <p className="journal-no-chart">
          No data for this period yet — it will appear here as journals are written.
        </p>
      )}
    </>
  )
}
