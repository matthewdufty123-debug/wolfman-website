'use client'

interface ChartCardProps {
  title: string
  subtitle?: string
  rightLabel?: string
  children: React.ReactNode
}

export default function ChartCard({ title, subtitle, rightLabel, children }: ChartCardProps) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <p className="chart-card-title">{title}</p>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {rightLabel && <span className="chart-card-right">{rightLabel}</span>}
      </div>
      {children}
    </div>
  )
}
