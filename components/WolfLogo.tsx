'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTheme } from './ThemeProvider'

const LOGO_DARK = '/images/site_images/White Bronze LogoAsset 12300.png'
const LOGO_LIGHT = '/images/site_images/Grey Bronze LogoAsset 14300.png'

interface WolfLogoProps {
  size?: number
  className?: string
  style?: React.CSSProperties
  priority?: boolean
}

export default function WolfLogo({ size = 64, className, style, priority = false }: WolfLogoProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Before mount: always render the dark logo (matches the server-rendered default and
  // the flash-prevention script's default). This prevents a hydration mismatch.
  // After mount: switch to whichever logo matches the actual theme.
  const src = mounted ? (theme === 'light' ? LOGO_LIGHT : LOGO_DARK) : LOGO_DARK

  return (
    <Image
      src={src}
      alt="Wolfman"
      width={size}
      height={size}
      className={className}
      style={style}
      priority={priority}
      unoptimized
    />
  )
}
