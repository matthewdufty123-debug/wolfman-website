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
import { posts, morningState, users } from '@/lib/db/schema'
import { getScalesForPosts } from '@/lib/db/queries'
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

const SCALE_WORDS: Record<'happy' | 'body' | 'brain' | 'stress', string[]> = {
  happy:  ['Completely Lost', 'Struggling',           'Bit Low',    'Flat',       'Okay',     'Happy',      'Bike Smiles',    'Absolutely Joyful'],
  body:   ['Nothing to Give', 'Running Empty',        'Sluggish',   'Slow',       'Steady',   'Energised',  'Firing Hard',    'Absolutely Buzzing'],
  brain:  ['Completely Silent','Very Peaceful',        'Quite Quiet','Chill',      'Active',   'Busy',       'Hyper Focused',  'Totally Manic'],
  stress: ['Completely Overwhelmed','Anxious',         'Stressed',   'Unsettled',  'Peaceful', 'Focused',    'Primed',         'Hunt Mode'],
}

function scaleWord(val: number | null, type: keyof typeof SCALE_WORDS): string | null {
  if (!val || val < 1 || val > 8) return null
  return SCALE_WORDS[type][val - 1]
}

type FeedPost = {
  id: string
  slug: string
  title: string
  date: string
  excerpt: string | null
  image: string | null
  wordCountTotal: number | null
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
  stressScale: number | null
}

function FeedCard({ post, showAuthor }: { post: FeedPost; showAuthor: boolean }) {
  const authorName = post.authorDisplayName ?? post.authorName ?? post.authorUsername ?? 'Unknown'
  const avatarSrc = post.authorAvatar ?? post.authorImage ?? null
  const url = post.authorUsername ? `/${post.authorUsername}/${post.slug}` : `/posts/${post.slug}`
  const isDraft = post.status === 'draft'
  const cardUrl = isDraft ? `/edit/${post.id}` : url

  const moodWord   = scaleWord(post.happyScale,  'happy')
  const bodyWord   = scaleWord(post.bodyScale,   'body')
  const brainWord  = scaleWord(post.brainScale,  'brain')
  const stressWord = scaleWord(post.stressScale, 'stress')
  const hasScales  = !!(moodWord || bodyWord || brainWord || stressWord)

  const completedRituals = post.checklist
    ? Object.values(post.checklist).filter(Boolean).length
    : 0
  const hasRituals = !!post.checklist && completedRituals > 0

  return (
    <article className="feed-card">

      {/* Row 1: Profile */}
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

      {/* Row 2: Title */}
      <Link href={cardUrl} className="feed-card-title-link">
        <p className="feed-card-title">{post.title || 'Untitled'}</p>
      </Link>

      {/* Row 3: Word count */}
      {post.wordCountTotal ? (
        <div className="feed-card-wordcount">
          <span className="feed-card-wordcount-number">{post.wordCountTotal}</span>
          <span className="feed-card-wordcount-label">words</span>
        </div>
      ) : null}

      {/* Row 4: Ritual icons + count */}
      {hasRituals && (
        <div className="feed-card-rituals">
          <AnimatedRoutineIcons checklist={post.checklist!} size={18} />
          <span className="feed-card-ritual-count">{completedRituals}</span>
        </div>
      )}

      {/* Row 5: How I Showed Up — 4 scales */}
      {hasScales && (
        <div className="feed-card-scales">
          {moodWord && (
            <div className="feed-card-scale-pill">
              <span className="feed-card-scale-label">MOOD</span>
              <span className="feed-card-scale-word">{moodWord}</span>
            </div>
          )}
          {bodyWord && (
            <div className="feed-card-scale-pill">
              <span className="feed-card-scale-label">BODY</span>
              <span className="feed-card-scale-word">{bodyWord}</span>
            </div>
          )}
          {brainWord && (
            <div className="feed-card-scale-pill">
              <span className="feed-card-scale-label">BRAIN</span>
              <span className="feed-card-scale-word">{brainWord}</span>
            </div>
          )}
          {stressWord && (
            <div className="feed-card-scale-pill">
              <span className="feed-card-scale-label">STRESS</span>
              <span className="feed-card-scale-word">{stressWord}</span>
            </div>
          )}
        </div>
      )}

      {/* Row 6: Photo / fallback — acts as visual separator between cards */}
      <Link href={cardUrl} className="feed-card-media-link">
        <div className="feed-card-media">
          {post.image
            ? <img src={post.image} alt={post.title} className="feed-card-photo" />
            : <div className="feed-card-photo-fallback" />
          }
        </div>
      </Link>

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
    const [states, scaleMap] = await Promise.all([
      ids.length > 0 ? db.select({ postId: morningState.postId, routineChecklist: morningState.routineChecklist }).from(morningState).where(inArray(morningState.postId, ids)) : [],
      getScalesForPosts(ids),
    ])

    const stateMap = new Map(states.map(s => [s.postId, s]))

    feedPosts = rows.map(({ content, ...r }) => ({
      ...r,
      excerpt: r.excerpt || deriveExcerpt(content) || null,
      checklist:   stateMap.get(r.id)?.routineChecklist as Record<string, boolean> | undefined,
      happyScale:  scaleMap.get(r.id)?.happyScale  ?? null,
      bodyScale:   scaleMap.get(r.id)?.bodyScale   ?? null,
      brainScale:  scaleMap.get(r.id)?.brainScale  ?? null,
      stressScale: scaleMap.get(r.id)?.stressScale ?? null,
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
    const [states, scaleMap] = await Promise.all([
      ids.length > 0 ? db.select({ postId: morningState.postId, routineChecklist: morningState.routineChecklist }).from(morningState).where(inArray(morningState.postId, ids)) : [],
      getScalesForPosts(ids),
    ])

    const stateMap = new Map(states.map(s => [s.postId, s]))

    feedPosts = rows.map(({ content, ...r }) => ({
      ...r,
      excerpt: r.excerpt || deriveExcerpt(content) || null,
      checklist:   stateMap.get(r.id)?.routineChecklist as Record<string, boolean> | undefined,
      happyScale:  scaleMap.get(r.id)?.happyScale  ?? null,
      bodyScale:   scaleMap.get(r.id)?.bodyScale   ?? null,
      brainScale:  scaleMap.get(r.id)?.brainScale  ?? null,
      stressScale: scaleMap.get(r.id)?.stressScale ?? null,
    }))
  }

  const showOnboardingBanner = session?.user?.id && !session.user.onboardingComplete
  const showTimezoneBanner = session?.user?.id && session.user.onboardingComplete && !session.user.timezone

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

      {showTimezoneBanner && (
        <div className="onboarding-banner">
          <p className="onboarding-banner-text">
            Set your timezone so your journal days start at the right midnight.
          </p>
          <Link href="/settings" className="onboarding-banner-link">
            Set timezone →
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
