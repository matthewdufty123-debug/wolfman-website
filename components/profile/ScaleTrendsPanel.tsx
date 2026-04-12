'use client'

import ChartCard from '@/components/charts/ChartCard'
import AreaChart from '@/components/charts/AreaChart'
import ZoneDistribution from '@/components/charts/ZoneDistribution'
import {
  SCALE_COLORS,
  SCALE_LABELS,
  mean,
  fmtDate,
  formatBipolar,
  bipolarAvg,
} from '@/components/charts/chartUtils'
import type { ScaleDataRow } from './ProfileAnalyticsClient'

interface Props {
  data: ScaleDataRow[]
  username: string
}

const SCALE_KEYS = ['brain', 'body', 'happy', 'stress'] as const

function extractScale(data: ScaleDataRow[], key: typeof SCALE_KEYS[number]): (number | null)[] {
  return data.map(r => {
    switch (key) {
      case 'brain': return r.brainScale
      case 'body': return r.bodyScale
      case 'happy': return r.happyScale
      case 'stress': return r.stressScale
    }
  })
}

function buildZones(values: (number | null)[], labels: string[]): { label: string; count: number; percentage: number }[] {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return []
  return labels.map((label, i) => {
    const level = i + 1
    const count = valid.filter(v => v === level).length
    return { label: `${level} ${label}`, count, percentage: (count / valid.length) * 100 }
  }).reverse() // 8 at top
}

const TITLES: Record<string, string> = {
  brain: 'Brain Activity',
  body: 'Body Energy',
  happy: 'Happiness',
  stress: 'Stress',
}

export default function ScaleTrendsPanel({ data, username }: Props) {
  // Build x-axis labels — show month labels for longer datasets
  const xLabels = data.length > 15
    ? data.map((r, i) => {
        if (i === 0 || i === data.length - 1) return fmtDate(r.date)
        // Show label every ~25% of the way through
        const step = Math.floor(data.length / 4)
        if (step > 0 && i % step === 0) return fmtDate(r.date)
        return ''
      })
    : data.map(r => '')

  return (
    <div>
      {SCALE_KEYS.map(key => {
        const values = extractScale(data, key)
        const valid = values.filter((v): v is number => v !== null)
        if (valid.length === 0) return null

        const avg = mean(values)
        const color = SCALE_COLORS[key]
        const labels = SCALE_LABELS[key]
        const zones = buildZones(values, labels)

        return (
          <ChartCard
            key={key}
            title={TITLES[key]}
            rightLabel={avg !== null ? `avg ${bipolarAvg(avg)}` : undefined}
            accentColor={color}
          >
            <AreaChart
              values={values}
              min={1}
              max={8}
              color={color}
              showAverage
              xLabels={xLabels}
              todayHighlight={false}
              centered
              smooth
              yLabelFormatter={formatBipolar}
            />
            {zones.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <p className="chart-card-title" style={{ marginBottom: '0.5rem' }}>Where you spend your time</p>
                <ZoneDistribution zones={zones} color={color} />
              </div>
            )}
          </ChartCard>
        )
      })}
    </div>
  )
}
