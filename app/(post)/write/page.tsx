import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import Link from 'next/link'
import WritePageClient from './WritePageClient'

export default async function WritePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user, drafts, [postCountRow]] = await Promise.all([
    db.select({ communityEnabled: users.communityEnabled, defaultPublic: users.defaultPublic, username: users.username })
      .from(users).where(eq(users.id, session.user.id)).then(r => r[0]),
    db.select({ id: posts.id, title: posts.title, date: posts.date, createdAt: posts.createdAt })
      .from(posts)
      .where(and(eq(posts.authorId, session.user.id), eq(posts.status, 'draft')))
      .orderBy(desc(posts.createdAt)),
    db.select({ total: count() })
      .from(posts)
      .where(and(eq(posts.authorId, session.user.id), eq(posts.status, 'published'))),
  ])

  const postCount = postCountRow?.total ?? 0

  return (
    <>
      <WritePageClient
        communityEnabled={user?.communityEnabled ?? false}
        defaultPublic={user?.defaultPublic ?? false}
        username={user?.username ?? null}
        showOnboarding={postCount < 3}
      />

      {drafts.length > 0 && (
        <div className="write-drafts">
          <p className="write-drafts-title">Your drafts</p>
          <ul className="write-drafts-list">
            {drafts.map(d => (
              <li key={d.id}>
                <Link href={`/edit/${d.id}`} className="write-draft-card">
                  <span className="write-draft-title">{d.title || 'Untitled'}</span>
                  <span className="write-draft-date">{d.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
