import type { Metadata } from 'next'
import { getAllSlugsWithUsernames, getPostBySlug } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { PostContextSetter } from '@/lib/post-context'
import JournalTabs from '@/components/JournalTabs'
import { db } from '@/lib/db'
import { posts as postsTable, morningState, eveningReflection, dayScores, users as usersTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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

  // Fetch day data + post timestamps for DB-backed posts
  const [ms, er, ds, postRow] = post.id
    ? await Promise.all([
        db.select().from(morningState).where(eq(morningState.postId, post.id)).then(r => r[0] ?? null),
        db.select().from(eveningReflection).where(eq(eveningReflection.postId, post.id)).then(r => r[0] ?? null),
        db.select().from(dayScores).where(eq(dayScores.postId, post.id)).then(r => r[0] ?? null),
        db.select({ createdAt: postsTable.createdAt, updatedAt: postsTable.updatedAt })
           .from(postsTable).where(eq(postsTable.id, post.id)).then(r => r[0] ?? null),
      ])
    : [null, null, null, null]

  const postDates = postRow
    ? { createdAt: postRow.createdAt.toISOString(), updatedAt: postRow.updatedAt.toISOString() }
    : null

  return (
    <>
      <PostContextSetter postId={post.id ?? ''} authorId={post.authorId ?? null} />
      <JournalTabs
        post={post}
        username={username}
        author={author}
        morningState={ms ? {
          brainScale: ms.brainScale,
          bodyScale: ms.bodyScale,
          happyScale: ms.happyScale ?? null,
          routineChecklist: ms.routineChecklist as Record<string, boolean>,
        } : null}
        eveningReflection={er ? {
          reflection: er.reflection,
          wentToPlan: er.wentToPlan,
          dayRating: er.dayRating,
        } : null}
        dayScores={ds ? {
          scores: ds.scores as Record<string, number>,
          synthesis: ds.synthesis,
          dataCompleteness: ds.dataCompleteness,
        } : null}
        postDates={postDates}
        authorId={post.authorId ?? null}
      />
    </>
  )
}
