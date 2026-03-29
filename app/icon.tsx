import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: '20%',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoData} width={380} height={380} alt="Wolfman" />
      </div>
    ),
    { width: 512, height: 512 },
  )
}
