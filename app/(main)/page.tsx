// ISR — the three recent journals don't change per-request. Publishing
// revalidates this page on demand via revalidatePost().
export const revalidate = 300

import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { siteMetadata } from '@/lib/metadata'
import { deriveExcerpt } from '@/lib/posts'
import WolfLogo from '@/components/WolfLogo'

export const metadata: Metadata = siteMetadata({
  title: 'Matthew Wolfman',
  description: 'Data engineer, mountain biker, photographer, and mindful human. Morning journals, career timeline, and photography shop.',
  path: '/',
})

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function trimExcerpt(text: string, max = 140) {
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

async function getRecentPublicPosts() {
  try {
    const rows = await db
      .select({
        slug: posts.slug,
        title: posts.title,
        date: posts.date,
        excerpt: posts.excerpt,
        content: posts.content,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorName: users.name,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(
        eq(posts.status, 'published'),
        eq(posts.isPublic, true),
        eq(users.communityEnabled, true),
      ))
      .orderBy(desc(posts.date))
      .limit(3)

    return rows.map(r => ({
      ...r,
      excerpt: r.excerpt || deriveExcerpt(r.content) || null,
    }))
  } catch {
    // Fail soft — keeps builds green without a database and the page
    // rendering through transient DB errors; ISR refills within 5 min
    return []
  }
}

export default async function HomePage() {
  const recentPosts = await getRecentPublicPosts()

  return (
    <main className="home-page">

      {/* ── Hero ── */}
      <section className="home-hero">
        <WolfLogo size={84} priority className="home-hero-logo" />
        <h1 className="home-name">Matthew Wolfman</h1>
        <p className="home-tagline">
          Data engineer. Mountain biker. Photographer. Mindful human.
        </p>
        <div className="home-cta-row">
          <Link href="/feed" className="home-cta">Read the journal</Link>
          <Link href="/career" className="home-cta-quiet">The story so far →</Link>
        </div>
      </section>

      {/* ── From the journal — the words come first ── */}
      {recentPosts.length > 0 && (
        <section className="home-journal">
          <p className="home-eyebrow">From the journal</p>
          <ul className="home-journal-list">
            {recentPosts.map(post => {
              const url = post.authorUsername
                ? `/${post.authorUsername}/${post.slug}`
                : `/posts/${post.slug}`
              const authorName = post.authorDisplayName ?? post.authorName ?? post.authorUsername ?? 'Wolfman'
              return (
                <li key={post.slug} className="home-journal-row">
                  <Link href={url} className="home-journal-item">
                    <p className="home-journal-meta">{authorName} · {formatDate(post.date)}</p>
                    <h2 className="home-journal-title">{post.title}</h2>
                    {post.excerpt && (
                      <p className="home-journal-excerpt">{trimExcerpt(post.excerpt)}</p>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="home-more-row">
            <Link href="/feed" className="home-more">Read all journals →</Link>
          </div>
        </section>
      )}

      {/* ── Three doors ── */}
      <section className="home-doors">
        <Link href="/feed" className="home-door">
          <span className="home-door-label home-door-label--journal">The Journal</span>
          <span className="home-door-desc">Daily morning intentions, written honestly.</span>
        </Link>
        <Link href="/career" className="home-door">
          <span className="home-door-label home-door-label--career">Career</span>
          <span className="home-door-desc">Twenty-five years of building things with data.</span>
        </Link>
        <Link href="/shop" className="home-door">
          <span className="home-door-label home-door-label--shop">The Shop</span>
          <span className="home-door-desc">Photography, prints, and wellbeing.</span>
        </Link>
      </section>

    </main>
  )
}
