'use client'

import { useState } from 'react'
import Image from 'next/image'
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
        <Image
          src={image}
          alt="Journal photo"
          width={800}
          height={800}
          sizes="(max-width: 720px) 100vw, 680px"
          className="td-photo-preview"
          style={{ height: 'auto' }}
        />
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
