import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getPostBySlug } from '@/lib/posts'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function PostOgImage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params
  const post = await getPostBySlug(slug)

  const logoPath = join(process.cwd(), 'public/images/site_images/Grey Bronze LogoAsset 14300.png')
  const logoData = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`

  const title = post?.title ?? 'wolfman.blog'
  const displayTitle = title.length > 90 ? title.slice(0, 87) + '…' : title
  const titleSize = displayTitle.length > 60 ? 52 : displayTitle.length > 40 ? 62 : 72

  return new ImageResponse(
    (
      <div
        style={{
          background: '#3C3C3C',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '0 88px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          justifyContent: 'center',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: '#4A7FA5', display: 'flex' }} />

        {/* Header row: logo + site name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 56 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoData} width={56} height={56} alt="Wolfman" style={{ borderRadius: 28 }} />
          <span style={{ color: '#909090', fontSize: 24, letterSpacing: '0.04em', display: 'flex' }}>
            wolfman.blog
          </span>
        </div>

        {/* Post title */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 980,
          }}
        >
          {displayTitle}
        </div>

        {/* Author */}
        <div style={{ color: '#A0622A', fontSize: 26, marginTop: 36, display: 'flex' }}>
          {username}
        </div>

        {/* Bottom accent bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, background: '#4A7FA5', display: 'flex' }} />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
