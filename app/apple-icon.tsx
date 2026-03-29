import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '22%',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoData} width={136} height={136} alt="Wolfman" />
      </div>
    ),
    { width: 180, height: 180 },
  )
}
