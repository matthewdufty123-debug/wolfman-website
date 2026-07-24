'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  status: string
  entryCount: number
  isPublic: boolean
  communityEnabled: boolean
  publishedAt: string | null
  slug: string | null
  username: string | null
  onTogglePublic: () => void
  onPublish: () => Promise<void>
}

export default function PublishBar({
  status,
  entryCount,
  isPublic,
  communityEnabled,
  publishedAt,
  slug,
  username,
  onTogglePublic,
  onPublish,
}: Props) {
  const [publishing, setPublishing] = useState(false)
  const isPublished = status === 'published'

  async function handlePublish() {
    setPublishing(true)
    await onPublish()
    setPublishing(false)
  }

  const journalUrl = (username && slug) ? `/${username}/${slug}` : null
  const nothingToPublish = entryCount === 0

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
          className="td-publish-btn"
          onClick={handlePublish}
          disabled={publishing || nothingToPublish}
          title={nothingToPublish ? 'Write at least one entry to publish' : undefined}
        >
          {publishing
            ? 'Publishing\u2026'
            : isPublished ? 'Republish' : 'Publish'}
        </button>
      </div>

      {nothingToPublish && !isPublished && (
        <p className="td-publish-hint">Write at least one entry above to publish your journal.</p>
      )}
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
