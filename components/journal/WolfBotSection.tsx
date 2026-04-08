'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WolfBotIcon from '@/components/WolfBotIcon'
import WolfBotLoadingOverlay from '@/components/WolfBotLoadingOverlay'

type PixelGrid    = number[][]
type PixelPalette = Record<string, string>

// ── Types ─────────────────────────────────────────────────────────────────────

export type WolfBotReviews = {
  review:       string | null
  reviewRating: number | null  // null=unrated, 1=👎, 2=👍
  // Legacy fields — kept for backward compat with old reviews
  reviewHelpful: string | null
  reviewSassy:   string | null
}

interface Props {
  synthesis:      string | null
  wolfbotReviews: WolfBotReviews | null
  isOwnPost:      boolean
  postId:         string
  promptVersion:  number
  pixelGrid?:     PixelGrid
  pixelPalette?:  PixelPalette
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WOLFBOT_QUIPS = [
  'Time for my take',
  'Running analysis...',
  "Let's see what we've got",
  'Processing your day...',
  'Loading my thoughts...',
  'Stand by...',
  'Interesting choices today',
  'Let me take a look',
  'Here we go',
  "Alright. Let's do this",
]

const RATINGS = [
  { value: 1, emoji: '👎', label: 'Not for me' },
  { value: 2, emoji: '👍', label: 'Good review' },
]

// ── Rating widget ─────────────────────────────────────────────────────────────

function RatingWidget({ postId, initialRating }: { postId: string; initialRating: number | null }) {
  const [rating, setRating] = useState<number | null>(initialRating)
  const [saving, setSaving] = useState(false)

  async function handleRate(value: number) {
    const newRating = rating === value ? null : value
    setSaving(true)
    try {
      await fetch(`/api/posts/${postId}/wolfbot-rating`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating }),
      })
      setRating(newRating)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="wb-rating">
      <span className="wb-rating-label">Rate this review</span>
      <div className="wb-rating-btns">
        {RATINGS.map(r => (
          <button
            key={r.value}
            type="button"
            className={`wb-rating-btn${rating === r.value ? ' wb-rating-btn--active' : ''}`}
            onClick={() => !saving && handleRate(r.value)}
            aria-label={r.label}
            title={r.label}
            disabled={saving}
          >
            {r.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Review terminal — review exists ───────────────────────────────────────────

function ReviewTerminal({
  review,
  reviewRating,
  postId,
  isOwnPost,
  pixelGrid,
  pixelPalette,
}: {
  review:        string
  reviewRating:  number | null
  postId:        string
  isOwnPost:     boolean
  pixelGrid?:    PixelGrid
  pixelPalette?: PixelPalette
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setRevealed(true); return }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={sectionRef}
      className="wolfbot-integrated"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div className="wolfbot-bubble-inner">
        <p className="wolfbot-terminal-line wolfbot-terminal-review">
          <span className="wbt-body">{review}</span>
        </p>

        {isOwnPost && (
          <RatingWidget postId={postId} initialRating={reviewRating} />
        )}
      </div>
    </div>
  )
}

// ── Trigger terminal — no review yet, own post ────────────────────────────────

function TriggerTerminal({ postId, pixelGrid, pixelPalette }: { postId: string; pixelGrid?: PixelGrid; pixelPalette?: PixelPalette }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(false)

  async function handleTrigger() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/posts/${postId}/wolfbot-reviews`, { method: 'POST' })
      if (res.ok || res.status === 409) {
        router.refresh()
      } else {
        setLoading(false)
        setError(true)
      }
    } catch {
      setLoading(false)
      setError(true)
    }
  }

  return (
    <>
      <WolfBotLoadingOverlay open={loading} />
      <div className="wolfbot-integrated">
        <div className="wolfbot-integrated-header">
          <WolfBotIcon size={72} grid={pixelGrid} palette={pixelPalette} />
        </div>
        <div className="wolfbot-bubble-inner">
          <div className="wb-personality-select">
            <p className="wb-personality-prompt">
              {error ? 'Generation failed — try again:' : 'Ready to hear what WOLF|BOT thinks?'}
            </p>
            <div className="wb-personality-grid">
              <button
                type="button"
                className="wb-personality-btn"
                disabled={loading}
                onClick={handleTrigger}
              >
                ▶ GET REVIEW
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Legacy terminal — old synthesis-only reviews ──────────────────────────────

function LegacyTerminal({ text, pixelGrid, pixelPalette }: {
  text: string; pixelGrid?: PixelGrid; pixelPalette?: PixelPalette
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setRevealed(true); return }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={sectionRef}
      className="wolfbot-integrated"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div className="wolfbot-bubble-inner">
        <p className="wolfbot-terminal-line wolfbot-terminal-review">
          <span className="wbt-body">{text}</span>
        </p>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function WolfBotSection({ synthesis, wolfbotReviews, isOwnPost, postId, promptVersion, pixelGrid, pixelPalette }: Props) {
  // New review takes priority
  const hasReview = !!wolfbotReviews?.review
  // Legacy: old multi-personality reviews
  const hasLegacy = wolfbotReviews?.reviewHelpful || wolfbotReviews?.reviewSassy
  // Old synthesis-only reviews
  const hasSynthesis = !!synthesis

  if (!hasReview && !hasLegacy && !hasSynthesis && !isOwnPost) return null

  return (
    <section id="wolfbot-review" className="journal-section journal-section--wolfbot">
      {hasReview ? (
        <ReviewTerminal
          review={wolfbotReviews!.review!}
          reviewRating={wolfbotReviews!.reviewRating}
          postId={postId}
          isOwnPost={isOwnPost}
          pixelGrid={pixelGrid}
          pixelPalette={pixelPalette}
        />
      ) : hasLegacy ? (
        <LegacyTerminal
          text={wolfbotReviews!.reviewHelpful || wolfbotReviews!.reviewSassy || ''}
          pixelGrid={pixelGrid}
          pixelPalette={pixelPalette}
        />
      ) : hasSynthesis ? (
        <LegacyTerminal text={synthesis!} pixelGrid={pixelGrid} pixelPalette={pixelPalette} />
      ) : (
        <TriggerTerminal postId={postId} pixelGrid={pixelGrid} pixelPalette={pixelPalette} />
      )}
    </section>
  )
}
