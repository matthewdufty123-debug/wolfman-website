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
    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '0.4rem',
        minWidth: 260,
      }}>
        {/* Header row — day initials + "Σ" for weekly total column */}
        {[...DAY_INITIALS, 'Σ'].map((d, i) => (
          <div key={i} style={{
            textAlign: 'center',
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '0.6rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--body-text)',
            opacity: 0.4,
            paddingBottom: '0.25rem',
          }}>
            {d}
          </div>
        ))}

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
                    border: `1.5px solid ${hasJournal ? TEAL : 'rgba(112,192,200,0.2)'}`,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-inter), sans-serif',
                    color: hasJournal ? '#fff' : 'transparent',
                  }}
                >
                  {hasJournal ? day.ritualCount : ''}
                </div>
              )
            })}
            {/* Weekly total */}
            <div
              key={`${wi}-total`}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: week.weeklyRitualTotal > 0 ? 'rgba(112,192,200,0.12)' : 'transparent',
                border: '1.5px solid rgba(112,192,200,0.15)',
                fontSize: '0.6rem',
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
  )
}
