import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  const logoPath = join(process.cwd(), 'public/images/site_images/Grey Bronze LogoAsset 14300.png')
  const logoData = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          background: '#4A4A4A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: '#4A7FA5', display: 'flex' }} />

        {/* Wolf logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoData} width={160} height={160} alt="Wolfman" style={{ borderRadius: 80 }} />

        {/* Site name */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 80,
            fontWeight: 700,
            marginTop: 36,
            letterSpacing: '-0.02em',
            display: 'flex',
          }}
        >
          wolfman.blog
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#A0622A',
            fontSize: 30,
            marginTop: 18,
            display: 'flex',
          }}
        >
          Mindful living. Morning intentions.
        </div>

        {/* Bottom accent bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, background: '#4A7FA5', display: 'flex' }} />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
