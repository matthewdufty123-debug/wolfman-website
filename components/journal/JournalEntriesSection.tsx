import type { ProcessedPost } from '@/lib/posts'

type Entry = {
  id: string
  type: string
  content: string
  source: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

interface Props {
  post: ProcessedPost
  entries: Entry[]
}

const SECTION_ORDER = [
  { type: 'intention', label: "Today's Intention" },
  { type: 'gratitude', label: "I'm Grateful For" },
  { type: 'great_at', label: "Something I'm Great At" },
] as const

export default function JournalEntriesSection({ post, entries }: Props) {
  // Filter out reflection entries — those render separately via EveningSection
  const mainEntries = entries.filter(e => e.type !== 'reflection')

  if (mainEntries.length === 0) {
    // No entries — fall back to markdown body
    return (
      <article className="post">
        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      </article>
    )
  }

  return (
    <article className="post">
      {SECTION_ORDER.map(section => {
        const sectionEntries = mainEntries.filter(e => e.type === section.type)
        if (sectionEntries.length === 0) return null

        const isMulti = sectionEntries.length > 1

        return (
          <div key={section.type} className="post-section">
            <p className="post-section-label">{section.label}</p>
            {isMulti ? (
              <div className="post-entries">
                {sectionEntries.map(entry => (
                  <div key={entry.id} className="post-entry">
                    <div className="post-body">
                      {entry.content.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                    <div className="post-entry-meta">
                      <span className="post-entry-time">{formatTime(entry.createdAt)}</span>
                      {entry.source === 'telegram' && (
                        <span className="post-entry-source">via Telegram</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="post-body">
                {sectionEntries[0].content.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </article>
  )
}

function formatTime(date: Date) {
  const d = new Date(date)
  const h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}
