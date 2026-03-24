'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import WolfbotPixelRenderer from './WolfbotPixelRenderer'

const COLS = 25
const ROWS = 25
const CELL = 12   // px — paint grid cell size (larger than render unit for ergonomics)
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXY'

// Feature panel zone definitions
const FEATURE_ZONES = {
  ears:  { rowStart: 0,  colStart: 0,  rows: 7,  cols: 8,  mirror: true },
  eyes:  { rowStart: 7,  colStart: 4,  rows: 5,  cols: 17, mirror: false },
  nose:  { rowStart: 12, colStart: 9,  rows: 4,  cols: 7,  mirror: false },
  mouth: { rowStart: 16, colStart: 7,  rows: 4,  cols: 10, mirror: false },
} as const

type ZoneKey = keyof typeof FEATURE_ZONES

interface EmotionItem {
  name: string
  label: string
}

interface WolfbotPixelEditorProps {
  palette: string[]                              // 10 hex strings (0-indexed)
  emotionSprites: Record<string, number[][]>     // current DB state
  emotions: EmotionItem[]
  onSpriteUpdate: (emotionName: string, grid: number[][]) => void
}

function emptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(1))
}

function emptySubGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(1))
}

// ── Feature Panel ──────────────────────────────────────────────────────────
interface FeaturePanelProps {
  title: string
  zoneKey: ZoneKey
  mainGrid: number[][]
  palette: string[]
  onApply: (zoneKey: ZoneKey, subGrid: number[][]) => void
}

function FeaturePanel({ title, zoneKey, mainGrid, palette, onApply }: FeaturePanelProps) {
  const zone = FEATURE_ZONES[zoneKey]
  const [localGrid, setLocalGrid] = useState<number[][]>(() =>
    Array.from({ length: zone.rows }, (_, r) =>
      Array.from({ length: zone.cols }, (_, c) => mainGrid[zone.rowStart + r]?.[zone.colStart + c] ?? 1)
    )
  )
  const [activeColour, setActiveColour] = useState(2)
  const isPainting = useRef(false)

  // Sync from parent grid when it changes (e.g. after import)
  useEffect(() => {
    setLocalGrid(
      Array.from({ length: zone.rows }, (_, r) =>
        Array.from({ length: zone.cols }, (_, c) => mainGrid[zone.rowStart + r]?.[zone.colStart + c] ?? 1)
      )
    )
  }, [mainGrid, zone.rowStart, zone.colStart, zone.rows, zone.cols])

  const paint = useCallback((r: number, c: number) => {
    setLocalGrid(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = activeColour
      return next
    })
  }, [activeColour])

  return (
    <div className="wolfbot-feature-panel">
      <div className="wolfbot-feature-panel-title">{title}</div>
      <div className="wolfbot-feature-palette">
        {palette.map((hex, i) => (
          <button
            key={i}
            className={`wolfbot-fp-swatch${activeColour === i + 1 ? ' active' : ''}`}
            style={{ background: hex }}
            onClick={() => setActiveColour(i + 1)}
            title={`Colour ${i + 1}`}
          />
        ))}
      </div>
      <div
        className="wolfbot-subgrid"
        style={{ gridTemplateColumns: `repeat(${zone.cols}, ${CELL}px)` }}
        onMouseLeave={() => { isPainting.current = false }}
        onMouseUp={() => { isPainting.current = false }}
      >
        {localGrid.map((row, r) =>
          row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              className="wolfbot-cell"
              style={{ background: palette[val - 1] ?? palette[0] }}
              onMouseDown={e => { e.preventDefault(); isPainting.current = true; paint(r, c) }}
              onMouseEnter={() => { if (isPainting.current) paint(r, c) }}
            />
          ))
        )}
      </div>
      <button
        className="wolfbot-btn wolfbot-btn--apply"
        onClick={() => onApply(zoneKey, localGrid)}
      >
        Apply to Face{zone.mirror ? ' (mirrored)' : ''}
      </button>
    </div>
  )
}

// ── Zoom canvas (face region) ──────────────────────────────────────────────
const ZOOM_ROW_START = 4
const ZOOM_COL_START = 4
const ZOOM_ROWS = 14
const ZOOM_COLS = 17
const ZOOM_UNIT = Math.floor(224 / ZOOM_COLS) - 1  // 12px
const ZOOM_STEP = ZOOM_UNIT + 1

function ZoomCanvas({ grid, palette }: { grid: number[][], palette: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, 224, 224)

    for (let r = 0; r < ZOOM_ROWS; r++) {
      for (let c = 0; c < ZOOM_COLS; c++) {
        const val = grid[ZOOM_ROW_START + r]?.[ZOOM_COL_START + c] ?? 1
        const hex = palette[val - 1] ?? palette[0]
        const x = c * ZOOM_STEP
        const y = r * ZOOM_STEP

        ctx.fillStyle = hex
        ctx.beginPath()
        ctx.moveTo(x + 1, y)
        ctx.lineTo(x + ZOOM_UNIT - 1, y)
        ctx.quadraticCurveTo(x + ZOOM_UNIT, y, x + ZOOM_UNIT, y + 1)
        ctx.lineTo(x + ZOOM_UNIT, y + ZOOM_UNIT - 1)
        ctx.quadraticCurveTo(x + ZOOM_UNIT, y + ZOOM_UNIT, x + ZOOM_UNIT - 1, y + ZOOM_UNIT)
        ctx.lineTo(x + 1, y + ZOOM_UNIT)
        ctx.quadraticCurveTo(x, y + ZOOM_UNIT, x, y + ZOOM_UNIT - 1)
        ctx.lineTo(x, y + 1)
        ctx.quadraticCurveTo(x, y, x + 1, y)
        ctx.closePath()
        ctx.fill()
      }
    }
  }, [grid, palette])

  return (
    <canvas
      ref={canvasRef}
      width={224}
      height={224}
      style={{ width: 224, height: 224, imageRendering: 'pixelated', border: '1px solid #2a2a2a' }}
    />
  )
}

// ── Main Editor ────────────────────────────────────────────────────────────
export default function WolfbotPixelEditor({
  palette,
  emotionSprites,
  emotions,
  onSpriteUpdate,
}: WolfbotPixelEditorProps) {
  const [grid, setGrid] = useState<number[][]>(emptyGrid)
  const [activeColour, setActiveColour] = useState(2)
  const [selectedEmotion, setSelectedEmotion] = useState(emotions[0]?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const isPainting = useRef(false)

  // ── Paint ────────────────────────────────────────────────────────────────
  const paint = useCallback((r: number, c: number) => {
    setGrid(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = activeColour
      return next
    })
  }, [activeColour])

  // ── Apply Feature Panel ──────────────────────────────────────────────────
  const handleApply = useCallback((zoneKey: ZoneKey, subGrid: number[][]) => {
    const zone = FEATURE_ZONES[zoneKey]
    setGrid(prev => {
      const next = prev.map(row => [...row])
      subGrid.forEach((row, r) => {
        row.forEach((val, c) => {
          next[zone.rowStart + r][zone.colStart + c] = val
          if (zone.mirror) {
            // Mirror left ear to right ear (col 24 - (colStart + c))
            next[zone.rowStart + r][24 - (zone.colStart + c)] = val
          }
        })
      })
      return next
    })
  }, [])

  // ── Clear / Fill ─────────────────────────────────────────────────────────
  const clearGrid = () => setGrid(emptyGrid())
  const fillBg = () => setGrid(emptyGrid())  // both fill with colour 1 (Background)

  // ── Import from DB ───────────────────────────────────────────────────────
  const importSprite = () => {
    const sprite = emotionSprites[selectedEmotion]
    if (Array.isArray(sprite) && sprite.length === ROWS && Array.isArray(sprite[0]) && sprite[0].length === COLS) {
      setGrid(sprite.map(row => [...row]))
    } else {
      setGrid(emptyGrid())
    }
  }

  // ── Export to DB ─────────────────────────────────────────────────────────
  const exportSprite = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const updated = { ...emotionSprites, [selectedEmotion]: grid }
      const res = await fetch('/api/admin/wolfbot-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'emotion_sprites', value: updated }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Save failed')
      } else {
        setSaved(true)
        onSpriteUpdate(selectedEmotion, grid)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="wolfbot-editor-root">

      {/* ── Controls ─────────────────────────────────────────────────── */}
      <div className="wolfbot-controls">
        <select
          className="wolfbot-select"
          value={selectedEmotion}
          onChange={e => setSelectedEmotion(e.target.value)}
        >
          {emotions.map(em => (
            <option key={em.name} value={em.name}>{em.label}</option>
          ))}
        </select>
        <button className="wolfbot-btn" onClick={clearGrid}>Clear</button>
        <button className="wolfbot-btn" onClick={fillBg}>Fill BG</button>
        <button className="wolfbot-btn" onClick={importSprite}>Import</button>
        <button
          className="wolfbot-btn wolfbot-btn--primary"
          onClick={exportSprite}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save to DB'}
        </button>
        {saved && <span className="wolfbot-feedback-ok">Saved</span>}
        {error && <span className="wolfbot-feedback-err">{error}</span>}
      </div>

      {/* ── Palette Selector ─────────────────────────────────────────── */}
      <div className="wolfbot-palette-selector">
        {palette.map((hex, i) => (
          <button
            key={i}
            className={`wolfbot-palette-btn${activeColour === i + 1 ? ' active' : ''}`}
            style={{ background: hex }}
            onClick={() => setActiveColour(i + 1)}
            title={`Colour ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Workspace ────────────────────────────────────────────────── */}
      <div className="wolfbot-editor-wrap">

        {/* Paint grid */}
        <div className="wolfbot-editor-left">
          {/* Col headers */}
          <div className="wolfbot-col-headers" style={{ paddingLeft: 18 }}>
            {Array.from({ length: COLS }).map((_, c) => (
              <div key={c} className="wolfbot-col-header">{LETTERS[c]}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {/* Row headers */}
            <div className="wolfbot-row-headers">
              {Array.from({ length: ROWS }).map((_, r) => (
                <div key={r} className="wolfbot-row-header">{r + 1}</div>
              ))}
            </div>
            {/* Grid */}
            <div
              className="wolfbot-grid"
              style={{ gridTemplateColumns: `repeat(${COLS}, ${CELL}px)` }}
              onMouseLeave={() => { isPainting.current = false }}
              onMouseUp={() => { isPainting.current = false }}
            >
              {grid.map((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="wolfbot-cell"
                    style={{ background: palette[val - 1] ?? palette[0] }}
                    onMouseDown={e => { e.preventDefault(); isPainting.current = true; paint(r, c) }}
                    onMouseEnter={() => { if (isPainting.current) paint(r, c) }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Previews */}
        <div className="wolfbot-editor-right">
          <div className="wolfbot-preview-label">Preview — 224×224px</div>
          <WolfbotPixelRenderer grid={grid} palette={palette} />
          <div className="wolfbot-preview-label" style={{ marginTop: 12 }}>Face Zoom</div>
          <ZoomCanvas grid={grid} palette={palette} />
        </div>
      </div>

      {/* ── Feature Panels ───────────────────────────────────────────── */}
      <div className="wolfbot-feature-panels">
        {(Object.keys(FEATURE_ZONES) as ZoneKey[]).map(key => (
          <FeaturePanel
            key={key}
            title={key.charAt(0).toUpperCase() + key.slice(1)}
            zoneKey={key}
            mainGrid={grid}
            palette={palette}
            onApply={handleApply}
          />
        ))}
      </div>

    </div>
  )
}
