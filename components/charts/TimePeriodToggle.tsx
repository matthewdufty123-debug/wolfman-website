'use client'

interface TimePeriodToggleProps {
  period: '3m' | 'ytd'
  onChange: (period: '3m' | 'ytd') => void
}

export default function TimePeriodToggle({ period, onChange }: TimePeriodToggleProps) {
  return (
    <div className="chart-period-toggle">
      <button
        className={`chart-period-pill ${period === '3m' ? 'chart-period-pill--active' : ''}`}
        onClick={() => onChange('3m')}
      >
        3 Months
      </button>
      <button
        className={`chart-period-pill ${period === 'ytd' ? 'chart-period-pill--active' : ''}`}
        onClick={() => onChange('ytd')}
      >
        Year to Date
      </button>
    </div>
  )
}
