export const dynamic = 'force-dynamic'

import { getAllPosts } from '@/lib/posts'
import { db } from '@/lib/db'
import { morningState } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'
import Link from 'next/link'
import AnimatedRoutineIcons from '@/components/AnimatedRoutineIcons'

const CATEGORY_LABELS: Record<string, string> = {
  'morning-intention': 'Morning Intention',
  'morning-walk':      'Morning Walk with Matthew',
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default async function IntentionsPage() {
  const posts = await getAllPosts()

  // Fetch morning states for all DB-backed posts in a single query
  const dbPostIds = posts.filter(p => p.id).map(p => p.id!)
  const morningStates = dbPostIds.length > 0
    ? await db.select().from(morningState).where(inArray(morningState.postId, dbPostIds))
    : []
  const morningStateMap = new Map(morningStates.map(ms => [ms.postId, ms]))

  return (
    <>
      <header className="intentions-header">
        <h1 className="intentions-title">Morning Intentions</h1>
      </header>

      {posts.length === 0 ? (
        <ul className="post-list">
          <li className="post-list-empty">No posts yet.</li>
        </ul>
      ) : (
        <ul className="post-list">
          {posts.map((post) => {
            const ms = post.id ? morningStateMap.get(post.id) : undefined
            const checklist = ms?.routineChecklist as Record<string, boolean> | undefined

            return (
              <li key={post.slug} className="post-list-item">
                <Link href={`/posts/${post.slug}`} className="post-list-link">
                  <span className="post-list-date">{formatDate(post.date)}</span>
                  <span className="post-list-title">{post.title}</span>
                  {checklist && (
                    <span className="post-list-routine">
                      <AnimatedRoutineIcons checklist={checklist} size={20} />
                    </span>
                  )}
                  <span className="post-list-category">{CATEGORY_LABELS[post.category] ?? post.category}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
