'use client'

import { useRef, useEffect } from 'react'

const UNIT = 8
const STEP = 9
const CANVAS_SIZE = 224

interface WolfbotPixelRendererProps {
  grid: number[][]
  palette: string[]       // 10 hex strings, 0-indexed (index 0 = colour num 1)
  size?: number           // scale multiplier for the canvas display (default 1 = 224px)
  className?: string
  style?: React.CSSProperties
}

export default function WolfbotPixelRenderer({
  grid,
  palette,
  size = 1,
  className,
  style,
}: WolfbotPixelRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    for (let r = 0; r < 25; r++) {
      for (let c = 0; c < 25; c++) {
        const val = grid[r]?.[c] ?? 1
        const hex = palette[val - 1] ?? palette[0]
        const x = c * STEP
        const y = r * STEP

        ctx.fillStyle = hex
        ctx.beginPath()
        ctx.moveTo(x + 1, y)
        ctx.lineTo(x + UNIT - 1, y)
        ctx.quadraticCurveTo(x + UNIT, y, x + UNIT, y + 1)
        ctx.lineTo(x + UNIT, y + UNIT - 1)
        ctx.quadraticCurveTo(x + UNIT, y + UNIT, x + UNIT - 1, y + UNIT)
        ctx.lineTo(x + 1, y + UNIT)
        ctx.quadraticCurveTo(x, y + UNIT, x, y + UNIT - 1)
        ctx.lineTo(x, y + 1)
        ctx.quadraticCurveTo(x, y, x + 1, y)
        ctx.closePath()
        ctx.fill()
      }
    }
  }, [grid, palette])

  const displaySize = CANVAS_SIZE * size

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className={className}
      style={{ width: displaySize, height: displaySize, imageRendering: 'pixelated', ...style }}
    />
  )
}
