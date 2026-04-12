'use client'

import ChartCard from '@/components/charts/ChartCard'
import ZoneDistribution from '@/components/charts/ZoneDistribution'
import { fmtNumber } from '@/components/charts/chartUtils'
import type { WordCountDataRow } from './ProfileAnalyticsClient'

interface Props {
  data: WordCountDataRow[]
}

export default function WritingTrendsPanel({ data }: Props) {
  const totalWords = data.reduce((sum, r) => sum + r.wordCountTotal, 0)
  const avgPerJournal = data.length > 0 ? Math.round(totalWords / data.length) : 0
  const journalCount = data.length

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
      {/* 3-KPI summary block */}
      <div className="chart-stat-summary" style={{ marginBottom: '0.75rem' }}>
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{fmtNumber(totalWords)}</div>
          <div className="chart-stat-summary-label">Total Words</div>
        </div>
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{fmtNumber(avgPerJournal)}</div>
          <div className="chart-stat-summary-label">Avg / Journal</div>
        </div>
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{journalCount}</div>
          <div className="chart-stat-summary-label">Journals</div>
        </div>
      </div>

      {sectionZones.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
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
