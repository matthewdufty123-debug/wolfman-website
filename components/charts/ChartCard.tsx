'use client'

interface ChartCardProps {
  title: string
  subtitle?: string
  rightLabel?: string
  /** Section theme colour — kept for chart line colouring, no longer renders as border */
  accentColor?: string
  children: React.ReactNode
}

export default function ChartCard({ title, subtitle, rightLabel, accentColor, children }: ChartCardProps) {
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
