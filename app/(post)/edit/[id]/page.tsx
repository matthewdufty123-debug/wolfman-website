import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { posts, morningState, users, wolfbotReviews } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getActiveRituals } from '@/lib/rituals'
import EditPageClient from './EditPageClient'
import { parseContent } from '@/lib/parse-content'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [[post], [ms], [user], [wbr], activeRituals] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, id)),
    db.select().from(morningState).where(eq(morningState.postId, id)),
    db.select({ communityEnabled: users.communityEnabled, defaultPublic: users.defaultPublic, username: users.username })
      .from(users).where(eq(users.id, session.user.id)),
    db.select({ id: wolfbotReviews.id }).from(wolfbotReviews).where(eq(wolfbotReviews.postId, id)),
    getActiveRituals(),
  ])
  if (!post) notFound()
  if (post.authorId !== session.user.id && session.user.role !== 'admin') notFound()

  const { intention, grateful, greatAt } = parseContent(post.content)

  const initialData = {
    title: post.title,
    date: post.date,
    intention,
    grateful,
    greatAt,
    image: post.image ?? null,
    imageCaption: post.imageCaption ?? null,
    videoId: post.videoId ?? null,
    eveningReflection: post.eveningReflection ?? '',
    feelAboutToday: post.feelAboutToday ?? null,
    morning: ms ? {
      brainScale: ms.brainScale,
      bodyScale: ms.bodyScale,
      happyScale: ms.happyScale ?? 3,
      stressScale: ms.stressScale ?? 3,
      routineChecklist: ms.routineChecklist as Record<string, boolean>,
    } : undefined,
  }

  const ritualDefs = activeRituals.map(r => ({
    key: r.key, label: r.label, description: r.description,
    category: r.category, color: r.color, svgContent: r.svgContent,
    sortOrder: r.sortOrder,
  }))

  return (
    <EditPageClient
      postId={id}
      initialData={initialData}
      initialTitleSuggestionsUsed={post.titleSuggestionsUsed ?? 0}
      communityEnabled={user?.communityEnabled ?? false}
      defaultPublic={user?.defaultPublic ?? false}
      initialIsPublic={post.isPublic}
      username={user?.username ?? null}
      wolfbotReviewExists={!!wbr}
      rituals={ritualDefs}
    />
  )
}
