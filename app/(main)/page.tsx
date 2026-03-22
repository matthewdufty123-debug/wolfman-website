export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { posts, morningState, users } from '@/lib/db/schema'
import { and, desc, eq, inArray } from 'drizzle-orm'
import AnimatedRoutineIcons from '@/components/AnimatedRoutineIcons'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function Avatar({ src, name, size = 28 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#4A7FA5', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700,
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}>
      {initials}
    </div>
  )
}

type FeedPost = {
  id: string
  slug: string
  title: string
  date: string
  excerpt: string | null
  status: string
  authorId: string | null
  authorUsername: string | null
  authorName: string | null
  authorDisplayName: string | null
  authorAvatar: string | null
  authorImage: string | null
  checklist?: Record<string, boolean>
}

function FeedCard({ post, showAuthor }: { post: FeedPost; showAuthor: boolean }) {
  const authorName = post.authorDisplayName ?? post.authorName ?? post.authorUsername ?? 'Unknown'
  const avatarSrc = post.authorAvatar ?? post.authorImage ?? null
  const url = post.authorUsername ? `/${post.authorUsername}/${post.slug}` : `/posts/${post.slug}`
  const isDraft = post.status === 'draft'

  return (
    <article className="feed-card">
      {showAuthor && post.authorUsername && (
        <Link href={`/${post.authorUsername}`} className="feed-card-author">
          <Avatar src={avatarSrc} name={authorName} size={24} />
          <span className="feed-card-author-name">{authorName}</span>
        </Link>
      )}
      <Link href={isDraft ? `/edit/${post.id}` : url} className="feed-card-link">
        <span className="feed-card-date">
          {formatDate(post.date)}
          {isDraft && <span className="feed-card-draft-badge">draft</span>}
        </span>
        <p className="feed-card-title">{post.title || 'Untitled'}</p>
        {post.excerpt && (
          <p className="feed-card-excerpt">{post.excerpt.slice(0, 160)}</p>
        )}
      </Link>
      {post.checklist && (
        <div className="feed-card-rituals">
          <AnimatedRoutineIcons checklist={post.checklist} size={16} />
        </div>
      )}
    </article>
  )
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const isMine = view === 'mine'
  const session = await auth()

  if (isMine && !session?.user?.id) redirect('/login')

  let feedPosts: FeedPost[] = []

  if (isMine && session?.user?.id) {
    const rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        date: posts.date,
        excerpt: posts.excerpt,
        status: posts.status,
        authorId: posts.authorId,
        authorUsername: users.username,
        authorName: users.name,
        authorDisplayName: users.displayName,
        authorAvatar: users.avatar,
        authorImage: users.image,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.authorId, session.user.id))
      .orderBy(desc(posts.date))

    const ids = rows.map(r => r.id)
    const states = ids.length > 0
      ? await db.select().from(morningState).where(inArray(morningState.postId, ids))
      : []
    const stateMap = new Map(states.map(s => [s.postId, s]))

    feedPosts = rows.map(r => ({
      ...r,
      checklist: stateMap.get(r.id)?.routineChecklist as Record<string, boolean> | undefined,
    }))
  } else {
    // Community: admin-role (Matthew's) published journals — P1 scope
    const rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        date: posts.date,
        excerpt: posts.excerpt,
        status: posts.status,
        authorId: posts.authorId,
        authorUsername: users.username,
        authorName: users.name,
        authorDisplayName: users.displayName,
        authorAvatar: users.avatar,
        authorImage: users.image,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(posts.status, 'published'), eq(users.role, 'admin')))
      .orderBy(desc(posts.date))

    const ids = rows.map(r => r.id)
    const states = ids.length > 0
      ? await db.select().from(morningState).where(inArray(morningState.postId, ids))
      : []
    const stateMap = new Map(states.map(s => [s.postId, s]))

    feedPosts = rows.map(r => ({
      ...r,
      checklist: stateMap.get(r.id)?.routineChecklist as Record<string, boolean> | undefined,
    }))
  }

  return (
    <main className="feed-page">
      <div className="feed-tabs">
        <Link href="/" className={`feed-tab${!isMine ? ' feed-tab--active' : ''}`}>
          Community
        </Link>
        <Link href="/?view=mine" className={`feed-tab${isMine ? ' feed-tab--active' : ''}`}>
          My Journals
        </Link>
      </div>

      {feedPosts.length === 0 ? (
        <div className="feed-empty">
          {isMine ? (
            <>
              <p className="feed-empty-headline">Your journal is waiting.</p>
              <p className="feed-empty-body">
                Write your first morning intention and it will appear here.
              </p>
              <Link href="/write" className="feed-empty-link">Write your first journal →</Link>
            </>
          ) : (
            <p className="feed-empty-headline">No journals yet.</p>
          )}
        </div>
      ) : (
        <ul className="feed-list">
          {feedPosts.map(post => (
            <li key={post.id}>
              <FeedCard post={post} showAuthor={!isMine} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
