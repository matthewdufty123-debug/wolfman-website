// WolfBotIcon — pixel-art SVG rendered from the official WOLF|BOT grid and palette.
// Accepts optional grid/palette props to render the live version from wolfbot_config.
// Falls back to the hardcoded values in lib/wolfbot-pixel-data.ts if not provided.

import { WOLFBOT_GRID, WOLFBOT_PALETTE } from '@/lib/wolfbot-pixel-data'

interface WolfBotIconProps {
  size?: number
  className?: string
  grid?: number[][]
  palette?: Record<string, string> | Record<number, string>
}

export default function WolfBotIcon({ size = 100, className, grid: gridProp, palette: paletteProp }: WolfBotIconProps) {
  const grid = gridProp ?? WOLFBOT_GRID
  // Palette keys from DB are strings; normalise to numbers for lookup
  const palette: Record<number, string> = paletteProp
    ? Object.fromEntries(Object.entries(paletteProp).map(([k, v]) => [Number(k), v as string]))
    : WOLFBOT_PALETTE

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
      {grid.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          if (cell === 1) return null
          const fill = palette[cell]
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
