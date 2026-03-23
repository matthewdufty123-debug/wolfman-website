import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/settings', '/api/'],
    },
    sitemap: 'https://wolfman.blog/sitemap.xml',
  }
}
