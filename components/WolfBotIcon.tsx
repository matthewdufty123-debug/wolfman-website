// WolfBotIcon — pixel-art SVG rendered from the official WOLF|BOT grid and palette.
// Update the GRID or PALETTE here when the design changes.

const PALETTE: Record<number, string> = {
  2: '#C2C2C2', // Main Fur
  3: '#2E2E2E', // Core Facial (dark)
  4: '#585858', // Alt Facial (mid-grey)
  5: '#4A90C4', // Outer Eye (steel blue)
  6: '#C6DDEA', // Inner Eye (pale blue)
  7: '#BB9040', // Tongue / Bronze
  8: '#E8A0B0', // Heart / Blush
  9: '#BF7E54', // Object / Copper
  10: '#A72525', // Angry
  // 1 = background — transparent, not rendered
}

const GRID = [
  [1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1], // row 1
  [1,1,1,1,2,4,2,1,1,1,1,1,1,1,1,1,1,1,2,4,2,1,1,1,1], // row 2
  [1,1,1,2,4,3,4,2,1,1,1,1,1,1,1,1,1,2,4,3,4,2,1,1,1], // row 3
  [1,1,1,2,3,3,3,2,1,1,1,1,1,1,1,1,1,2,3,3,3,2,1,1,1], // row 4
  [1,3,2,4,3,3,3,2,1,1,1,1,1,1,1,1,1,2,3,3,3,3,2,1,1], // row 5
  [3,2,4,2,4,1,1,4,2,1,1,1,1,1,1,1,2,4,1,1,1,2,4,2,1], // row 6
  [3,2,4,4,4,4,4,4,4,2,2,2,2,2,2,2,4,4,4,4,4,4,4,2,1], // row 7
  [2,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2], // row 8
  [2,4,4,4,9,9,9,9,9,9,9,4,4,4,9,9,9,9,9,9,9,4,4,4,2], // row 9
  [2,4,4,4,3,3,3,5,5,5,3,4,4,4,3,3,3,3,5,5,5,4,4,4,2], // row 10
  [1,2,4,4,3,3,3,5,5,5,3,4,4,4,3,3,3,3,5,5,5,4,4,2,1], // row 11
  [1,2,4,4,4,4,4,5,5,5,4,4,4,4,4,4,4,4,5,5,5,4,4,2,1], // row 12
  [1,1,2,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2,1,1], // row 13
  [1,1,2,4,4,4,4,4,4,2,2,2,2,2,2,2,4,4,4,4,4,4,2,1,1], // row 14
  [1,1,1,2,4,4,4,4,2,3,3,9,9,9,3,3,2,4,4,4,4,2,1,1,1], // row 15
  [1,1,1,2,4,4,4,2,2,2,3,9,9,9,3,2,2,2,4,4,4,2,1,1,1], // row 16
  [1,1,1,1,2,4,2,2,4,4,2,2,2,2,2,4,4,2,2,4,2,1,1,1,1], // row 17
  [1,1,1,1,2,4,2,4,4,4,4,4,4,4,4,4,4,2,2,4,2,1,1,1,1], // row 18
  [1,1,1,1,1,2,2,4,4,4,4,4,4,4,4,4,4,4,2,2,1,1,1,1,1], // row 19
  [1,1,1,1,1,2,4,4,4,9,9,9,9,9,9,9,4,4,4,2,1,1,1,1,1], // row 20
  [1,1,1,1,1,1,2,4,4,9,9,9,9,9,9,9,4,4,2,1,1,1,1,1,1], // row 21
  [1,1,1,1,1,1,2,4,4,3,3,3,3,3,3,3,4,4,2,1,1,1,1,1,1], // row 22
  [1,1,1,1,1,1,2,4,4,3,3,3,3,3,3,3,4,4,2,1,1,1,1,1,1], // row 23
  [1,1,1,1,1,1,1,2,4,4,4,4,4,4,4,4,4,2,1,1,1,1,1,1,1], // row 24
  [1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1], // row 25
]

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
      {GRID.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          if (cell === 1) return null
          const fill = PALETTE[cell]
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
