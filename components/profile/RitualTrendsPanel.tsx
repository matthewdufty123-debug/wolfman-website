'use client'

import ChartCard from '@/components/charts/ChartCard'
import ZoneDistribution from '@/components/charts/ZoneDistribution'
import Sparkline from '@/components/charts/Sparkline'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'
import type { ScaleDataRow } from './ProfileAnalyticsClient'

interface Props {
  data: ScaleDataRow[]
}

export default function RitualTrendsPanel({ data }: Props) {
  const allKeys = Object.keys(ROUTINE_ICON_MAP)
  const totalPossible = data.length * allKeys.length

  // Per-ritual completion rates
  const ritualRates = allKeys.map(key => {
    const completed = data.filter(r => r.routineChecklist?.[key]).length
    const rate = data.length > 0 ? (completed / data.length) * 100 : 0
    const { label, color } = ROUTINE_ICON_MAP[key]
    return { key, label, color, completed, rate }
  }).sort((a, b) => b.rate - a.rate)

  // Daily completion counts for sparkline
  const dailyCounts = data.map(r => {
    if (!r.routineChecklist) return 0
    return Object.values(r.routineChecklist).filter(Boolean).length
  })

  const totalDone = dailyCounts.reduce((a, b) => a + b, 0)
  const avgPerDay = data.length > 0 ? (totalDone / data.length).toFixed(1) : '0'
  const completionRate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0

  // Best streak across any ritual
  let bestStreak = 0
  for (const key of allKeys) {
    let streak = 0
    let maxStreak = 0
    for (const row of data) {
      if (row.routineChecklist?.[key]) {
        streak++
        if (streak > maxStreak) maxStreak = streak
      } else {
        streak = 0
      }
    }
    if (maxStreak > bestStreak) bestStreak = maxStreak
  }

  // Zones for the distribution
  const zones = ritualRates
    .filter(r => r.rate > 0)
    .map(r => ({
      label: r.label,
      count: r.completed,
      percentage: r.rate,
      color: r.color,
    }))

  return (
    <ChartCard title="Morning Rituals" accentColor="#70C0C8">
      <div className="chart-stat-summary">
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{avgPerDay}</div>
          <div className="chart-stat-summary-label">Avg / Day</div>
          {dailyCounts.length >= 2 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.25rem' }}>
              <Sparkline data={dailyCounts} />
            </div>
          )}
        </div>
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{completionRate}%</div>
          <div className="chart-stat-summary-label">Completion</div>
        </div>
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{bestStreak}</div>
          <div className="chart-stat-summary-label">Best Streak</div>
        </div>
      </div>

      {zones.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <p className="chart-card-title" style={{ marginBottom: '0.25rem' }}>Which rituals stick</p>
          <p style={{ fontFamily: 'var(--font-lora), serif', fontSize: '0.78rem', color: 'var(--body-text)', opacity: 0.55, marginBottom: '0.6rem', lineHeight: 1.5 }}>
            How often each ritual appeared across your journals in this period — 100% means it was logged every day.
          </p>
          <div className="chart-zone-dist">
            {zones.map((z, i) => (
              <div key={i} className="chart-zone-row">
                <span className="chart-zone-label">{z.label}</span>
                <div className="chart-zone-track">
                  <div
                    className="chart-zone-fill"
                    style={{ width: `${z.percentage}%`, backgroundColor: z.color }}
                  />
                </div>
                <span className="chart-zone-pct">{Math.round(z.percentage)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  )
}
