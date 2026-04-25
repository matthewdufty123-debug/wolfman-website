import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { posts, morningState, users, wolfbotReviews } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getActiveRituals } from '@/lib/rituals'
import EditPageClient from './EditPageClient'
import { getJournalSections, getScalesForPost } from '@/lib/db/queries'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [[post], [ms], [user], [wbr], activeRituals, sections, scales] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, id)),
    db.select().from(morningState).where(eq(morningState.postId, id)),
    db.select({ communityEnabled: users.communityEnabled, defaultPublic: users.defaultPublic, username: users.username })
      .from(users).where(eq(users.id, session.user.id)),
    db.select({ id: wolfbotReviews.id }).from(wolfbotReviews).where(eq(wolfbotReviews.postId, id)),
    getActiveRituals(),
    getJournalSections(id),
    getScalesForPost(id),
  ])
  if (!post) notFound()
  if (post.authorId !== session.user.id && session.user.role !== 'admin') notFound()

  const initialData = {
    title: post.title,
    date: post.date,
    intention: sections.intention,
    grateful: sections.gratitude,
    greatAt: sections.greatAt,
    image: post.image ?? null,
    imageCaption: post.imageCaption ?? null,
    videoId: post.videoId ?? null,
    eveningReflection: sections.reflection || post.eveningReflection || '',
    feelAboutToday: post.feelAboutToday ?? null,
    morning: ms ? {
      brainScale: scales.brainScale ?? ms.brainScale,
      bodyScale: scales.bodyScale ?? ms.bodyScale,
      happyScale: scales.happyScale ?? ms.happyScale ?? 3,
      stressScale: scales.stressScale ?? ms.stressScale ?? 3,
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
