'use client'

import { useSession } from 'next-auth/react'
import type { ProcessedPost } from '@/lib/posts'
import MorningRitualsSection from '@/components/journal/MorningRitualsSection'
import HumanScoresSection from '@/components/journal/HumanScoresSection'
import JournalTextSection from '@/components/journal/JournalTextSection'
import WolfBotSection, { type WolfBotReviews } from '@/components/journal/WolfBotSection'
import PostInfoSection from '@/components/journal/PostInfoSection'
import WolfBotBanner from '@/components/WolfBotBanner'

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
    brainScale: number | null
    bodyScale: number | null
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

// ── Main component ────────────────────────────────────────────────────────────

export default function JournalPage({
  post,
  morningState,
  dayScores,
  postDates,
  authorId,
  nextPost,
  wolfbotReviews,
  promptVersion,
}: JournalPageProps) {
  const { data: session } = useSession()
  const isOwner = session?.user?.id != null && session.user.id === authorId

  const nextHref = nextPost ? `/${nextPost.username}/${nextPost.slug}` : null

  const synthesis = dayScores?.synthesis ?? post.review ?? null

  const hasReview = !!(
    (wolfbotReviews?.reviewHelpful || wolfbotReviews?.reviewSassy) || synthesis
  )

  return (
    <>
      <div className="journal-scroll-page">
        <div className="journal-scroll-content">

          {/* Section order: Journal → How I Showed Up → Morning Rituals → Post Info → Next → WOLF|BOT */}

          <JournalTextSection post={post} />

          {morningState && (
            <HumanScoresSection
              brainScale={morningState.brainScale}
              bodyScale={morningState.bodyScale}
              happyScale={morningState.happyScale}
              stressScale={morningState.stressScale}
            />
          )}

          {morningState && (
            <MorningRitualsSection checklist={morningState.routineChecklist} />
          )}

          <PostInfoSection post={post} postDates={postDates} />

          {/* Next Journal button */}
          {nextHref && (
            <div className="journal-next-post-wrap">
              <a href={nextHref} className="journal-next-post-btn">
                NEXT JOURNAL →
              </a>
            </div>
          )}

          <WolfBotSection
            synthesis={synthesis}
            wolfbotReviews={wolfbotReviews}
            isOwnPost={isOwner}
            postId={post.id ?? ''}
            promptVersion={promptVersion}
          />

        </div>
      </div>
      {hasReview && <WolfBotBanner />}
    </>
  )
}
