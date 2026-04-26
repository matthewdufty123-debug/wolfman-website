'use client'

import { useState } from 'react'
import PhotoCropUpload from '@/components/PhotoCropUpload'

interface Props {
  postId: string
  image: string | null
  onUploaded: (url: string) => void
}

export default function PhotoSection({ postId, image, onUploaded }: Props) {
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className="td-photo-section">
      <div className="td-panel-header">
        <h2 className="td-panel-title">Photo</h2>
        {!showUpload && (
          <button
            type="button"
            className="td-section-add"
            onClick={() => setShowUpload(true)}
          >
            {image ? 'Change' : '+'}
          </button>
        )}
      </div>

      {image && !showUpload && (
        <img src={image} alt="Journal photo" className="td-photo-preview" />
      )}

      {showUpload && (
        <PhotoCropUpload
          postId={postId}
          onUploaded={(url) => { onUploaded(url); setShowUpload(false) }}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
