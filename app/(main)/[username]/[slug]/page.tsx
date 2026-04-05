import type { Metadata } from 'next'
import { getAllSlugsWithUsernames, getPostBySlug } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { PostContextSetter } from '@/lib/post-context'
import JournalPage from '@/components/JournalPage'
import { db } from '@/lib/db'
import { posts as postsTable, morningState, dayScores, users as usersTable, wolfbotReviews as wolfbotReviewsTable, wolfbotConfig } from '@/lib/db/schema'
import { eq, gt, lt, and, or, desc, asc } from 'drizzle-orm'

// Allow slugs not in generateStaticParams to be dynamically rendered (posts published after a build)
export const dynamicParams = true

export async function generateStaticParams() {
  const pairs = await getAllSlugsWithUsernames()
  return pairs
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string; slug: string }> }
): Promise<Metadata> {
  const { username, slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found — Wolfman' }
  const url = `https://wolfman.blog/${username}/${post.slug}`
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PostPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params

  const [post, session] = await Promise.all([getPostBySlug(slug), auth()])

  if (!post) notFound()

  // Guard against posts with no author
  if (!post.authorId) notFound()

  // Fetch author info and verify the URL username matches
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

  // Draft posts are only visible to their author
  if (post.status === 'draft' && session?.user?.id !== post.authorId) notFound()

  // Non-admin users' posts are private — only the author can view them
  if (author.role !== 'admin' && session?.user?.id !== post.authorId) notFound()

  const userId = session?.user?.id ?? null

  // Fetch morning state, day scores, post timestamps, and adjacent posts
  const [ms, ds, postRow, wbr, promptVersionRow, pixelGridRow, pixelPaletteRow] = post.id
    ? await Promise.all([
        db.select().from(morningState).where(eq(morningState.postId, post.id)).then(r => r[0] ?? null),
        db.select().from(dayScores).where(eq(dayScores.postId, post.id)).then(r => r[0] ?? null),
        db.select({
          createdAt: postsTable.createdAt,
          updatedAt: postsTable.updatedAt,
          eveningReflection: postsTable.eveningReflection,
          feelAboutToday: postsTable.feelAboutToday,
        })
          .from(postsTable)
          .where(eq(postsTable.id, post.id))
          .then(r => r[0] ?? null),
        db.select({
          review:        wolfbotReviewsTable.review,
          reviewRating:  wolfbotReviewsTable.reviewRating,
          reviewHelpful: wolfbotReviewsTable.reviewHelpful,
          reviewSassy:   wolfbotReviewsTable.reviewSassy,
        })
          .from(wolfbotReviewsTable)
          .where(eq(wolfbotReviewsTable.postId, post.id))
          .then(r => r[0] ?? null),
        db.select({ value: wolfbotConfig.value })
          .from(wolfbotConfig)
          .where(eq(wolfbotConfig.key, 'prompt_version'))
          .then(r => r[0] ?? null),
        db.select({ value: wolfbotConfig.value })
          .from(wolfbotConfig)
          .where(eq(wolfbotConfig.key, 'pixel_grid'))
          .then(r => r[0] ?? null),
        db.select({ value: wolfbotConfig.value })
          .from(wolfbotConfig)
          .where(eq(wolfbotConfig.key, 'pixel_palette'))
          .then(r => r[0] ?? null),
      ])
    : [null, null, null, null, null, null, null]

  const promptVersion = (promptVersionRow?.value as number) ?? 1
  const pixelGrid    = pixelGridRow?.value    ? (pixelGridRow.value    as number[][])           : undefined
  const pixelPalette = pixelPaletteRow?.value ? (pixelPaletteRow.value as Record<string,string>) : undefined

  const postDates = postRow
    ? { createdAt: postRow.createdAt.toISOString(), updatedAt: postRow.updatedAt.toISOString() }
    : null

  // Fetch adjacent posts for swipe navigation
  const visibilityFilter = userId
    ? or(
        and(eq(postsTable.status, 'published'), eq(postsTable.isPublic, true)),
        eq(postsTable.authorId, userId)
      )
    : and(eq(postsTable.status, 'published'), eq(postsTable.isPublic, true))

  const currentCreatedAt = postRow?.createdAt ?? new Date()

  const [prevRow, nextRow] = await Promise.all([
    db.select({ slug: postsTable.slug, username: usersTable.username })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .where(and(visibilityFilter, gt(postsTable.createdAt, currentCreatedAt)))
      .orderBy(asc(postsTable.createdAt))
      .limit(1)
      .then(r => r[0] ?? null),
    db.select({ slug: postsTable.slug, username: usersTable.username })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .where(and(visibilityFilter, lt(postsTable.createdAt, currentCreatedAt)))
      .orderBy(desc(postsTable.createdAt))
      .limit(1)
      .then(r => r[0] ?? null),
  ])

  const prevPost = prevRow?.username ? { slug: prevRow.slug, username: prevRow.username } : null
  const nextPost = nextRow?.username ? { slug: nextRow.slug, username: nextRow.username } : null

  return (
    <>
      <PostContextSetter postId={post.id ?? ''} authorId={post.authorId ?? null} />
      <JournalPage
        post={post}
        username={username}
        author={author}
        morningState={ms ? {
          brainScale: ms.brainScale,
          bodyScale: ms.bodyScale,
          happyScale: ms.happyScale ?? null,
          stressScale: ms.stressScale ?? null,
          routineChecklist: ms.routineChecklist as Record<string, boolean>,
        } : null}
        eveningReflection={postRow?.eveningReflection ?? null}
        feelAboutToday={postRow?.feelAboutToday ?? null}
        dayScores={ds ? {
          scores: ds.scores as Record<string, number>,
          synthesis: ds.synthesis,
          dataCompleteness: ds.dataCompleteness,
        } : null}
        postDates={postDates}
        authorId={post.authorId ?? null}
        prevPost={prevPost}
        nextPost={nextPost}
        wolfbotReviews={wbr}
        promptVersion={promptVersion}
        pixelGrid={pixelGrid}
        pixelPalette={pixelPalette}
      />
    </>
  )
}
