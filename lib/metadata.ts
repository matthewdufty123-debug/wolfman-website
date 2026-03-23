import type { Metadata } from 'next'

const SITE_URL = 'https://wolfman.blog'
const SITE_NAME = 'Wolfman'
const DEFAULT_DESCRIPTION = 'Mindful living. Morning intentions. Matthew Wolfman.'

export function siteMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image,
  type = 'website',
}: {
  title: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
}): Metadata {
  const url = `${SITE_URL}${path}`
  const fullTitle = `${title} — ${SITE_NAME}`

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: { canonical: url },
  }
}

// For pages that must not appear in search results
export function noindexMetadata(title: string): Metadata {
  return {
    title: `${title} — ${SITE_NAME}`,
    robots: { index: false, follow: false },
  }
}
