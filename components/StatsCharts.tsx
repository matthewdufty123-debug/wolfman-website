'use client'

import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'

export interface StatRow {
  date: string
  brainScale: number
  bodyScale: number
  happyScale: number | null
  ritualCount: number
}

const BRAIN_LABELS  = ['','Peaceful','Quiet','Active','Busy','Racing','Manic']
const BODY_LABELS   = ['','Lethargic','Slow','Steady','Energised','Strong','Buzzing']
const HAPPY_LABELS  = ['','Far from happy','Low','Okay','Good','Happy','Joyful']

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
}
function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="stats-chart-card">
      <p className="stats-chart-title">{title}</p>
      {children}
    </div>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  labelMap?: string[]
}
function ScaleTooltip({ active, payload, label, labelMap }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const name = labelMap ? (labelMap[val] ?? val) : val
  return (
    <div style={{
      background: 'var(--bg, #fff)', border: '1px solid rgba(74,127,165,0.2)',
      borderRadius: 8, padding: '0.5rem 0.75rem',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: '0.82rem', color: 'var(--body-text)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label ? fmtDate(label) : ''}</div>
      <div>{val} — {name}</div>
    </div>
  )
}

interface RitualTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}
function RitualTooltip({ active, payload, label }: RitualTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg, #fff)', border: '1px solid rgba(74,127,165,0.2)',
      borderRadius: 8, padding: '0.5rem 0.75rem',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: '0.82rem', color: 'var(--body-text)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label ? fmtDate(label) : ''}</div>
      <div>{payload[0].value} ritual{payload[0].value !== 1 ? 's' : ''} completed</div>
    </div>
  )
}

export default function StatsCharts({ data }: { data: StatRow[] }) {
  if (!data.length) {
    return (
      <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: 'var(--body-text)', opacity: 0.5, fontStyle: 'italic' }}>
        No data yet for the last 3 months.
      </p>
    )
  }

  const xAxisProps = {
    dataKey: 'date' as const,
    tickFormatter: fmtDate,
    tick: { fontSize: 11, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fill: 'var(--body-text)' },
    tickLine: false,
    axisLine: false,
    interval: Math.max(0, Math.floor(data.length / 8) - 1),
  }

  const yAxisProps = {
    tick: { fontSize: 11, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fill: 'var(--body-text)' },
    tickLine: false,
    axisLine: false,
    width: 24,
  }

  return (
    <div>
      <ChartCard title="Morning Rituals completed">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,165,0.1)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} domain={[0, 10]} ticks={[0,2,4,6,8,10]} />
            <Tooltip content={<RitualTooltip />} cursor={{ fill: 'rgba(74,127,165,0.06)' }} />
            <Bar dataKey="ritualCount" fill="#4A7FA5" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="My Thoughts">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,165,0.1)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} domain={[1, 6]} ticks={[1,2,3,4,5,6]} />
            <Tooltip content={<ScaleTooltip labelMap={BRAIN_LABELS} />} />
            <Line dataKey="brainScale" stroke="#4A7FA5" strokeWidth={2} dot={{ r: 3, fill: '#4A7FA5' }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Body Energy">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,98,42,0.1)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} domain={[1, 6]} ticks={[1,2,3,4,5,6]} />
            <Tooltip content={<ScaleTooltip labelMap={BODY_LABELS} />} />
            <Line dataKey="bodyScale" stroke="#A0622A" strokeWidth={2} dot={{ r: 3, fill: '#A0622A' }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Happy Scale">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data.filter(d => d.happyScale != null)} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,184,122,0.1)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} domain={[1, 6]} ticks={[1,2,3,4,5,6]} />
            <Tooltip content={<ScaleTooltip labelMap={HAPPY_LABELS} />} />
            <Line dataKey="happyScale" stroke="#3AB87A" strokeWidth={2} dot={{ r: 3, fill: '#3AB87A' }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
