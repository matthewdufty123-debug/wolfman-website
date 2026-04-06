import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const SITE_URL = 'https://wolfman.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publishedPosts = await db
    .select({
      slug: posts.slug,
      updatedAt: posts.updatedAt,
      username: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.status, 'published')))

  const postUrls: MetadataRoute.Sitemap = publishedPosts
    .filter(p => p.username)
    .map(p => ({
      url: `${SITE_URL}/${p.username}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    }))

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/about`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/shop`,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${SITE_URL}/beta`,                    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/feedback`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/morning-ritual`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [...staticRoutes, ...postUrls]
}
