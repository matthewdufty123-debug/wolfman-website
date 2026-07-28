'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Props {
  status: string
  entryCount: number
  /** Sections with writing typed but not yet added — publishing commits these first. */
  pendingCount: number
  error: string | null
  isPublic: boolean
  communityEnabled: boolean
  publishedAt: string | null
  slug: string | null
  username: string | null
  onTogglePublic: () => void
  onPublish: () => Promise<boolean>
}

export default function PublishBar({
  status,
  entryCount,
  pendingCount,
  error,
  isPublic,
  communityEnabled,
  publishedAt,
  slug,
  username,
  onTogglePublic,
  onPublish,
}: Props) {
  const [publishing, setPublishing] = useState(false)
  // 'published' | 'republished' — flashes a confirmation on the button after the action lands
  const [confirmed, setConfirmed] = useState<string | null>(null)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPublished = status === 'published'

  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current) }, [])

  async function handlePublish() {
    const wasPublished = isPublished
    setPublishing(true)
    const ok = await onPublish()
    setPublishing(false)
    // Only confirm what actually happened — a failed publish shows its own
    // error instead, never a tick.
    if (!ok) return
    setConfirmed(wasPublished ? 'Republished' : 'Published')
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    confirmTimer.current = setTimeout(() => setConfirmed(null), 3000)
  }

  const journalUrl = (username && slug) ? `/${username}/${slug}` : null
  // Writing sitting in an open editor counts — publishing saves it first.
  const nothingToPublish = entryCount === 0 && pendingCount === 0

  return (
    <div className="td-publish-wrap">
      <div className="td-publish-bar">
        <div className="td-publish-status">
          {isPublished ? (
            <span className="td-status td-status--published">
              Published{publishedAt ? ` at ${formatTime(publishedAt)}` : ''}
            </span>
          ) : (
            <span className="td-status td-status--draft">
              Draft{entryCount > 0 ? ` \u00b7 ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}` : ''}
            </span>
          )}
        </div>

        {isPublished && journalUrl && (
          <Link href={journalUrl} className="td-view-link">
            View journal
          </Link>
        )}

        {communityEnabled && (
          <button
            type="button"
            className={`td-visibility-toggle${isPublic ? ' td-visibility-toggle--public' : ''}`}
            onClick={onTogglePublic}
            title={isPublished ? 'Changes community visibility immediately' : 'Visibility when published'}
          >
            {isPublic ? 'Public' : 'Private'}
          </button>
        )}

        <button
          type="button"
          className={`td-publish-btn${confirmed ? ' td-publish-btn--confirmed' : ''}`}
          onClick={handlePublish}
          disabled={publishing || nothingToPublish || confirmed !== null}
          title={nothingToPublish ? 'Write at least one entry to publish' : undefined}
          aria-live="polite"
        >
          {publishing
            ? 'Publishing\u2026'
            : confirmed
              ? `\u2713 ${confirmed}`
              : isPublished ? 'Republish' : 'Publish'}
        </button>
      </div>

      {nothingToPublish && !isPublished && (
        <p className="td-publish-hint">Write at least one entry above to publish your journal.</p>
      )}

      {!nothingToPublish && pendingCount > 0 && (
        <p className="td-publish-hint">
          Your unsaved writing will be saved when you {isPublished ? 'republish' : 'publish'}.
        </p>
      )}

      {error && <p className="td-publish-error">{error}</p>}
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}
