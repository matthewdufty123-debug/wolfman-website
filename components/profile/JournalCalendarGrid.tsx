'use client'

const TEAL = '#70C0C8'
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export interface CalendarWeek {
  days: { date: string; ritualCount: number | null }[]
  weeklyRitualTotal: number
}

interface Props {
  weeks: CalendarWeek[]
}

export default function JournalCalendarGrid({ weeks }: Props) {
  if (weeks.length === 0) return null

  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{
        fontFamily: 'var(--font-inter), sans-serif',
        fontSize: '0.62rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--body-text)',
        opacity: 0.4,
        marginBottom: '0.5rem',
        margin: '0 0 0.5rem',
      }}>
        Total Rituals
      </p>
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr) 0.4rem repeat(1, 1fr)',
          gap: '0.3rem',
          minWidth: 220,
          alignItems: 'center',
        }}>
          {/* Header row — day initials + gap + Σ */}
          {DAY_INITIALS.map((d, i) => (
            <div key={i} style={{
              textAlign: 'center',
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '0.55rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--body-text)',
              opacity: 0.35,
              paddingBottom: '0.2rem',
            }}>
              {d}
            </div>
          ))}
          {/* Gap spacer header */}
          <div />
          {/* Σ header */}
          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '0.55rem',
            fontWeight: 700,
            color: 'var(--body-text)',
            opacity: 0.35,
            paddingBottom: '0.2rem',
          }}>
            Σ
          </div>

          {/* Week rows */}
          {weeks.map((week, wi) => (
            <>
              {week.days.map((day, di) => {
                const hasJournal = day.ritualCount !== null
                return (
                  <div
                    key={`${wi}-${di}`}
                    title={day.date}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: hasJournal ? TEAL : 'transparent',
                      border: `1px solid ${hasJournal ? TEAL : 'rgba(112,192,200,0.18)'}`,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-inter), sans-serif',
                      color: hasJournal ? '#fff' : 'transparent',
                    }}
                  >
                    {hasJournal ? day.ritualCount : ''}
                  </div>
                )
              })}
              {/* Gap spacer */}
              <div />
              {/* Weekly total — square */}
              <div
                key={`${wi}-total`}
                style={{
                  aspectRatio: '1',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: week.weeklyRitualTotal > 0 ? 'rgba(112,192,200,0.1)' : 'transparent',
                  border: '1px solid rgba(112,192,200,0.18)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-inter), sans-serif',
                  color: 'var(--body-text)',
                  opacity: week.weeklyRitualTotal > 0 ? 0.7 : 0.2,
                }}
              >
                {week.weeklyRitualTotal > 0 ? week.weeklyRitualTotal : '—'}
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
