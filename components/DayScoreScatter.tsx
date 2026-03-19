'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type ScatterShapeProps,
} from 'recharts'

interface ScatterPoint {
  date: string
  postId: string
  x: number
  y: number
}

interface Props {
  data: ScatterPoint[]
  todayPostId: string
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: ScatterPoint
  index?: number
  dataLength?: number
}

function CustomDot({ cx = 0, cy = 0, payload, index = 0, dataLength = 1 }: DotProps) {
  if (!payload) return null
  const isToday = payload.postId === (payload as ScatterPoint & { todayPostId?: string }).todayPostId

  if (isToday) {
    return <circle cx={cx} cy={cy} r={8} fill="#4A7FA5" opacity={1} />
  }

  // Opacity decreases from 0.6 (newest) to 0.15 (oldest) for non-today dots
  const nonTodayCount = dataLength - 1
  const position = index // older items have lower index since sorted by date asc
  const opacity = nonTodayCount <= 1
    ? 0.4
    : 0.15 + (0.45 * position) / (nonTodayCount - 1)

  return <circle cx={cx} cy={cy} r={4} fill="#909090" opacity={opacity} />
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: ScatterPoint }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div style={{
      background: 'var(--bg, #fff)',
      border: '1px solid rgba(74,127,165,0.25)',
      borderRadius: 6,
      padding: '0.5rem 0.75rem',
      fontSize: '0.75rem',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      color: 'var(--body-text, #4A4A4A)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{point.date}</div>
      <div>Intention alignment: {point.x.toFixed(1)}</div>
      <div>Inner vitality: {point.y.toFixed(1)}</div>
    </div>
  )
}

export default function DayScoreScatter({ data, todayPostId }: Props) {
  // Tag each point with todayPostId so CustomDot can check it
  const taggedData = data.map(d => ({ ...d, todayPostId }))

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <p style={{
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 600,
        color: 'var(--body-text, #4A4A4A)',
        opacity: 0.5,
        marginBottom: '0.75rem',
      }}>
        All days — Intention vs Vitality
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,165,0.1)" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[1, 10]}
            ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            tick={{ fontSize: 10, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fill: 'currentColor', opacity: 0.5 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Intention', position: 'insideBottomRight', offset: -4, fontSize: 10, opacity: 0.5 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[1, 10]}
            ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            tick={{ fontSize: 10, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fill: 'currentColor', opacity: 0.5 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Vitality', angle: -90, position: 'insideTopLeft', offset: 16, fontSize: 10, opacity: 0.5 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            data={taggedData}
            shape={(props: ScatterShapeProps) => (
              <CustomDot
                cx={props.cx as number | undefined}
                cy={props.cy as number | undefined}
                payload={props.payload as ScatterPoint}
                index={(props as { index?: number }).index}
                dataLength={taggedData.length}
              />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
