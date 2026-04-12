'use client'

import type { ProcessedPost } from '@/lib/posts'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const COPPER     = '#A0622A'
const STEEL_BLUE = '#4A7FA5'

interface CalendarDay {
  date: string
  hasPost: boolean
}

interface Props {
  post: ProcessedPost
  calendarDays?: CalendarDay[]
}

function formatPostDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  const suffix = [1, 21, 31].includes(day) ? 'st' : [2, 22].includes(day) ? 'nd'
               : [3, 23].includes(day) ? 'rd' : 'th'
  return `${day}${suffix} ${months[month - 1]} ${year}`
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ')
}

export default function PostInfoSection({ post, calendarDays }: Props) {
  const wordCount = countWords(stripHtml(post.bodyHtml))
  const postedCount = calendarDays?.filter(d => d.hasPost).length ?? 0

  return (
    <section id="post-information" className="journal-section">
      <h2 className="journal-section-title">Post Information</h2>

      {calendarDays && calendarDays.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--body-text)',
            opacity: 0.5,
            marginBottom: '0.75rem',
          }}>
            How often have you posted recently?
          </p>
          <div className="wss-calendar-row">
            {calendarDays.map((day, i) => {
              const d = new Date(day.date + 'T12:00:00Z')
              const dayLabel = DAY_NAMES[d.getUTCDay()]
              const isToday = i === calendarDays.length - 1
              return (
                <div key={day.date} className="wss-calendar-day">
                  <div
                    className={`wss-calendar-dot${day.hasPost ? ' wss-calendar-dot--filled' : ''}`}
                    style={{
                      background: day.hasPost
                        ? (isToday ? COPPER : STEEL_BLUE)
                        : 'transparent',
                      borderColor: day.hasPost
                        ? (isToday ? COPPER : STEEL_BLUE)
                        : 'var(--chart-zone-track, rgba(74,127,165,0.15))',
                    }}
                  />
                  <span className="wss-calendar-label">{dayLabel}</span>
                </div>
              )
            })}
          </div>
          <p className="wss-calendar-count">{postedCount} of 10 days</p>
        </div>
      )}

      <div className="post-info-rows">
        <div className="post-info-row">
          <span className="post-info-label">Title</span>
          <span className="post-info-value">{post.title}</span>
        </div>
        <div className="post-info-row">
          <span className="post-info-label">Date</span>
          <span className="post-info-value">{formatPostDate(post.date)}</span>
        </div>
        <div className="post-info-row">
          <span className="post-info-label">Words</span>
          <span className="post-info-value">{wordCount.toLocaleString()}</span>
        </div>
        <div className="post-info-row">
          <span className="post-info-label">Status</span>
          <span className={`post-info-badge post-info-badge--${post.status}`}>{post.status}</span>
        </div>
      </div>
    </section>
  )
}
