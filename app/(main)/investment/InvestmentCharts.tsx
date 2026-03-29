'use client'

import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend,
} from 'recharts'
import type { MonthlyPoint } from '@/lib/investment-model'

// ─── Colours ─────────────────────────────────────────────────────────────────
const C = {
  conservative: '#909090',
  base:         '#4A7FA5',
  optimistic:   '#3AB87A',
  target:       '#F9F6F5',
  free:         '#A8D0E0',
  premium:      '#4A7FA5',
}

// ─── Formatters ──────────────────────────────────────────────────────────────
function fmtGBP(v: number) {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}m`
  if (v >= 1_000)     return `£${(v / 1_000).toFixed(0)}k`
  return `£${v}`
}

function fmtNum(v: number) {
  return v.toLocaleString('en-GB')
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
interface TooltipPayload {
  dataKey: string
  name: string
  value: number
  color: string
}
interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  format?: 'currency' | 'number'
}
function ChartTooltip({ active, payload, label, format = 'currency' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="inv-tooltip">
      <p className="inv-tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="inv-tooltip-row" style={{ color: p.color }}>
          {p.name}: {format === 'currency' ? fmtGBP(p.value) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Revenue Forecast Chart ───────────────────────────────────────────────────
interface RevenueChartProps {
  data: { label: string; conservative: number; base: number; optimistic: number }[]
}
export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="inv-chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,165,0.12)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#909090', fontFamily: 'var(--font-inter), "Helvetica Neue", Helvetica, Arial, sans-serif' }}
            interval={2}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtGBP}
            tick={{ fontSize: 11, fill: '#909090', fontFamily: 'var(--font-inter), "Helvetica Neue", Helvetica, Arial, sans-serif' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip format="currency" />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) => (
              value === 'conservative' ? 'Conservative' :
              value === 'base' ? 'Base Case' : 'Optimistic'
            )}
          />
          <ReferenceLine
            y={100_000}
            stroke={C.target}
            strokeDasharray="4 3"
            label={{ value: '£100k target', position: 'insideTopLeft', fill: C.target, fontSize: 11 }}
          />
          <Line type="monotone" dataKey="conservative" stroke={C.conservative} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="base"         stroke={C.base}         strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="optimistic"   stroke={C.optimistic}   strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── User Growth Chart ────────────────────────────────────────────────────────
interface UserChartProps {
  data: { label: string; free: number; premium: number }[]
}
export function UserGrowthChart({ data }: UserChartProps) {
  return (
    <div className="inv-chart-wrap">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,165,0.12)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#909090', fontFamily: 'var(--font-inter), "Helvetica Neue", Helvetica, Arial, sans-serif' }}
            interval={2}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtNum}
            tick={{ fontSize: 11, fill: '#909090', fontFamily: 'var(--font-inter), "Helvetica Neue", Helvetica, Arial, sans-serif' }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip content={<ChartTooltip format="number" />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(v) => v === 'free' ? 'Free tier users' : 'Premium subscribers'} />
          <Line type="monotone" dataKey="free"    stroke={C.free}    strokeWidth={2} dot={false} name="free" />
          <Line type="monotone" dataKey="premium" stroke={C.premium} strokeWidth={2.5} dot={false} name="premium" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Monthly Data Table ───────────────────────────────────────────────────────
interface DataTableProps {
  data: MonthlyPoint[]
}
export function DataTable({ data }: DataTableProps) {
  return (
    <div className="inv-table-scroll">
      <table className="inv-table">
        <thead>
          <tr>
            <th className="inv-th inv-th--sticky">Month</th>
            <th className="inv-th inv-th--right">New Free</th>
            <th className="inv-th inv-th--right">Total Free</th>
            <th className="inv-th inv-th--right">New Monthly</th>
            <th className="inv-th inv-th--right">New Yearly</th>
            <th className="inv-th inv-th--right">Churn</th>
            <th className="inv-th inv-th--right">Total Premium</th>
            <th className="inv-th inv-th--right">Rev / yr</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month} className="inv-tr">
              <td className="inv-td inv-td--sticky inv-td--label">{row.label}</td>
              <td className="inv-td inv-td--right">{fmtNum(row.newFree)}</td>
              <td className="inv-td inv-td--right">{fmtNum(row.cumFree)}</td>
              <td className="inv-td inv-td--right">{fmtNum(row.newMonthly)}</td>
              <td className="inv-td inv-td--right">{fmtNum(row.newYearly)}</td>
              <td className="inv-td inv-td--right inv-td--churn">{fmtNum(row.churn)}</td>
              <td className="inv-td inv-td--right inv-td--premium">{fmtNum(row.totalPremium)}</td>
              <td className="inv-td inv-td--right inv-td--revenue">{fmtGBP(row.annualRunRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
