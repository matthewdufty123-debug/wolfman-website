'use client'

import ChartCard from '@/components/charts/ChartCard'
import CumulativeChart from '@/components/charts/CumulativeChart'
import type { CumulativeChartData } from '@/components/charts/CumulativeChart'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'
import type { ScaleDataRow } from './ProfileAnalyticsClient'

const THEME_RITUALS = '#70C0C8'

interface Props {
  data: ScaleDataRow[]
  ritualsCumulative?: CumulativeChartData
}

export default function RitualTrendsPanel({ data, ritualsCumulative }: Props) {
  const allKeys = Object.keys(ROUTINE_ICON_MAP)

  // This-month stats
  const curMonthPrefix = new Date().toISOString().slice(0, 7)
  const thisMonthData = data.filter(r => r.date.startsWith(curMonthPrefix))
  const totalRitualsThisMonth = thisMonthData.reduce((sum, r) => {
    if (!r.routineChecklist) return sum
    return sum + Object.values(r.routineChecklist).filter(Boolean).length
  }, 0)
  const avgPerDay = thisMonthData.length > 0
    ? (totalRitualsThisMonth / thisMonthData.length).toFixed(1)
    : '0'

  // Per-ritual rates across all filtered data (3 months)
  const ritualRates = allKeys.map(key => {
    const completed = data.filter(r => r.routineChecklist?.[key]).length
    const rate = data.length > 0 ? (completed / data.length) * 100 : 0
    const { label, color, Icon } = ROUTINE_ICON_MAP[key]
    return { key, label, color, Icon, completed, rate }
  }).filter(r => r.rate > 0).sort((a, b) => b.rate - a.rate)

  return (
    <>
      {/* KPI stats */}
      <div className="chart-stat-summary" style={{ marginBottom: '0.75rem' }}>
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{totalRitualsThisMonth}</div>
          <div className="chart-stat-summary-label">Rituals This Month</div>
        </div>
        <div className="chart-stat-summary-item">
          <div className="chart-stat-summary-value">{avgPerDay}</div>
          <div className="chart-stat-summary-label">Avg Per Day</div>
        </div>
      </div>

      {/* Cumulative chart */}
      {ritualsCumulative && (
        <ChartCard title="This Month" accentColor={THEME_RITUALS}>
          <CumulativeChart data={ritualsCumulative} color={THEME_RITUALS} />
        </ChartCard>
      )}

      {/* Top rituals bar chart with icons */}
      {ritualRates.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '0.62rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--body-text)',
            opacity: 0.4,
            marginBottom: '0.6rem',
          }}>
            Which rituals stick
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {ritualRates.map(r => (
              <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Icon */}
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: `${r.color}22`,
                  border: `1.5px solid ${r.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <r.Icon size={12} color={r.color} />
                </div>
                {/* Name */}
                <span style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: '0.72rem',
                  color: 'var(--body-text)',
                  opacity: 0.7,
                  width: 90,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {r.label}
                </span>
                {/* Bar */}
                <div style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(112,192,200,0.1)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${r.rate}%`,
                    background: r.color,
                    borderRadius: 3,
                  }} />
                </div>
                {/* Percentage */}
                <span style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--body-text)',
                  opacity: 0.6,
                  width: 30,
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  {Math.round(r.rate)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
