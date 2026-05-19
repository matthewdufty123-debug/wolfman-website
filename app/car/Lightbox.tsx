'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ImageItem } from './image-groups'

interface LightboxProps {
  images: ImageItem[]
  initialIndex: number
  onClose: () => void
}

export default function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [mounted, setMounted] = useState(false)
  const touchStartX = useRef(0)

  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  if (!mounted) return null

  const img = images[index]

  return createPortal(
    <div
      onClick={onClose}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 50) {
          e.stopPropagation()
          dx > 0 ? prev() : next()
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12,
          width: 44, height: 44,
          background: 'none', border: 'none', color: '#fff',
          fontSize: 28, cursor: 'pointer', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Close"
      >
        &#x2715;
      </button>

      {/* Prev arrow */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev() }}
          style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44,
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            color: '#fff', fontSize: 22, cursor: 'pointer', zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Previous image"
        >
          &#x276E;
        </button>
      )}

      {/* Next arrow */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next() }}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44,
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            color: '#fff', fontSize: 22, cursor: 'pointer', zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Next image"
        >
          &#x276F;
        </button>
      )}

      {/* Image */}
      <img
        src={img.src}
        alt={img.alt}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: 4,
          userSelect: 'none',
        }}
      />

      {/* Counter */}
      <span
        style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Arial, sans-serif',
        }}
      >
        {index + 1} / {images.length}
      </span>
    </div>,
    document.body
  )
}
