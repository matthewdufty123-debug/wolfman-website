'use client'

import ChartCard from '@/components/charts/ChartCard'
import CumulativeChart from '@/components/charts/CumulativeChart'
import type { CumulativeChartData } from '@/components/charts/CumulativeChart'
import StackedAreaChart from '@/components/charts/StackedAreaChart'
import { fmtNumber } from '@/components/charts/chartUtils'
import type { WordCountDataRow } from './ProfileAnalyticsClient'

const THEME_WORDS = '#A0622A'

interface Props {
  data: WordCountDataRow[]
  wordsCumulative?: CumulativeChartData
}

export default function WritingTrendsPanel({ data, wordsCumulative }: Props) {
  const totalWords = data.reduce((sum, r) => sum + r.wordCountTotal, 0)
  const avgPerJournal = data.length > 0 ? Math.round(totalWords / data.length) : 0
  const journalCount = data.length

  return (
    <>
      {/* 3-KPI summary */}
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

      {/* Cumulative chart */}
      {wordsCumulative && (
        <ChartCard title="This Month" accentColor={THEME_WORDS}>
          <CumulativeChart data={wordsCumulative} color={THEME_WORDS} formatLarge />
        </ChartCard>
      )}

      {/* Stacked area chart — section breakdown over time */}
      {data.length >= 2 && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '0.62rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--body-text)',
            opacity: 0.4,
            marginBottom: '0.5rem',
          }}>
            Where your words go
          </p>
          <StackedAreaChart
            series={[
              { label: 'Intention', values: data.map(r => r.wordCountIntention), color: '#4A7FA5' },
              { label: 'Gratitude', values: data.map(r => r.wordCountGratitude), color: '#70C0C8' },
              { label: 'Great At',  values: data.map(r => r.wordCountGreatAt),   color: '#A0622A' },
            ]}
            dates={data.map(r => r.date)}
          />
        </div>
      )}
    </>
  )
}
