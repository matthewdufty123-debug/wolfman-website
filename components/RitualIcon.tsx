'use client'

/**
 * Renders an SVG ritual icon from the raw inner markup stored in the DB.
 *
 * The wrapping <svg> tag is added at render time so we control size/color.
 * Most icons use stroke; icons whose svgContent contains no stroke attributes
 * (e.g. animalLove paw print) are rendered as filled instead.
 *
 * Fallback: if svgContent is null/empty, shows a colored circle with the
 * first letter of the label.
 */
export default function RitualIcon({
  svgContent,
  color = 'currentColor',
  size = 18,
  label,
}: {
  svgContent: string | null
  color?: string
  size?: number
  label?: string
}) {
  if (!svgContent) {
    // Fallback: coloured circle with first letter
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 18 18"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="7" fill={`${color}22`} stroke={color} strokeWidth="1.5" />
        <text
          x="9"
          y="9"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="8"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
        >
          {(label ?? '?')[0].toUpperCase()}
        </text>
      </svg>
    )
  }

  // Detect fill-based icons: if the content has no line/path elements it's
  // a solid-fill icon (e.g. animalLove paw print). Simple and future-proof.
  const isFillIcon = !/<(line|path)\b/.test(svgContent)

  // Replace colour placeholders — "currentColor" in stored SVG becomes the actual color
  const colouredSvg = svgContent.replace(/currentColor/g, color)

  if (isFillIcon) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 18 18"
        fill={color}
        stroke="none"
        aria-hidden="true"
      >
        <g dangerouslySetInnerHTML={{ __html: colouredSvg }} />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <g dangerouslySetInnerHTML={{ __html: colouredSvg }} />
    </svg>
  )
}
