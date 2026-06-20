export const dynamic = 'force-dynamic'

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

export default async function HomePage() {
  const recentPosts = await getRecentPublicPosts()

  return (
    <main className="min-h-screen">

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <WolfLogo size={80} className="mb-6 opacity-90" />
        <h1 className="font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-semibold text-[#4A4A4A] tracking-tight mb-4">
          Matthew Wolfman
        </h1>
        <p className="text-lg text-[#909090] max-w-md leading-relaxed">
          Data engineer. Mountain biker. Photographer. Mindful human.
        </p>
      </section>

      {/* ── Three link cards ── */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <Link
            href="/feed"
            className="group block rounded-lg border border-[#f0ebe6] bg-white p-6 transition-shadow hover:shadow-md"
          >
            <p className="font-[family-name:var(--font-inter)] text-sm font-semibold text-[#4A7FA5] mb-2 group-hover:text-[#3a6d8f]">
              The Journal
            </p>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              Daily morning intentions, written honestly.
            </p>
          </Link>

          <Link
            href="/about"
            className="group block rounded-lg border border-[#f0ebe6] bg-white p-6 transition-shadow hover:shadow-md"
          >
            <p className="font-[family-name:var(--font-inter)] text-sm font-semibold text-[#A0622A] mb-2 group-hover:text-[#8a5424]">
              About &amp; Career
            </p>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              Twenty-five years of building things with data.
            </p>
          </Link>

          <Link
            href="/shop"
            className="group block rounded-lg border border-[#f0ebe6] bg-white p-6 transition-shadow hover:shadow-md"
          >
            <p className="font-[family-name:var(--font-inter)] text-sm font-semibold text-[#4A4A4A] mb-2 group-hover:text-[#333]">
              The Shop
            </p>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              Photography, prints, and wellbeing.
            </p>
          </Link>
        </div>
      </section>

      {/* ── Recent journals ── */}
      {recentPosts.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-24">
          <p className="font-[family-name:var(--font-jetbrains)] text-xs tracking-widest uppercase text-[#A0622A] mb-3">
            From the journal
          </p>
          <div className="space-y-4 mb-6">
            {recentPosts.map(post => {
              const url = post.authorUsername
                ? `/${post.authorUsername}/${post.slug}`
                : `/posts/${post.slug}`
              const authorName = post.authorDisplayName ?? post.authorName ?? post.authorUsername ?? 'Wolfman'
              return (
                <Link
                  key={post.slug}
                  href={url}
                  className="block rounded-lg border border-[#f0ebe6] bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <p className="font-[family-name:var(--font-jetbrains)] text-xs text-[#909090] mb-1">
                    {authorName} · {formatDate(post.date)}
                  </p>
                  <p className="font-[family-name:var(--font-inter)] text-base font-medium text-[#4A4A4A] mb-1">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="text-sm text-[#909090] leading-relaxed">
                      {post.excerpt.slice(0, 120)}…
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
          <Link
            href="/feed"
            className="text-sm text-[#A0622A] hover:underline underline-offset-2"
          >
            Read all journals →
          </Link>
        </section>
      )}

    </main>
  )
}
