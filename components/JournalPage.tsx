'use client'

import { useSession } from 'next-auth/react'
import type { ProcessedPost } from '@/lib/posts'
import ThemeLogo from '@/components/ThemeLogo'
import MorningRitualsSection from '@/components/journal/MorningRitualsSection'
import HumanScoresSection from '@/components/journal/HumanScoresSection'
import JournalTextSection from '@/components/journal/JournalTextSection'
import WolfBotSection, { type WolfBotReviews } from '@/components/journal/WolfBotSection'
import PostInfoSection from '@/components/journal/PostInfoSection'
import EveningSection from '@/components/journal/EveningSection'
import JournalPhotoSection from '@/components/journal/JournalPhotoSection'
import JournalVideoSection from '@/components/journal/JournalVideoSection'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface JournalPageProps {
  post: ProcessedPost
  username: string
  author: {
    id: string
    name: string | null
    displayName: string | null
    bio: string | null
    avatar: string | null
    image: string | null
    username: string | null
    role: string
  }
  morningState: {
    brainScale: number
    bodyScale: number
    happyScale: number | null
    stressScale: number | null
    routineChecklist: Record<string, boolean>
  } | null
  eveningReflection: string | null
  feelAboutToday: number | null
  dayScores: {
    scores: Record<string, number>
    synthesis: string
    dataCompleteness: string
  } | null
  postDates: { createdAt: string; updatedAt: string } | null
  authorId: string | null
  prevPost: { slug: string; username: string } | null
  nextPost: { slug: string; username: string } | null
  wolfbotReviews: WolfBotReviews | null
  promptVersion: number
}

// ── Date helper ───────────────────────────────────────────────────────────────

function formatPostDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  const suffix = [1, 21, 31].includes(day) ? 'st' : [2, 22].includes(day) ? 'nd'
               : [3, 23].includes(day) ? 'rd' : 'th'
  return `${day}${suffix} ${months[month - 1]} ${year}`
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JournalPage({
  post,
  username,
  author,
  morningState,
  eveningReflection,
  feelAboutToday,
  dayScores,
  postDates,
  authorId,
  prevPost,
  nextPost,
  wolfbotReviews,
  promptVersion,
}: JournalPageProps) {
  const { data: session } = useSession()
  const isOwner = session?.user?.id != null && session.user.id === authorId

  const prevHref = prevPost ? `/${prevPost.username}/${prevPost.slug}` : null
  const nextHref = nextPost ? `/${nextPost.username}/${nextPost.slug}` : null

  const synthesis = dayScores?.synthesis ?? post.review ?? null

  return (
    <div className="journal-scroll-page">
      <div className="journal-scroll-content">
        {/* Post title — sits at top, below the fixed upper nav bar */}
        <header className="journal-page-title-header">
          <h1 className="journal-page-title">{post.title}</h1>
          <p className="journal-page-date">{formatPostDate(post.date)}</p>
          <a href={`/${username}`} className="journal-author-byline">
            {(author.avatar ?? author.image) && (
              <img
                src={author.avatar ?? author.image ?? ''}
                alt={author.displayName ?? author.name ?? username}
                className="journal-author-avatar"
              />
            )}
            <span className="journal-author-name">
              {author.displayName ?? author.name ?? username}
            </span>
          </a>
        </header>

        {/* Section running order: Scores, Journal, Rituals, WolfBot, Evening, Photo, PostInfo, NextPost, Footer */}

        {morningState && (
          <HumanScoresSection
            brainScale={morningState.brainScale}
            bodyScale={morningState.bodyScale}
            happyScale={morningState.happyScale}
            stressScale={morningState.stressScale}
          />
        )}

        <JournalTextSection post={post} />

        {morningState && (
          <MorningRitualsSection checklist={morningState.routineChecklist} />
        )}

        {(wolfbotReviews !== null || synthesis !== null) && (
          <WolfBotSection
            synthesis={synthesis}
            wolfbotReviews={wolfbotReviews}
            isOwnPost={isOwner}
            postId={post.id ?? ''}
            promptVersion={promptVersion}
          />
        )}

        <EveningSection
          postId={post.id ?? ''}
          isOwner={isOwner}
          reflection={eveningReflection}
          feelAboutToday={feelAboutToday}
        />

        {post.image && (
          <JournalPhotoSection imageUrl={post.image} title={post.title} />
        )}

        {post.videoId && (
          <JournalVideoSection videoId={post.videoId} title={post.title} />
        )}

        <PostInfoSection post={post} postDates={postDates} />

        {/* Next Journal button — full width, only shown when a next post exists */}
        {nextHref && (
          <div className="journal-next-post-wrap">
            <a href={nextHref} className="journal-next-post-btn">
              NEXT JOURNAL →
            </a>
          </div>
        )}

        {/* Footer — wordmark */}
        <footer className="post-reading-end">
          <p className="post-reading-end-label">You have been reading</p>
          <p className="post-reading-end-title">{post.title}</p>
          <p className="post-reading-end-date">Posted {formatPostDate(post.date)}</p>
          <div className="post-reading-end-logo">
            <a href="/about" aria-label="About Wolfman">
              <ThemeLogo className="post-reading-end-wordmark" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
