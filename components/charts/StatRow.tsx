'use client'

import Sparkline from './Sparkline'

interface StatRowProps {
  label: string
  value: string | number
  sparklineData?: number[]
  sparklineColor?: string
  subtitle?: string
  noBorder?: boolean
}

export default function StatRow({
  label,
  value,
  sparklineData,
  sparklineColor,
  subtitle,
  noBorder = false,
}: StatRowProps) {
  return (
    <div
      className="chart-stat-row"
      style={noBorder ? { borderBottom: 'none' } : undefined}
    >
      <div className="chart-stat-row-left">
        <span className="chart-stat-row-label">{label}</span>
        {subtitle && <span className="chart-stat-row-sub">{subtitle}</span>}
      </div>
      <div className="chart-stat-row-right">
        {sparklineData && sparklineData.length >= 2 && (
          <Sparkline data={sparklineData} color={sparklineColor} />
        )}
        <span className="chart-stat-row-value">{value}</span>
      </div>
    </div>
  )
}
