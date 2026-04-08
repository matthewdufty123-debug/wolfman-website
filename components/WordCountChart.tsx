'use client'

import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'

export interface WordCountRow {
  date: string
  wordCountIntention: number
  wordCountGratitude: number
  wordCountGreatAt: number
  wordCountTotal: number
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

interface TooltipPayloadEntry {
  dataKey: string
  value: number
  color: string
}

interface WordCountTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

const SECTION_LABELS: Record<string, string> = {
  wordCountIntention: 'Intention',
  wordCountGratitude: 'Gratitude',
  wordCountGreatAt: 'Great At',
}

function WordCountTooltip({ active, payload, label }: WordCountTooltipProps) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum, p) => sum + p.value, 0)
  return (
    <div style={{
      background: 'var(--bg, #fff)', border: '1px solid rgba(74,127,165,0.2)',
      borderRadius: 8, padding: '0.5rem 0.75rem',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: '0.82rem', color: 'var(--body-text)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label ? fmtDate(label) : ''}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span>{SECTION_LABELS[p.dataKey] ?? p.dataKey}: {p.value} words</span>
        </div>
      ))}
      <div style={{ marginTop: 4, borderTop: '1px solid rgba(74,127,165,0.15)', paddingTop: 4, fontWeight: 600 }}>
        Total: {total} words
      </div>
    </div>
  )
}

export default function WordCountChart({ data }: { data: WordCountRow[] }) {
  if (!data.length) return null

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
    width: 32,
    tickFormatter: (v: number) => `${Math.round(v * 100)}%`,
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} stackOffset="expand" margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,165,0.1)" vertical={false} />
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<WordCountTooltip />} cursor={{ fill: 'rgba(74,127,165,0.06)' }} />
        <Bar dataKey="wordCountIntention" stackId="wc" fill="#4A7FA5" radius={[0,0,0,0]} />
        <Bar dataKey="wordCountGratitude" stackId="wc" fill="#3AB87A" radius={[0,0,0,0]} />
        <Bar dataKey="wordCountGreatAt"   stackId="wc" fill="#A0622A" radius={[3,3,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
