'use client'

import { useState } from 'react'

interface Props {
  status: string
  entryCount: number
  isPublic: boolean
  communityEnabled: boolean
  onTogglePublic: () => void
  onPublish: () => Promise<void>
}

export default function PublishBar({
  status,
  entryCount,
  isPublic,
  communityEnabled,
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

  return (
    <div className="td-publish-bar">
      <div className="td-publish-status">
        {isPublished ? (
          <span className="td-status td-status--published">Published</span>
        ) : (
          <span className="td-status td-status--draft">
            Draft{entryCount > 0 ? ` \u00b7 ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}` : ''}
          </span>
        )}
      </div>

      {communityEnabled && !isPublished && (
        <button
          type="button"
          className={`td-visibility-toggle${isPublic ? ' td-visibility-toggle--public' : ''}`}
          onClick={onTogglePublic}
        >
          {isPublic ? 'Public' : 'Private'}
        </button>
      )}

      {!isPublished && entryCount > 0 && (
        <button
          type="button"
          className="td-publish-btn"
          onClick={handlePublish}
          disabled={publishing}
        >
          {publishing ? 'Publishing\u2026' : 'Publish'}
        </button>
      )}
    </div>
  )
}
