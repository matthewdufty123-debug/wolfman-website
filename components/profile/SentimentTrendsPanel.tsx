'use client'

import ChartCard from '@/components/charts/ChartCard'
import AreaChart from '@/components/charts/AreaChart'
import ZoneDistribution from '@/components/charts/ZoneDistribution'
import { FEEL_LABELS, mean } from '@/components/charts/chartUtils'
import type { SentimentDataRow } from './ProfileAnalyticsClient'

const EMERALD = '#3AB87A'

interface Props {
  data: SentimentDataRow[]
}

export default function SentimentTrendsPanel({ data }: Props) {
  const values = data.map(r => r.feelAboutToday)
  const avg = mean(values)
  const avgLabel = avg !== null ? FEEL_LABELS[Math.round(avg) - 1] ?? '' : ''

  // Count best and tough days
  const bestDays = values.filter(v => v >= 5).length
  const toughDays = values.filter(v => v <= 2).length

  // Zone distribution
  const zones = FEEL_LABELS.map((label, i) => {
    const level = i + 1
    const count = values.filter(v => v === level).length
    return { label, count, percentage: values.length > 0 ? (count / values.length) * 100 : 0 }
  }).reverse()

  return (
    <ChartCard
      title="How Your Days Feel"
      rightLabel={avg !== null ? `avg ${avg.toFixed(1)}` : undefined}
    >
      <div className="chart-stat-summary">
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{avg !== null ? avg.toFixed(1) : '—'}</div>
          <div className="chart-stat-summary-label">{avgLabel || 'Average'}</div>
        </div>
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{bestDays}</div>
          <div className="chart-stat-summary-label">Great Days</div>
        </div>
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{toughDays}</div>
          <div className="chart-stat-summary-label">Tough Days</div>
        </div>
      </div>

      {zones.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <p className="chart-card-title" style={{ marginBottom: '0.5rem' }}>Where your days land</p>
          <ZoneDistribution zones={zones} color={EMERALD} />
        </div>
      )}

      {values.length >= 3 && (
        <div style={{ marginTop: '0.75rem' }}>
          <AreaChart
            values={values}
            min={1}
            max={6}
            color={EMERALD}
            showAverage
            todayHighlight={false}
          />
        </div>
      )}
    </ChartCard>
  )
}
