export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { posts, morningState, users } from '@/lib/db/schema'
import { and, eq, desc, sql } from 'drizzle-orm'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default async function MorningRitualPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params

  const ritual = ROUTINE_ICON_MAP[key]
  if (!ritual) notFound()

  const { Icon, label, description, color } = ritual

  // All posts where this ritual was completed (admin/Matthew's posts only — user posts are private)
  const completedPosts = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      date: posts.date,
      category: posts.category,
    })
    .from(morningState)
    .innerJoin(posts, eq(morningState.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(sql`(${morningState.routineChecklist}->>${key})::boolean = true`, eq(users.role, 'admin')))
    .orderBy(desc(posts.date))

  // Count completions in the last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10)

  const recentCount = completedPosts.filter(p => p.date >= cutoff).length

  return (
    <>
      <header className="ritual-header">
        {/* Icon */}
        <div className="ritual-header-icon" style={{ borderColor: color, background: `${color}18` }}>
          <Icon size={36} color={color} />
        </div>

        {/* Title */}
        <p className="ritual-header-eyebrow">Morning Ritual</p>
        <h1 className="ritual-header-title">{label}</h1>
        <p className="ritual-header-description">{description}</p>

        {/* 3-month stat */}
        <div className="ritual-header-stat">
          <span className="ritual-stat-count" style={{ color }}>{recentCount}</span>
          <span className="ritual-stat-label">
            {recentCount === 1 ? 'completion' : 'completions'} in the last 3 months
          </span>
        </div>
      </header>

      {completedPosts.length === 0 ? (
        <ul className="post-list">
          <li className="post-list-empty">No posts yet for this ritual.</li>
        </ul>
      ) : (
        <ul className="post-list">
          {completedPosts.map(post => (
            <li key={post.slug} className="post-list-item">
              <Link href={`/posts/${post.slug}`} className="post-list-link">
                <span className="post-list-date">{formatDate(post.date)}</span>
                <span className="post-list-title">{post.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ maxWidth: 640, margin: '2rem auto 0', padding: '0 1.5rem' }}>
        <Link href="/intentions" className="ritual-back-link">← All Morning Intentions</Link>
      </div>
    </>
  )
}
