// WolfBotIcon — pixel-art SVG rendered from the official WOLF|BOT grid and palette.
// Update WOLFBOT_GRID or WOLFBOT_PALETTE in lib/wolfbot-pixel-data.ts when the design changes.

import { WOLFBOT_GRID, WOLFBOT_PALETTE } from '@/lib/wolfbot-pixel-data'

interface WolfBotIconProps {
  size?: number
  className?: string
}

export default function WolfBotIcon({ size = 100, className }: WolfBotIconProps) {
  return (
    <svg
      viewBox="0 0 25 25"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="WOLF|BOT"
      role="img"
    >
      {WOLFBOT_GRID.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          if (cell === 1) return null
          const fill = WOLFBOT_PALETTE[cell]
          if (!fill) return null
          return (
            <rect
              key={`${rowIdx}-${colIdx}`}
              x={colIdx}
              y={rowIdx}
              width={1}
              height={1}
              fill={fill}
            />
          )
        })
      )}
    </svg>
  )
}
