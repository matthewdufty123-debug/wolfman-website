'use client'

import { useState } from 'react'
import type { ImageItem } from './image-groups'
import Lightbox from './Lightbox'

interface CarGalleryProps {
  images: ImageItem[]
  allImages: ImageItem[]
  small?: boolean
}

export default function CarGallery({ images, allImages, small }: CarGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const open = (img: ImageItem) => {
    const idx = allImages.findIndex(a => a.src === img.src)
    setLightboxIndex(idx >= 0 ? idx : 0)
  }

  return (
    <>
      <div
        style={{
          display: small ? 'flex' : 'grid',
          ...(small
            ? { gap: 6, flexWrap: 'wrap' as const }
            : { gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }),
          marginTop: small ? 6 : 12,
          marginBottom: small ? 0 : 12,
        }}
      >
        {images.map(img => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            loading="lazy"
            onClick={() => open(img)}
            style={{
              width: small ? 80 : '100%',
              aspectRatio: '4/3',
              objectFit: 'cover',
              borderRadius: 4,
              border: '1px solid #e0e0e0',
              cursor: 'pointer',
              transition: 'transform 150ms ease',
            }}
            onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.03)' }}
            onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={allImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
