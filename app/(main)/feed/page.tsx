export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'

export const metadata: Metadata = siteMetadata({
  title: 'Journal Feed',
  description: 'Daily morning intentions from Matthew Wolfman and the Wolfman community — mindful living, honest reflection, and the small moments that make a life.',
  path: '/feed',
})

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { posts, morningState, users, wolfbotReviews } from '@/lib/db/schema'
import { and, desc, eq, inArray } from 'drizzle-orm'
import AnimatedRoutineIcons from '@/components/AnimatedRoutineIcons'
import { deriveExcerpt } from '@/lib/posts'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function Avatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
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

// 1–8 → two-word band per scale type
const SCALE_WORDS: Record<'happy' | 'body' | 'brain', string[]> = {
  happy: ['Lost',    'Lost',    'Steady',  'Steady',  'Good',    'Good',    'Joyful',  'Joyful'],
  body:  ['Drained', 'Drained', 'Moving',  'Moving',  'Charged', 'Charged', 'Buzzing', 'Buzzing'],
  brain: ['Silent',  'Silent',  'Waking',  'Waking',  'Sharp',   'Sharp',   'Manic',   'Manic'],
}

function scaleWord(val: number | null, type: keyof typeof SCALE_WORDS): string | null {
  if (!val || val < 1 || val > 8) return null
  return SCALE_WORDS[type][val - 1]
}

function scaleColour(val: number | null): string {
  if (!val) return '#909090'
  if (val <= 2) return '#909090'
  if (val <= 4) return '#4A7FA5'
  if (val <= 6) return '#A0622A'
  return '#3AB87A'
}

type FeedPost = {
  id: string
  slug: string
  title: string
  date: string
  excerpt: string | null
  image: string | null
  wordCountTotal: number | null
  wolfbotReviewed: boolean
  status: string
  authorId: string | null
  authorUsername: string | null
  authorName: string | null
  authorDisplayName: string | null
  authorAvatar: string | null
  authorImage: string | null
  checklist?: Record<string, boolean>
  happyScale: number | null
  bodyScale: number | null
  brainScale: number | null
}

function FeedCard({ post, showAuthor }: { post: FeedPost; showAuthor: boolean }) {
  const authorName = post.authorDisplayName ?? post.authorName ?? post.authorUsername ?? 'Unknown'
  const avatarSrc = post.authorAvatar ?? post.authorImage ?? null
  const url = post.authorUsername ? `/${post.authorUsername}/${post.slug}` : `/posts/${post.slug}`
  const isDraft = post.status === 'draft'
  const cardUrl = isDraft ? `/edit/${post.id}` : url

  const moodWord  = scaleWord(post.happyScale, 'happy')
  const bodyWord  = scaleWord(post.bodyScale,  'body')
  const brainWord = scaleWord(post.brainScale, 'brain')
  const hasScales = !!(moodWord || bodyWord || brainWord)

  const completedRituals = post.checklist
    ? Object.values(post.checklist).filter(Boolean).length
    : 0
  const hasRituals = !!post.checklist && completedRituals > 0

  return (
    <article className="feed-card">

      {/* ── Header: avatar + name + date ── */}
      {showAuthor && post.authorUsername ? (
        <Link href={`/${post.authorUsername}`} className="feed-card-author-link">
          <Avatar src={avatarSrc} name={authorName} size={40} />
          <div className="feed-card-author-info">
            <span className="feed-card-author-name">{authorName}</span>
            <span className="feed-card-meta-date">
              {formatDate(post.date)}
              {isDraft && <span className="feed-card-draft-badge">draft</span>}
            </span>
          </div>
        </Link>
      ) : (
        <div className="feed-card-date-solo">
          {formatDate(post.date)}
          {isDraft && <span className="feed-card-draft-badge">draft</span>}
        </div>
      )}

      {/* ── Title ── */}
      <Link href={cardUrl} className="feed-card-title-link">
        <p className="feed-card-title">{post.title || 'Untitled'}</p>
      </Link>

      {/* ── Scales strip ── */}
      {hasScales && (
        <div className="feed-card-scales">
          {moodWord && (
            <div className="feed-card-scale-pill">
              <span className="feed-card-scale-label">MOOD</span>
              <span className="feed-card-scale-word" style={{ color: scaleColour(post.happyScale) }}>{moodWord}</span>
            </div>
          )}
          {bodyWord && (
            <div className="feed-card-scale-pill">
              <span className="feed-card-scale-label">BODY</span>
              <span className="feed-card-scale-word" style={{ color: scaleColour(post.bodyScale) }}>{bodyWord}</span>
            </div>
          )}
          {brainWord && (
            <div className="feed-card-scale-pill">
              <span className="feed-card-scale-label">BRAIN</span>
              <span className="feed-card-scale-word" style={{ color: scaleColour(post.brainScale) }}>{brainWord}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Photo / fallback ── */}
      <Link href={cardUrl} className="feed-card-media-link">
        <div className="feed-card-media">
          {post.image
            ? <img src={post.image} alt={post.title} className="feed-card-photo" />
            : <div className="feed-card-photo-fallback" />
          }
        </div>
      </Link>

      {/* ── Word count ── */}
      {post.wordCountTotal ? (
        <div className="feed-card-wordcount">
          <span className="feed-card-wordcount-number">{post.wordCountTotal}</span>
          <span className="feed-card-wordcount-label">words</span>
        </div>
      ) : null}

      {/* ── Footer: rituals + WOLF|BOT badge ── */}
      {(hasRituals || post.wolfbotReviewed) && (
        <div className="feed-card-footer">
          {hasRituals && (
            <div className="feed-card-rituals">
              <AnimatedRoutineIcons checklist={post.checklist!} size={14} />
              <span className="feed-card-ritual-count">{completedRituals}/10</span>
            </div>
          )}
          {post.wolfbotReviewed && (
            <span className="feed-card-wolfbot-badge">WOLF|BOT ✓</span>
          )}
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
        content: posts.content,
        image: posts.image,
        wordCountTotal: posts.wordCountTotal,
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
    const [states, reviews] = ids.length > 0
      ? await Promise.all([
          db.select().from(morningState).where(inArray(morningState.postId, ids)),
          db.select({ postId: wolfbotReviews.postId }).from(wolfbotReviews).where(inArray(wolfbotReviews.postId, ids)),
        ])
      : [[], []]

    const stateMap   = new Map(states.map(s => [s.postId, s]))
    const reviewedIds = new Set(reviews.map(r => r.postId))

    feedPosts = rows.map(({ content, ...r }) => ({
      ...r,
      excerpt: r.excerpt || deriveExcerpt(content) || null,
      checklist: stateMap.get(r.id)?.routineChecklist as Record<string, boolean> | undefined,
      happyScale: stateMap.get(r.id)?.happyScale ?? null,
      bodyScale:  stateMap.get(r.id)?.bodyScale  ?? null,
      brainScale: stateMap.get(r.id)?.brainScale ?? null,
      wolfbotReviewed: reviewedIds.has(r.id),
    }))
  } else {
    const rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        date: posts.date,
        excerpt: posts.excerpt,
        content: posts.content,
        image: posts.image,
        wordCountTotal: posts.wordCountTotal,
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
      .where(and(
        eq(posts.status, 'published'),
        eq(posts.isPublic, true),
        eq(users.communityEnabled, true),
      ))
      .orderBy(desc(posts.date))

    const ids = rows.map(r => r.id)
    const [states, reviews] = ids.length > 0
      ? await Promise.all([
          db.select().from(morningState).where(inArray(morningState.postId, ids)),
          db.select({ postId: wolfbotReviews.postId }).from(wolfbotReviews).where(inArray(wolfbotReviews.postId, ids)),
        ])
      : [[], []]

    const stateMap    = new Map(states.map(s => [s.postId, s]))
    const reviewedIds = new Set(reviews.map(r => r.postId))

    feedPosts = rows.map(({ content, ...r }) => ({
      ...r,
      excerpt: r.excerpt || deriveExcerpt(content) || null,
      checklist: stateMap.get(r.id)?.routineChecklist as Record<string, boolean> | undefined,
      happyScale: stateMap.get(r.id)?.happyScale ?? null,
      bodyScale:  stateMap.get(r.id)?.bodyScale  ?? null,
      brainScale: stateMap.get(r.id)?.brainScale ?? null,
      wolfbotReviewed: reviewedIds.has(r.id),
    }))
  }

  const showOnboardingBanner = session?.user?.id && !session.user.onboardingComplete

  return (
    <main className="feed-page">
      {showOnboardingBanner && (
        <div className="onboarding-banner">
          <p className="onboarding-banner-text">
            Finish setting up your journal — it only takes a moment.
          </p>
          <Link href="/onboarding" className="onboarding-banner-link">
            Complete setup →
          </Link>
        </div>
      )}

      <div className="feed-tabs">
        <Link href="/feed" className={`feed-tab${!isMine ? ' feed-tab--active' : ''}`}>
          <span className="feed-tab-label">Community</span>
          <span className="feed-tab-sub">Everyone&apos;s journals</span>
        </Link>
        <Link href="/feed?view=mine" className={`feed-tab${isMine ? ' feed-tab--active' : ''}`}>
          <span className="feed-tab-label">My Journals</span>
          <span className="feed-tab-sub">Your personal feed</span>
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
