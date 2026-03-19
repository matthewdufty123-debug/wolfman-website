import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllSlugs, getAllPosts, getPostBySlug, ProcessedPost, ParsedSection, PostMeta } from '@/lib/posts'
import { notFound } from 'next/navigation'
import ShareButton from '@/components/ShareButton'
import EveningReflection from '@/components/EveningReflection'
import MorningRitualIconBar from '@/components/MorningRitualIconBar'
import MorningScaleBar from '@/components/MorningScaleBar'
import { db } from '@/lib/db'
import { morningState, eveningReflection, dayScores } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Allow slugs not in generateStaticParams to be dynamically rendered (posts published after a build)
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found — Wolfman' }
  const url = `https://wolfman.blog/posts/${post.slug}`
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

function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconNext() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function PostNav({ nextPost, slug, title }: { nextPost: PostMeta | null; slug: string; title: string }) {
  const url = `https://wolfman.blog/posts/${slug}`
  return (
    <nav className="post-nav">
      <div className="post-nav-share-row">
        <ShareButton title={title} url={url} />
      </div>
      <div className="post-nav-links-row">
        <Link href="/intentions" className="post-nav-btn" aria-label="Back to Morning Intentions">
          <IconBack />
          <span className="post-nav-label">All posts</span>
        </Link>
        {nextPost ? (
          <Link href={`/posts/${nextPost.slug}`} className="post-nav-btn post-nav-btn--right" aria-label={`Next: ${nextPost.title}`}>
            <span className="post-nav-label">{nextPost.title}</span>
            <IconNext />
          </Link>
        ) : (
          <span className="post-nav-btn post-nav-btn--right post-nav-btn--disabled" aria-hidden="true">
            <span className="post-nav-label">No older posts</span>
            <IconNext />
          </span>
        )}
      </div>
    </nav>
  )
}

function MorningIntentionPost({ post }: { post: ProcessedPost }) {
  const hasSections = post.sections && post.sections.length > 0
  return (
    <article className="post">
      {hasSections
        ? post.sections!.map((section: ParsedSection) => (
            <div key={section.label} className="post-section">
              <p className="post-section-label">{section.label}</p>
              <div
                className="post-body"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </div>
          ))
        : (
            <div
              className="post-body"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />
          )
      }
    </article>
  )
}

function MorningWalkPost({ post }: { post: ProcessedPost }) {
  return (
    <article className="post post--walk">
      {post.contextHtml && (
        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: post.contextHtml }}
        />
      )}
      {post.videoId && (
        <div className="post-video">
          <iframe
            src={`https://www.youtube.com/embed/${post.videoId}?rel=0`}
            allowFullScreen
            loading="lazy"
            title={post.title}
          />
        </div>
      )}
    </article>
  )
}

// ── Day data display components ────────────────────────────────────────────────

const BRAIN_LABELS: [string,string,string,string,string,string] = ['Peaceful','Quiet','Active','Busy','Racing','Manic']
const BODY_LABELS:  [string,string,string,string,string,string] = ['Lethargic','Slow','Steady','Energised','Strong','Buzzing']
const HAPPY_LABELS: [string,string,string,string,string,string] = ['Far from happy','Low','Okay','Good','Happy','Joyful']

type MorningStateRow = {
  brainScale: number
  bodyScale: number
  happyScale?: number | null
  routineChecklist: unknown
}

function MorningStateBlock({ ms }: { ms: MorningStateRow }) {
  const checklist = ms.routineChecklist as Record<string, boolean>
  return (
    <div className="post-day-block">
      <p className="post-day-block-label">How the morning started</p>

      <div className="post-day-routine-icons">
        <span className="post-day-ritual-label">Morning Rituals</span>
        <MorningRitualIconBar checklist={checklist} size={20} />
      </div>

      <div className="post-day-scales">
        <div className="post-day-scale-col">
          <span className="post-day-scale-name">My Thoughts</span>
          <MorningScaleBar scaleName="My Thoughts" value={ms.brainScale} labels={BRAIN_LABELS} color="#4A7FA5" />
          <div className="post-day-scale-labels">
            <span>Peaceful</span>
            <span>Manic</span>
          </div>
        </div>
        <div className="post-day-scale-col">
          <span className="post-day-scale-name">Body Energy</span>
          <MorningScaleBar scaleName="Body Energy" value={ms.bodyScale} labels={BODY_LABELS} color="#A0622A" />
          <div className="post-day-scale-labels">
            <span>Lethargic</span>
            <span>Buzzing</span>
          </div>
        </div>
        {ms.happyScale != null && (
          <div className="post-day-scale-col">
            <span className="post-day-scale-name">Happy Scale</span>
            <MorningScaleBar scaleName="Happy Scale" value={ms.happyScale} labels={HAPPY_LABELS} color="#3AB87A" />
            <div className="post-day-scale-labels">
              <span>Far from happy</span>
              <span>Joyful</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type EveningReflectionRow = {
  reflection: string
  wentToPlan: boolean
  dayRating: number
}

function EveningReflectionBlock({ er }: { er: EveningReflectionRow }) {
  return (
    <div className="post-day-block">
      <p className="post-day-block-label">How the day unfolded</p>

      <div className="post-day-reflection-text">
        {er.reflection.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="post-day-evening-meta">
        <div
          className="post-day-went-to-plan"
          data-yes={er.wentToPlan}
        >
          {er.wentToPlan ? '✓ Went to plan' : '~ Not quite to plan'}
        </div>

        <div className="post-day-rating">
          {[1, 2, 3, 4, 5].map(n => (
            <div
              key={n}
              className="post-day-rating-pip"
              data-active={n <= er.dayRating}
            />
          ))}
          <span className="post-day-rating-label">{er.dayRating}/5</span>
        </div>
      </div>
    </div>
  )
}

type DayScoreRow = {
  scores: unknown
  synthesis: string
  dataCompleteness: string
}

const COMPLETENESS_LABELS: Record<string, string> = {
  post_only:             'from intention alone',
  post_morning:          'from intention + morning state',
  post_morning_evening:  'from full day data',
}

function ClaudesTakeBlock({ ds }: { ds: DayScoreRow }) {
  const scores = ds.scores as Record<string, number>
  const completenessLabel = COMPLETENESS_LABELS[ds.dataCompleteness] ?? ds.dataCompleteness
  return (
    <div className="post-day-block post-day-block--claudes-take">
      <div className="post-day-claudes-take-header">
        <p className="post-day-block-label" style={{ margin: 0 }}>✦ Claude&apos;s Take</p>
        <span className="post-day-completeness">{completenessLabel}</span>
      </div>

      <div className="post-day-scores">
        {Object.entries(scores).map(([dim, score]) => (
          <div key={dim} className="post-day-score-card">
            <span className="post-day-score-value">{score.toFixed(1)}</span>
            <span className="post-day-score-dim">{dim.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      <div className="post-day-synthesis">
        {ds.synthesis.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [post, allPosts] = await Promise.all([getPostBySlug(slug), getAllPosts()])

  if (!post) notFound()

  // Fetch day data for DB-backed posts
  const [ms, er, ds] = post.id
    ? await Promise.all([
        db.select().from(morningState).where(eq(morningState.postId, post.id)).then(r => r[0] ?? null),
        db.select().from(eveningReflection).where(eq(eveningReflection.postId, post.id)).then(r => r[0] ?? null),
        db.select().from(dayScores).where(eq(dayScores.postId, post.id)).then(r => r[0] ?? null),
      ])
    : [null, null, null]

  // Posts sorted newest-first; next = the next older post
  const currentIndex = allPosts.findIndex(p => p.slug === slug)
  const nextPost = currentIndex !== -1 && currentIndex < allPosts.length - 1
    ? allPosts[currentIndex + 1]
    : null

  return (
    <>
      {post.category === 'morning-walk'
        ? <MorningWalkPost post={post} />
        : <MorningIntentionPost post={post} />
      }

      <div className="post-author-review-wrap">
        {/* Author block */}
        <div className="post-author">
          <img src="/images/site_images/matthew-face.jpg" alt="Matthew Wolfman" className="post-author-photo" />
          <div>
            <p className="post-author-byline">This post was written by</p>
            <p className="post-author-name">Matthew Wolfman</p>
            <p className="post-author-bio">Data engineer, mountain biker, photographer, wood carver. Writing every morning.</p>
          </div>
        </div>

        {/* Morning state — right after author photo and name */}
        {ms && <MorningStateBlock ms={ms} />}

        {/* Claude review block (legacy field) */}
        {post.review && (
          <div className="post-claude-review">
            <div className="post-claude-review-header">
              <img src="/images/site_images/claudecode-color.png" alt="Claude" className="post-claude-icon" />
              <span className="post-claude-review-label">Claude&apos;s take</span>
            </div>
            <div className="post-claude-review-body">
              {post.review.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evening + Claude's Take — only renders when data exists */}
      {er && <EveningReflectionBlock er={er} />}
      {ds && <ClaudesTakeBlock ds={ds} />}

      <PostNav nextPost={nextPost} slug={slug} title={post.title} />

      {/* Evening reflection — admin only, invisible to readers */}
      {post.id && <EveningReflection postId={post.id} />}
    </>
  )
}
