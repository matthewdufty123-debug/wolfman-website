import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { posts, morningState, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import EditPageClient from './EditPageClient'

// Parse post content back into the three sections
function parseContent(content: string): { intention: string; grateful: string; greatAt: string } {
  const sections: Record<string, string> = {}
  const blocks = content.split(/^## /m).filter(Boolean)
  for (const block of blocks) {
    const newline = block.indexOf('\n')
    if (newline === -1) continue
    const heading = block.slice(0, newline).trim().toLowerCase()
    const body = block.slice(newline + 1).trim()
    if (heading.includes('intention')) sections.intention = body
    else if (heading.includes('grateful')) sections.grateful = body
    else if (heading.includes('great')) sections.greatAt = body
  }
  return {
    intention: sections.intention ?? content,
    grateful: sections.grateful ?? '',
    greatAt: sections.greatAt ?? '',
  }
}

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [[post], [ms], [user]] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, id)),
    db.select().from(morningState).where(eq(morningState.postId, id)),
    db.select({ communityEnabled: users.communityEnabled, defaultPublic: users.defaultPublic, username: users.username })
      .from(users).where(eq(users.id, session.user.id)),
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
    morning: ms ? {
      brainScale: ms.brainScale,
      bodyScale: ms.bodyScale,
      happyScale: ms.happyScale ?? 3,
      routineChecklist: ms.routineChecklist as Record<string, boolean>,
    } : undefined,
  }

  return (
    <EditPageClient
      postId={id}
      initialData={initialData}
      communityEnabled={user?.communityEnabled ?? false}
      defaultPublic={user?.defaultPublic ?? false}
      initialIsPublic={post.isPublic}
      username={user?.username ?? null}
    />
  )
}
