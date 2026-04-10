'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  postId: string
  onUploaded: (url: string) => void
  onClose: () => void
}

interface CropState {
  x: number  // 0–1 fraction of naturalWidth
  y: number  // 0–1 fraction of naturalHeight
}

const OUTPUT_SIZE = 800  // output square px
const MIN_ZOOM = 0       // 0 = full coverage (zoomed out)
const MAX_ZOOM = 1       // 1 = maximum zoom in (smallest crop area)

export default function PhotoCropUpload({ postId, onUploaded, onClose }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [imgNaturalW, setImgNaturalW] = useState(0)
  const [imgNaturalH, setImgNaturalH] = useState(0)
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0)  // 0 = max coverage, 1 = max zoom in
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startCrop: CropState } | null>(null)
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null)

  // The crop square side in natural pixels, driven by zoom level.
  // zoom=0: side = min(W, H) (full coverage of the short side)
  // zoom=1: side = min(W, H) * 0.15 (smallest usable area)
  function getCropSidePx(): number {
    if (!imgNaturalW || !imgNaturalH) return 0
    const maxSide = Math.min(imgNaturalW, imgNaturalH)
    const minSide = maxSide * 0.15
    return maxSide - (maxSide - minSide) * zoom
  }

  // Clamp crop position so the square stays within the image
  function clampCrop(x: number, y: number, sidePx: number): CropState {
    const maxX = 1 - sidePx / imgNaturalW
    const maxY = 1 - sidePx / imgNaturalH
    return {
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    }
  }

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
        setZoom(0)
        // Centre the crop box
        const side = Math.min(img.width, img.height)
        setCrop({
          x: (img.width - side) / 2 / img.width,
          y: (img.height - side) / 2 / img.height,
        })
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const getContainerRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() ?? { width: 0, height: 0, left: 0, top: 0 }
  }, [])

  // ── Mouse drag ────────────────────────────────────────────────────────────

  function onMouseDown(e: React.MouseEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startCrop: { ...crop } }
    e.preventDefault()
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current || !imgNaturalW) return
      const rect = getContainerRect()
      const dx = (e.clientX - dragRef.current.startX) / rect.width
      const dy = (e.clientY - dragRef.current.startY) / rect.height
      const { startCrop } = dragRef.current
      const sidePx = getCropSidePx()
      setCrop(clampCrop(startCrop.x + dx, startCrop.y + dy, sidePx))
    }
    function onMouseUp() { dragRef.current = null }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgNaturalW, imgNaturalH, zoom, getContainerRect])

  // ── Touch drag + pinch-to-zoom ────────────────────────────────────────────

  function getTouchDist(t: React.TouchList): number {
    if (t.length < 2) return 0
    const dx = t[0].clientX - t[1].clientX
    const dy = t[0].clientY - t[1].clientY
    return Math.hypot(dx, dy)
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      // Pinch start
      pinchRef.current = { startDist: getTouchDist(e.touches), startZoom: zoom }
      dragRef.current = null
    } else if (e.touches.length === 1) {
      // Single-finger drag
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startCrop: { ...crop },
      }
      pinchRef.current = null
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 2 && pinchRef.current) {
      // Pinch zoom
      const currentDist = getTouchDist(e.touches)
      const ratio = pinchRef.current.startDist / currentDist
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchRef.current.startZoom + (ratio - 1) * 0.8))
      setZoom(newZoom)
      // Re-clamp crop for the new zoom level
      const maxSide = Math.min(imgNaturalW, imgNaturalH)
      const minSide = maxSide * 0.15
      const newSidePx = maxSide - (maxSide - minSide) * newZoom
      setCrop(c => clampCrop(c.x, c.y, newSidePx))
    } else if (e.touches.length === 1 && dragRef.current) {
      const rect = getContainerRect()
      const dx = (e.touches[0].clientX - dragRef.current.startX) / rect.width
      const dy = (e.touches[0].clientY - dragRef.current.startY) / rect.height
      const sidePx = getCropSidePx()
      setCrop(clampCrop(dragRef.current.startCrop.x + dx, dragRef.current.startCrop.y + dy, sidePx))
    }
  }

  function onTouchEnd() {
    dragRef.current = null
    pinchRef.current = null
  }

  // ── Zoom slider change ────────────────────────────────────────────────────

  function onZoomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newZoom = parseFloat(e.target.value)
    setZoom(newZoom)
    const maxSide = Math.min(imgNaturalW, imgNaturalH)
    const minSide = maxSide * 0.15
    const newSidePx = maxSide - (maxSide - minSide) * newZoom
    setCrop(c => clampCrop(c.x, c.y, newSidePx))
  }

  // ── Crop overlay percentages ──────────────────────────────────────────────
  // width/height are calculated separately so the box stays visually square
  // regardless of the image's aspect ratio.

  const sidePx = getCropSidePx()
  const cropPercent = imgSrc && imgNaturalW && imgNaturalH ? {
    left:   `${crop.x * 100}%`,
    top:    `${crop.y * 100}%`,
    width:  `${(sidePx / imgNaturalW) * 100}%`,
    height: `${(sidePx / imgNaturalH) * 100}%`,
  } : null

  // ── Export + upload ───────────────────────────────────────────────────────

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
      const srcSize = sidePx

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
        <p className="crop-hint">Drag to reframe. Pinch or use the slider to zoom.</p>

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
          <>
            <div
              ref={containerRef}
              className="crop-preview-wrap"
              style={{ position: 'relative', userSelect: 'none', touchAction: 'none' }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt="Crop preview"
                className="crop-preview-img"
                draggable={false}
              />

              {/* Darkened overlay outside crop */}
              {cropPercent && <>
                <div className="crop-shade crop-shade--top"    style={{ height: cropPercent.top    }} />
                <div className="crop-shade crop-shade--bottom" style={{ top: `calc(${cropPercent.top} + ${cropPercent.height})` }} />
                <div className="crop-shade crop-shade--left"   style={{ width: cropPercent.left, top: cropPercent.top, height: cropPercent.height }} />
                <div className="crop-shade crop-shade--right"  style={{ left: `calc(${cropPercent.left} + ${cropPercent.width})`, top: cropPercent.top, height: cropPercent.height }} />

                {/* Draggable crop square */}
                <div
                  className="crop-handle"
                  style={{ position: 'absolute', ...cropPercent, cursor: 'move' }}
                  onMouseDown={onMouseDown}
                />
              </>}

              <button className="crop-change-btn" onClick={() => setImgSrc(null)}>Change photo</button>
            </div>

            {/* Zoom slider */}
            <div className="crop-zoom-row">
              <span className="crop-zoom-label">−</span>
              <input
                type="range"
                className="crop-zoom-slider"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={onZoomChange}
                aria-label="Zoom"
              />
              <span className="crop-zoom-label">+</span>
            </div>
          </>
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
