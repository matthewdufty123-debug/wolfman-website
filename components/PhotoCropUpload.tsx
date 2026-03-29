'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  postId: string
  onUploaded: (url: string) => void
  onClose: () => void
}

interface CropState {
  x: number  // 0–1
  y: number  // 0–1
  size: number  // 0–1 (square side)
}

const OUTPUT_SIZE = 800  // output square px

export default function PhotoCropUpload({ postId, onUploaded, onClose }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [imgNaturalW, setImgNaturalW] = useState(0)
  const [imgNaturalH, setImgNaturalH] = useState(0)
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, size: 1 })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const displayImgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startCrop: CropState } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load image from file input
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      setImgSrc(src)
      const img = new window.Image()
      img.onload = () => {
        setImgNaturalW(img.width)
        setImgNaturalH(img.height)
        // Default crop: largest possible square centred
        const side = Math.min(img.width, img.height)
        setCrop({
          x: (img.width - side) / 2 / img.width,
          y: (img.height - side) / 2 / img.height,
          size: side / Math.max(img.width, img.height),
        })
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  // Drag to move crop handle
  const getDisplayRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() ?? { width: 0, height: 0, left: 0, top: 0 }
  }, [])

  function onMouseDown(e: React.MouseEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startCrop: { ...crop } }
    e.preventDefault()
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current || !imgNaturalW) return
      const rect = getDisplayRect()
      const dx = (e.clientX - dragRef.current.startX) / rect.width
      const dy = (e.clientY - dragRef.current.startY) / rect.height
      const { startCrop } = dragRef.current
      const newX = Math.max(0, Math.min(1 - startCrop.size, startCrop.x + dx))
      const newY = Math.max(0, Math.min(1 - startCrop.size, startCrop.y + dy))
      setCrop(c => ({ ...c, x: newX, y: newY }))
    }
    function onMouseUp() { dragRef.current = null }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [imgNaturalW, getDisplayRect])

  // Render the crop preview overlay percentages
  const cropPercent = imgSrc ? {
    left:   `${crop.x * 100}%`,
    top:    `${crop.y * 100}%`,
    width:  `${crop.size * 100}%`,
    height: `${crop.size * 100}%`,
  } : null

  // Export to canvas, compress, upload
  async function handleConfirm() {
    if (!imgSrc || !imgNaturalW) return
    setUploading(true)
    setError('')

    try {
      const canvas = canvasRef.current!
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')!

      const img = new window.Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imgSrc
      })

      const srcX = crop.x * imgNaturalW
      const srcY = crop.y * imgNaturalH
      const srcSize = crop.size * Math.max(imgNaturalW, imgNaturalH)

      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas empty')), 'image/jpeg', 0.82)
      })

      const form = new FormData()
      form.append('file', blob, 'journal-photo.jpg')

      const res = await fetch(`/api/posts/${postId}/image`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onUploaded(url)
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="crop-overlay" role="dialog" aria-modal="true" aria-label="Crop journal photo">
      <div className="crop-backdrop" onClick={onClose} />
      <div className="crop-panel">
        <button className="crop-close" onClick={onClose} aria-label="Close">✕</button>
        <h3 className="crop-heading">Journal Photo</h3>
        <p className="crop-hint">Choose an image. Drag the crop handle to reframe.</p>

        {!imgSrc ? (
          <label className="crop-file-label">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="crop-file-input"
              onChange={handleFileChange}
            />
            Choose photo
          </label>
        ) : (
          <div
            ref={containerRef}
            className="crop-preview-wrap"
            style={{ position: 'relative', userSelect: 'none' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={displayImgRef}
              src={imgSrc}
              alt="Crop preview"
              className="crop-preview-img"
              draggable={false}
            />

            {/* Darkened overlay outside crop */}
            <div className="crop-shade crop-shade--top"    style={{ height: cropPercent?.top    }} />
            <div className="crop-shade crop-shade--bottom" style={{ top: `calc(${cropPercent?.top} + ${cropPercent?.height})` }} />
            <div className="crop-shade crop-shade--left"   style={{ width: cropPercent?.left, top: cropPercent?.top, height: cropPercent?.height }} />
            <div className="crop-shade crop-shade--right"  style={{ left: `calc(${cropPercent?.left} + ${cropPercent?.width})`, top: cropPercent?.top, height: cropPercent?.height }} />

            {/* Draggable crop square */}
            {cropPercent && (
              <div
                className="crop-handle"
                style={{ position: 'absolute', ...cropPercent, cursor: 'move' }}
                onMouseDown={onMouseDown}
              />
            )}

            <button className="crop-change-btn" onClick={() => setImgSrc(null)}>Change photo</button>
          </div>
        )}

        {error && <p className="crop-error">{error}</p>}

        {imgSrc && (
          <button className="crop-confirm-btn" onClick={handleConfirm} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Use this photo'}
          </button>
        )}

        {/* Hidden canvas for export */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}
