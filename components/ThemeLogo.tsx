/**
 * ThemeLogo — renders the Wolfman wordmark logo in the correct variant
 * for the current theme, switching purely via CSS (no JS flash).
 *
 * Dark / Cool themes → Grey Bronze Full with LogoAsset 15 (grey tint)
 * Light / Warm themes → White Bronze with LogoAsset 13 (white/light)
 *
 * Both images are rendered; CSS hides the inactive one based on
 * the [data-theme] attribute set on <html> before first paint.
 */

import Image from 'next/image'

interface ThemeLogoProps {
  className?: string
}

export default function ThemeLogo({ className }: ThemeLogoProps) {
  return (
    <div className={`theme-logo-wrap${className ? ` ${className}` : ''}`}>
      {/* Dark / Cool themes */}
      <Image
        src="/images/site_images/Grey Bronze Full with LogoAsset 151000.png"
        alt="Wolfman"
        width={1000}
        height={300}
        className="theme-logo theme-logo--dark"
        priority
        unoptimized
      />
      {/* Light / Warm themes */}
      <Image
        src="/images/site_images/White Bronze with LogoAsset 131000.png"
        alt="Wolfman"
        width={1000}
        height={300}
        className="theme-logo theme-logo--light"
        priority
        unoptimized
      />
    </div>
  )
}
