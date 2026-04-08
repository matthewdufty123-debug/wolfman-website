'use client'

import { useSession } from 'next-auth/react'
import type { ProcessedPost } from '@/lib/posts'
import MorningRitualsSection from '@/components/journal/MorningRitualsSection'
import HumanScoresSection from '@/components/journal/HumanScoresSection'
import JournalTextSection from '@/components/journal/JournalTextSection'
import WolfBotSection, { type WolfBotReviews } from '@/components/journal/WolfBotSection'
import PostInfoSection from '@/components/journal/PostInfoSection'

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
  pixelGrid?:    number[][]
  pixelPalette?: Record<string, string>
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JournalPage({
  post,
  username,
  author,
  morningState,
  dayScores,
  postDates,
  authorId,
  nextPost,
  wolfbotReviews,
  promptVersion,
  pixelGrid,
  pixelPalette,
}: JournalPageProps) {
  const { data: session } = useSession()
  const isOwner = session?.user?.id != null && session.user.id === authorId

  const nextHref = nextPost ? `/${nextPost.username}/${nextPost.slug}` : null
  const profileHref = `/${username}`
  const editHref = post.id ? `/edit/${post.id}` : null

  const synthesis = dayScores?.synthesis ?? post.review ?? null

  return (
    <>
      <div className="journal-scroll-page">
        <div className="journal-scroll-content">

          {/* Section order: Journal → WOLF|BOT Review → How I Showed Up → Morning Rituals → Post Info → Nav */}

          <JournalTextSection post={post} />

          <WolfBotSection
            synthesis={synthesis}
            wolfbotReviews={wolfbotReviews}
            isOwnPost={isOwner}
            postId={post.id ?? ''}
            promptVersion={promptVersion}
            pixelGrid={pixelGrid}
            pixelPalette={pixelPalette}
          />

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

          <PostInfoSection post={post} />

          {/* Bottom navigation */}
          <div className="journal-bottom-nav">
            <a href={profileHref} className="journal-nav-btn journal-nav-btn--default">
              View Profile
            </a>
            {nextHref && (
              <a href={nextHref} className="journal-nav-btn journal-nav-btn--default">
                Next Journal →
              </a>
            )}
            <a href="/write" className="journal-nav-btn journal-nav-btn--default">
              Write a New Journal
            </a>
            {isOwner && editHref && (
              <a href={editHref} className="journal-nav-btn journal-nav-btn--primary">
                Edit This Journal
              </a>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
