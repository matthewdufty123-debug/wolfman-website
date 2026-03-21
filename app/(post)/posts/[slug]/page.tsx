import type { Metadata } from 'next'
import { getAllSlugs, getAllPosts, getPostBySlug, ProcessedPost, ParsedSection } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import PostFooter from '@/components/PostFooter'
import { PostContextSetter } from '@/lib/post-context'
import MorningRitualIconBar from '@/components/MorningRitualIconBar'
import MorningScaleBar from '@/components/MorningScaleBar'
import DayScoreScatter from '@/components/DayScoreScatter'
import { db } from '@/lib/db'
import { posts as postsTable, morningState, eveningReflection, dayScores } from '@/lib/db/schema'
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

function formatPostDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']
  const suffix = [1,21,31].includes(day) ? 'st' : [2,22].includes(day) ? 'nd'
               : [3,23].includes(day) ? 'rd' : 'th'
  return `${day}${suffix} ${months[month-1]} ${year}`
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

type EveningReflectionRow = {
  reflection: string
  wentToPlan: boolean
  dayRating: number
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

function ClaudesTakeBlock({ ds, allScores, postId }: { ds: DayScoreRow; allScores: ScatterPoint[]; postId: string }) {
  const scores = ds.scores as Record<string, number>
  const completenessLabel = COMPLETENESS_LABELS[ds.dataCompleteness] ?? ds.dataCompleteness
  return (
    <div className="post-day-block post-day-block--claudes-take">
      <div className="post-day-claudes-take-header">
        <p className="post-day-block-label" style={{ margin: 0 }}>✦ Claude&apos;s Take</p>
        <span className="post-day-completeness">{completenessLabel}</span>
      </div>

      <div className="post-day-synthesis">
        {ds.synthesis.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="post-day-scores">
        {Object.entries(scores).map(([dim, score]) => (
          <div key={dim} className="post-day-score-card">
            <span className="post-day-score-value">{score.toFixed(1)}</span>
            <span className="post-day-score-dim">{dim.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      {allScores.length > 1 && (
        <DayScoreScatter data={allScores} todayPostId={postId} />
      )}
    </div>
  )
}

type ScatterPoint = { date: string; postId: string; x: number; y: number }

function DayBlock({ ms, er }: { ms: MorningStateRow | null; er: EveningReflectionRow | null }) {
  if (!ms && !er) return null
  return (
    <div className="post-day-block">
      {ms && (
        <>
          <p className="post-day-block-label">How the morning started</p>

          <div className="post-day-routine-icons">
            <span className="post-day-ritual-label">Morning Rituals</span>
            <MorningRitualIconBar checklist={ms.routineChecklist as Record<string, boolean>} size={20} />
          </div>

          <div className="post-day-scales">
            <div className="post-day-scale-col">
              <span className="post-day-scale-name">Brain Activity</span>
              <MorningScaleBar scaleName="Brain Activity" value={ms.brainScale} labels={BRAIN_LABELS} color="#4A7FA5" />
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
        </>
      )}

      {er && (
        <>
          {ms && <div className="post-day-section-divider" />}
          <p className="post-day-block-label">How the day ended</p>

          <div className="post-day-reflection-text">
            {er.reflection.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="post-day-evening-meta">
            <div className="post-day-went-to-plan" data-yes={er.wentToPlan}>
              {er.wentToPlan ? '✓ Went to plan' : '~ Not quite to plan'}
            </div>
            <div className="post-day-rating">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="post-day-rating-pip" data-active={n <= er.dayRating} />
              ))}
              <span className="post-day-rating-label">{er.dayRating}/6</span>
            </div>
          </div>
        </>
      )}
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
  const [post, allPosts, session] = await Promise.all([getPostBySlug(slug), getAllPosts(), auth()])

  if (!post) notFound()

  // Draft posts are only visible to their author
  if (post.status === 'draft' && session?.user?.id !== post.authorId) notFound()

  // Fetch day data for DB-backed posts
  const [ms, er, ds, allDayScores] = post.id
    ? await Promise.all([
        db.select().from(morningState).where(eq(morningState.postId, post.id)).then(r => r[0] ?? null),
        db.select().from(eveningReflection).where(eq(eveningReflection.postId, post.id)).then(r => r[0] ?? null),
        db.select().from(dayScores).where(eq(dayScores.postId, post.id)).then(r => r[0] ?? null),
        db.select({ date: postsTable.date, postId: dayScores.postId, scores: dayScores.scores })
          .from(dayScores)
          .innerJoin(postsTable, eq(dayScores.postId, postsTable.id))
          .orderBy(postsTable.date),
      ])
    : [null, null, null, []]

  // Build scatter chart data from all day scores that have both fixed dimensions
  const scatterData: ScatterPoint[] = (allDayScores ?? []).flatMap(row => {
    const s = row.scores as Record<string, number>
    if (typeof s.intention_alignment !== 'number' || typeof s.inner_vitality !== 'number') return []
    return [{ date: row.date, postId: row.postId, x: s.intention_alignment, y: s.inner_vitality }]
  })

  // Posts sorted newest-first; prevPost = newer, nextPost = older
  const currentIndex = allPosts.findIndex(p => p.slug === slug)
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null
  const nextPost = currentIndex !== -1 && currentIndex < allPosts.length - 1
    ? allPosts[currentIndex + 1]
    : null

  return (
    <>
      <PostContextSetter postId={post.id ?? ''} authorId={post.authorId ?? null} />
      {post.category === 'morning-walk'
        ? <MorningWalkPost post={post} />
        : <MorningIntentionPost post={post} />
      }

      <div className="post-reading-end">
        <p className="post-reading-end-label">You have been reading</p>
        <p className="post-reading-end-title">{post.title}</p>
        <p className="post-reading-end-date">Posted {formatPostDate(post.date)}</p>
      </div>

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

      </div>

      {/* Merged morning + evening block */}
      {(ms || er) && <DayBlock ms={ms} er={er} />}

      {/* Claude review block (legacy — only shown if no dayScores yet) */}
      {post.review && !ds && (
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

      {ds && post.id && <ClaudesTakeBlock ds={ds} allScores={scatterData} postId={post.id} />}

      <PostFooter
        prevPost={prevPost}
        nextPost={nextPost}
        slug={slug}
        title={post.title}
        postId={post.id ?? null}
        authorId={post.authorId ?? null}
      />
    </>
  )
}
