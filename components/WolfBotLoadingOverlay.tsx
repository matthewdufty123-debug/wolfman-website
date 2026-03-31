'use client'

import { WOLFBOT_GRID, WOLFBOT_PALETTE, LEFT_EYE_CELLS, RIGHT_EYE_CELLS } from '@/lib/wolfbot-pixel-data'

interface Props {
  open: boolean
}

export default function WolfBotLoadingOverlay({ open }: Props) {
  if (!open) return null

  return (
    <div className="wb-overlay">
      <svg viewBox="0 0 25 25" width={120} height={120} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Static pixels — everything except the eye cells */}
        <g>
          {WOLFBOT_GRID.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              if (cell === 1) return null
              const fill = WOLFBOT_PALETTE[cell]
              if (!fill) return null
              const key = `${rowIdx},${colIdx}`
              if (LEFT_EYE_CELLS.has(key) || RIGHT_EYE_CELLS.has(key)) return null
              return (
                <rect key={key} x={colIdx} y={rowIdx} width={1} height={1} fill={fill} />
              )
            })
          )}
        </g>
        {/* Left eye — animated scan */}
        <g className="wb-eye">
          {[9,10,11].flatMap(r =>
            [7,8,9].map(c => {
              const cell = WOLFBOT_GRID[r][c]
              const fill = WOLFBOT_PALETTE[cell]
              if (!fill) return null
              return <rect key={`${r},${c}`} x={c} y={r} width={1} height={1} fill={fill} />
            })
          )}
        </g>
        {/* Right eye — animated scan */}
        <g className="wb-eye">
          {[9,10,11].flatMap(r =>
            [18,19,20].map(c => {
              const cell = WOLFBOT_GRID[r][c]
              const fill = WOLFBOT_PALETTE[cell]
              if (!fill) return null
              return <rect key={`${r},${c}`} x={c} y={r} width={1} height={1} fill={fill} />
            })
          )}
        </g>
      </svg>

      <p className="wb-overlay-text">
        <span className="wbt-prompt">&gt;&nbsp;</span>
        WOLF|BOT IS READING YOUR JOURNAL...
        <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
      </p>
    </div>
  )
}
