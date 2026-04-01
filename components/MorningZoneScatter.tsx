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

export interface ZonePoint {
  postId: string
  date: string
  slug: string
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
}

const HAPPY_COLOURS = ['', '#5B8FBF', '#7BAED4', '#A8C8E0', '#F0D878', '#ECC832', '#F5B800']
const BRAIN_LABELS  = ['', 'Peaceful', 'Quiet', 'Active', 'Busy', 'Racing', 'Manic']
const BODY_LABELS   = ['', 'Lethargic', 'Slow', 'Steady', 'Energised', 'Strong', 'Buzzing']
const HAPPY_LABELS  = ['', 'Far from happy', 'Low', 'Okay', 'Good', 'Happy', 'Joyful']

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// Deterministic jitter derived from postId — stable across re-renders
function hashJitter(postId: string, axis: 'x' | 'y'): number {
  const slice = axis === 'x' ? postId.slice(0, 8) : postId.slice(9, 17)
  let hash = 0
  for (let i = 0; i < slice.length; i++) {
    hash = (hash * 31 + slice.charCodeAt(i)) & 0xffff
  }
  return ((hash % 1000) / 1000 - 0.5) * 0.6 // range: [-0.3, 0.3]
}

type PreparedPoint = Omit<ZonePoint, 'brainScale' | 'bodyScale' | 'happyScale'> & {
  brainScale: number
  bodyScale: number
  happyScale: number
  jx: number
  jy: number
  opacity: number
  isToday: boolean
  slug: string
  username?: string
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: PreparedPoint
}

function CustomDot({ cx = 0, cy = 0, payload }: DotProps) {
  if (!payload) return null
  const colour = HAPPY_COLOURS[payload.happyScale] ?? '#909090'
  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload.isToday ? 10 : 7}
      fill={colour}
      opacity={payload.opacity}
      stroke={payload.isToday ? 'rgba(33,68,89,0.9)' : 'rgba(255,255,255,0.35)'}
      strokeWidth={payload.isToday ? 2.5 : 1}
    />
  )
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: PreparedPoint }>
}

function ZoneTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const colour = HAPPY_COLOURS[p.happyScale] ?? '#909090'
  return (
    <div style={{
      background: 'var(--bg, #fff)',
      border: '1px solid rgba(74,127,165,0.2)',
      borderRadius: 8,
      padding: '0.6rem 0.85rem',
      fontSize: '0.78rem',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      color: 'var(--body-text, #4A4A4A)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{fmtDate(p.date)}</div>
      <div>Brain: {p.brainScale} — {BRAIN_LABELS[p.brainScale]}</div>
      <div>Body: {p.bodyScale} — {BODY_LABELS[p.bodyScale]}</div>
      <div style={{ marginTop: '0.25rem', color: colour, fontWeight: 600 }}>
        Happy: {p.happyScale} — {HAPPY_LABELS[p.happyScale]}
      </div>
      <a
        href={p.username ? `/${p.username}/${p.slug}` : `/posts/${p.slug}`}
        style={{
          display: 'block',
          marginTop: '0.6rem',
          textAlign: 'center',
          background: '#214459',
          color: '#fff',
          borderRadius: 6,
          padding: '0.4rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Open journal →
      </a>
    </div>
  )
}

export default function MorningZoneScatter({ data, todayPostId, username }: { data: ZonePoint[]; todayPostId?: string; username?: string }) {
  if (!data.length) return null

  // data arrives sorted oldest-first; opacity increases with index (oldest = dim, newest = vivid)
  // Filter out points missing required axes (brain/body/happy can be null on new journals)
  const validData = data.filter(p => p.brainScale != null && p.bodyScale != null && p.happyScale != null) as (ZonePoint & { brainScale: number; bodyScale: number; happyScale: number })[]
  if (!validData.length) return null

  const prepared: PreparedPoint[] = validData.map((point, i) => ({
    ...point,
    jx: point.bodyScale! + hashJitter(point.postId, 'x'),
    jy: point.brainScale! + hashJitter(point.postId, 'y'),
    opacity: validData.length <= 1 ? 1 : 0.15 + (0.85 * i / (validData.length - 1)),
    isToday: point.postId === todayPostId,
    username,
  }))

  return (
    <div>
      <p style={{
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 600,
        color: 'var(--body-text, #4A4A4A)',
        opacity: 0.5,
        marginBottom: '0.75rem',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}>
        Last 30 entries — Body vs Brain · colour = happiness
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 12, right: 16, bottom: 28, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,165,0.1)" />
          <XAxis
            type="number"
            dataKey="jx"
            domain={[0.5, 6.5]}
            ticks={[1, 2, 3, 4, 5, 6]}
            tick={{ fontSize: 12, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Body Energy', position: 'insideBottom', offset: -14, fontSize: 12, fill: 'currentColor', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
          />
          <YAxis
            type="number"
            dataKey="jy"
            domain={[0.5, 6.5]}
            ticks={[1, 2, 3, 4, 5, 6]}
            tick={{ fontSize: 12, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Brain Activity', angle: -90, position: 'insideLeft', offset: 16, fontSize: 12, fill: 'currentColor', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
          />
          <Tooltip content={<ZoneTooltip />} cursor={false} />
          <Scatter
            data={prepared}
            shape={(props: ScatterShapeProps) => (
              <CustomDot
                cx={props.cx as number | undefined}
                cy={props.cy as number | undefined}
                payload={props.payload as PreparedPoint}
              />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Happy scale colour key */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.25rem',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: '0.7rem',
        color: 'var(--body-text, #4A4A4A)',
        opacity: 0.55,
      }}>
        <span>Unhappy</span>
        <div style={{
          flex: 1,
          height: 5,
          borderRadius: 3,
          background: 'linear-gradient(to right, #5B8FBF, #7BAED4, #A8C8E0, #F0D878, #ECC832, #F5B800)',
        }} />
        <span>Joyful</span>
      </div>
    </div>
  )
}
