export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { siteMetadata } from '@/lib/metadata'
import { deriveExcerpt } from '@/lib/posts'

export const metadata: Metadata = siteMetadata({
  title: 'Wolfman — Mindful Morning Journalling',
  description: 'A few honest minutes each morning can change the outlook of the day dramatically. Start your morning journalling practice with Wolfman.',
  path: '/',
})

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

async function getRecentPublicPosts() {
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
}

async function getUserPostCountToday(userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.date, today)))
  return row?.count ?? 0
}

export default async function HomePage() {
  const [session, recentPosts] = await Promise.all([
    auth(),
    getRecentPublicPosts(),
  ])

  const isLoggedIn = !!session?.user?.id
  let postedToday = false
  const username = session?.user?.username ?? null

  if (isLoggedIn && session.user.id) {
    const count = await getUserPostCountToday(session.user.id)
    postedToday = count > 0
  }

  // CTA button state
  let ctaHref = '/register'
  let ctaText = 'Register an account to start logging your private journals'
  if (isLoggedIn && postedToday && username) {
    ctaHref = `/${username}`
    ctaText = "Let's see your trends"
  } else if (isLoggedIn) {
    ctaHref = '/write'
    ctaText = 'Ready to set your intention?'
  }

  return (
    <main className="home-page">

      {/* Section 1 — Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <p className="home-hero-strapline">
            A few honest minutes each morning can change the outlook of the day dramatically.
          </p>
          <Link href={ctaHref} className="home-cta-btn">{ctaText}</Link>
        </div>
      </section>

      {/* Section 2 — The idea */}
      <section className="home-section home-section--idea">
        <div className="home-section-inner">
          <p className="home-eyebrow">The practice</p>
          <p className="home-idea-body">
            Every morning, you write what you intend for the day, note something you are
            genuinely grateful for, and name one thing you are actually great at. You log
            how your brain, body, happiness, and stress feel right now. You record which
            morning rituals you completed.
          </p>
          <p className="home-idea-supporting">
            The morning sets the day. Journalling sets the morning.
          </p>
        </div>
      </section>

      {/* Section 3 — How it works */}
      <section className="home-section home-section--how">
        <div className="home-section-inner">
          <p className="home-eyebrow">Three steps</p>
          <div className="home-steps">
            <div className="home-step">
              <p className="home-step-number">01</p>
              <p className="home-step-label">Write your intentions</p>
              <p className="home-step-body">
                What do you want from today? One honest paragraph. No performance.
              </p>
            </div>
            <div className="home-step">
              <p className="home-step-number">02</p>
              <p className="home-step-label">Log how you feel</p>
              <p className="home-step-body">
                Brain, body, happiness, stress — four honest scales before the day starts.
              </p>
            </div>
            <div className="home-step">
              <p className="home-step-number">03</p>
              <p className="home-step-label">Build your rituals</p>
              <p className="home-step-body">
                Track the morning habits that shape everything that follows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Your data is yours */}
      <section className="home-section home-section--data">
        <div className="home-section-inner">
          <p className="home-eyebrow">Your data</p>
          <h2 className="home-section-heading">You own everything you write here.</h2>
          <div className="home-data-commitments">
            <div className="home-commitment">
              <p className="home-commitment-title">We do not sell your data</p>
              <p className="home-commitment-body">Not now, not ever. Full stop.</p>
            </div>
            <div className="home-commitment">
              <p className="home-commitment-title">We do not share your data</p>
              <p className="home-commitment-body">Your entries are private by default. Only you can see them.</p>
            </div>
            <div className="home-commitment">
              <p className="home-commitment-title">Download or delete at any time</p>
              <p className="home-commitment-body">Your data is yours. Request it or remove it whenever you want.</p>
            </div>
            <div className="home-commitment">
              <p className="home-commitment-title">All data is encrypted</p>
              <p className="home-commitment-body">In transit and at rest. No exceptions.</p>
            </div>
          </div>
          <Link href="/data-policy" className="home-data-link">Read the full data policy →</Link>
        </div>
      </section>

      {/* Section 5 — Matthew */}
      <section className="home-section home-section--matthew">
        <div className="home-section-inner home-matthew-inner">
          <div className="home-matthew-photo-placeholder">
            <p className="home-matthew-photo-label">Matthew</p>
          </div>
          <div className="home-matthew-text">
            <p className="home-eyebrow">The builder</p>
            <h2 className="home-section-heading">Hi. I&apos;m Matthew.</h2>
            <p className="home-matthew-body">
              I am a data engineer, mountain biker, photographer, and wood carver based in the UK.
              I built this site because the morning journalling practice genuinely changed how I
              experience my days — and I wanted to share that, not as advice, but as a tool you
              can use for yourself.
            </p>
            <Link href="/about" className="home-data-link">Read my story →</Link>
          </div>
        </div>
      </section>

      {/* Section 6 — From the journal */}
      {recentPosts.length > 0 && (
        <section className="home-section home-section--journals">
          <div className="home-section-inner">
            <p className="home-eyebrow">From the journal</p>
            <h2 className="home-section-heading">The practice, in the wild.</h2>
            <div className="home-journal-cards">
              {recentPosts.map(post => {
                const url = post.authorUsername
                  ? `/${post.authorUsername}/${post.slug}`
                  : `/posts/${post.slug}`
                const authorName = post.authorDisplayName ?? post.authorName ?? post.authorUsername ?? 'Wolfman'
                return (
                  <Link key={post.slug} href={url} className="home-journal-card">
                    <p className="home-journal-card-meta">{authorName} · {formatDate(post.date)}</p>
                    <p className="home-journal-card-title">{post.title}</p>
                    {post.excerpt && (
                      <p className="home-journal-card-excerpt">{post.excerpt.slice(0, 120)}…</p>
                    )}
                  </Link>
                )
              })}
            </div>
            <Link href="/feed" className="home-data-link">Read all journals →</Link>
          </div>
        </section>
      )}

      {/* Section 7 — CTA repeat */}
      <section className="home-section home-section--cta">
        <div className="home-section-inner home-section-inner--centered">
          <p className="home-cta-repeat-line">Your first journal takes three minutes.</p>
          <Link href={ctaHref} className="home-cta-btn">{ctaText}</Link>
        </div>
      </section>

    </main>
  )
}
