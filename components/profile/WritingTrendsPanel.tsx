'use client'

import ChartCard from '@/components/charts/ChartCard'
import StatRow from '@/components/charts/StatRow'
import ZoneDistribution from '@/components/charts/ZoneDistribution'
import Sparkline from '@/components/charts/Sparkline'
import { fmtNumber } from '@/components/charts/chartUtils'
import type { WordCountDataRow } from './ProfileAnalyticsClient'

interface Props {
  data: WordCountDataRow[]
}

export default function WritingTrendsPanel({ data }: Props) {
  const totalWords = data.reduce((sum, r) => sum + r.wordCountTotal, 0)
  const avgPerJournal = data.length > 0 ? Math.round(totalWords / data.length) : 0
  const journalCount = data.length

  // Monthly totals for sparkline
  const monthlyMap: Record<string, number> = {}
  for (const r of data) {
    const month = r.date.slice(0, 7)
    monthlyMap[month] = (monthlyMap[month] ?? 0) + r.wordCountTotal
  }
  const monthlyTotals = Object.values(monthlyMap)

  // Section balance
  const totalIntention = data.reduce((s, r) => s + r.wordCountIntention, 0)
  const totalGratitude = data.reduce((s, r) => s + r.wordCountGratitude, 0)
  const totalGreatAt = data.reduce((s, r) => s + r.wordCountGreatAt, 0)
  const sectionTotal = totalIntention + totalGratitude + totalGreatAt

  const sectionZones = sectionTotal > 0 ? [
    { label: 'Intention', count: totalIntention, percentage: (totalIntention / sectionTotal) * 100 },
    { label: 'Gratitude', count: totalGratitude, percentage: (totalGratitude / sectionTotal) * 100 },
    { label: 'Great At', count: totalGreatAt, percentage: (totalGreatAt / sectionTotal) * 100 },
  ] : []

  return (
    <ChartCard title="Words Written" accentColor="#A0622A">
      <StatRow
        label="Total Words"
        value={fmtNumber(totalWords)}
        sparklineData={monthlyTotals.length >= 2 ? monthlyTotals : undefined}
      />
      <StatRow
        label="Avg / Journal"
        value={fmtNumber(avgPerJournal)}
      />
      <StatRow
        label="Journals"
        value={journalCount}
        noBorder
      />

      {sectionZones.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <p className="chart-card-title" style={{ marginBottom: '0.5rem' }}>Where your words go</p>
          <ZoneDistribution
            zones={sectionZones}
            color="#4A7FA5"
            sortByValue
          />
        </div>
      )}
    </ChartCard>
  )
}
