import { Suspense } from 'react'
import type { Metadata } from 'next'
import type { Session } from 'next-auth'
import { getPostBySlug } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { PostContextSetter } from '@/lib/post-context'
import { db } from '@/lib/db'
import { users as usersTable, posts as postsTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

import JournalWithReviewSection from './_sections/JournalWithReviewSection'
import HowIShowedUpSection from './_sections/HowIShowedUpSection'
import MorningRitualsServerSection from './_sections/MorningRitualsServerSection'
import EveningSection from '@/components/journal/EveningSection'
import PostInfoNavSection from './_sections/PostInfoNavSection'
import WritingStatsSection from './_sections/WritingStatsSection'
import {
  Section1Skeleton,
  Section2Skeleton,
  Section3Skeleton,
  Section4Skeleton,
  Section5Skeleton,
} from './_sections/skeletons'

// Shared by the canonical static page (/[username]/[slug], session always
// null — anonymous readers, served from the CDN) and the dynamic /reader
// variant (session-aware — middleware rewrites logged-in users there).

export async function buildPostMetadata(username: string, slug: string): Promise<Metadata> {
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found — Wolfman' }
  const url = `https://wolfman.app/${username}/${post.slug}`
  return {
    title: `${post.title} — Wolfman`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: 'Wolfman',
      type: 'article',
      publishedTime: post.date,
      ...(post.image ? { images: [{ url: post.image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: post.image ? 'summary_large_image' : 'summary',
      title: post.title,
      description: post.excerpt,
      ...(post.image ? { images: [post.image] } : {}),
    },
    alternates: { canonical: url },
  }
}

export async function PostPageView({
  username,
  slug,
  session,
}: {
  username: string
  slug: string
  session: Session | null
}) {
  // ── Gate queries — must complete before any render ──────────────────────
  const post = await getPostBySlug(slug)

  if (!post) notFound()
  if (!post.authorId) notFound()

  const [author] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      displayName: usersTable.displayName,
      bio: usersTable.bio,
      avatar: usersTable.avatar,
      image: usersTable.image,
      username: usersTable.username,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.id, post.authorId))
    .limit(1)

  if (!author || author.username !== username) notFound()
  if (post.status === 'draft' && session?.user?.id !== post.authorId) notFound()
  if (author.role !== 'admin' && session?.user?.id !== post.authorId) notFound()

  // ── Derived values shared across sections ──────────────────────────────
  const userId = session?.user?.id ?? null
  const postId = post.id ?? ''
  const isOwner = userId != null && userId === post.authorId

  // Load evening reflection data (not on ProcessedPost type)
  const [eveningData] = postId
    ? await db.select({ eveningReflection: postsTable.eveningReflection, feelAboutToday: postsTable.feelAboutToday })
        .from(postsTable).where(eq(postsTable.id, postId)).limit(1)
    : [null]

  // ── Streaming layout — each section fetches its own data ───────────────
  return (
    <>
      <PostContextSetter postId={postId} authorId={post.authorId ?? null} />
      <div className="journal-scroll-page">
        <div className="journal-scroll-content">

          {/* Section 1: Journal text + WOLF|BOT review */}
          <Suspense fallback={<Section1Skeleton />}>
            <JournalWithReviewSection post={post} postId={postId} isOwner={isOwner} />
          </Suspense>

          {/* Section 2: How I Showed Up (morning scores + trend charts) */}
          <Suspense fallback={<Section2Skeleton />}>
            <HowIShowedUpSection postId={postId} authorId={post.authorId ?? ''} postDate={post.date ?? ''} />
          </Suspense>

          {/* Section 3: Morning Rituals (+ future analysis) */}
          <Suspense fallback={<Section3Skeleton />}>
            <MorningRitualsServerSection postId={postId} authorId={post.authorId ?? ''} postDate={post.date ?? ''} />
          </Suspense>

          {/* Evening Reflection */}
          {(eveningData?.eveningReflection || eveningData?.feelAboutToday != null || isOwner) && (
            <EveningSection
              postId={postId}
              isOwner={isOwner}
              reflection={eveningData?.eveningReflection ?? null}
              feelAboutToday={eveningData?.feelAboutToday ?? null}
            />
          )}

          {/* Section 5: Writing Stats */}
          <Suspense fallback={<Section5Skeleton />}>
            <WritingStatsSection
              authorId={post.authorId ?? ''}
              postDate={post.date ?? ''}
              isOwner={isOwner}
            />
          </Suspense>

          {/* Section 4: Post info + navigation */}
          <Suspense fallback={<Section4Skeleton />}>
            <PostInfoNavSection post={post} username={username} isOwner={isOwner} userId={userId} />
          </Suspense>

        </div>
      </div>
    </>
  )
}
