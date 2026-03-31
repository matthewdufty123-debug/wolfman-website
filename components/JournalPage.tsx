'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import ProfileSection from '@/components/journal/ProfileSection'
import AuditLogSection from '@/components/journal/AuditLogSection'

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

const MAX_SWIPE_DISTANCE = 160 // px at which navigation triggers

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
  const router = useRouter()
  const { data: session } = useSession()
  const isOwner = session?.user?.id != null && session.user.id === authorId

  const [contentOpacity, setContentOpacity] = useState(1)
  const touchStartX = useRef<number | null>(null)
  const navigatingRef = useRef(false)

  const prevHref = prevPost ? `/${prevPost.username}/${prevPost.slug}` : null
  const nextHref = nextPost ? `/${nextPost.username}/${nextPost.slug}` : null

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || navigatingRef.current) return
    const delta = e.touches[0].clientX - touchStartX.current
    const abs = Math.abs(delta)
    if (abs > 10) {
      // Fade content as swipe progresses — from 1 down to 0.25
      const opacity = Math.max(0.25, 1 - (abs / MAX_SWIPE_DISTANCE) * 0.75)
      setContentOpacity(opacity)
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || navigatingRef.current) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) >= MAX_SWIPE_DISTANCE) {
      const href = delta < 0 ? nextHref : prevHref
      if (href) {
        navigatingRef.current = true
        setContentOpacity(0.25)
        router.push(href)
        return
      }
    }
    // Not enough — restore opacity
    setContentOpacity(1)
  }

  const synthesis = dayScores?.synthesis ?? post.review ?? null

  return (
    <div
      className="journal-scroll-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="journal-scroll-content"
        style={{
          opacity: contentOpacity,
          transition: contentOpacity === 1 ? 'opacity 0.3s ease' : 'none',
        }}
      >
        {/* Post title — sits at top, below the fixed upper nav bar */}
        <header className="journal-page-title-header">
          <h1 className="journal-page-title">{post.title}</h1>
          <p className="journal-page-date">{formatPostDate(post.date)}</p>
        </header>

        {/* Section running order: Scores, Journal, Rituals, WolfBot, PostInfo, Evening, Photo, Profile, Audit */}

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

        <WolfBotSection
          synthesis={synthesis}
          wolfbotReviews={wolfbotReviews}
          isOwnPost={isOwner}
          postId={post.id ?? ''}
          promptVersion={promptVersion}
        />

        <PostInfoSection post={post} postDates={postDates} />

        <EveningSection
          postId={post.id ?? ''}
          isOwner={isOwner}
          reflection={eveningReflection}
          feelAboutToday={feelAboutToday}
        />

        {post.image && (
          <JournalPhotoSection imageUrl={post.image} title={post.title} />
        )}

        <ProfileSection author={author} username={username} />

        <AuditLogSection postDates={postDates} />

        {/* PostFooter — "You have been reading..." + wordmark */}
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
