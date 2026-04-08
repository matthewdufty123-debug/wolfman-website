'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
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

// ── Info overlay ──────────────────────────────────────────────────────────────

function WolfBotInfoOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="wb-info-overlay" onClick={onClose}>
      <div className="wb-info-card" onClick={e => e.stopPropagation()}>
        <button className="wb-info-close" onClick={onClose} aria-label="Close">&times;</button>
        <p className="wb-info-title">About WOLF|BOT Reviews</p>
        <p className="wb-info-body">
          WOLF|BOT is an AI journalling assistant that reads your entry and generates a personalised review.
          It considers what you wrote, your morning scores, rituals, and your recent journal history to give
          you an observation you could not have seen yourself.
        </p>
        <p className="wb-info-body">
          Reviews are tailored to your profession and humour style. The more you journal, the richer the
          context WOLF|BOT has to work with.
        </p>
        <a href="/wolfbot" className="wb-info-link">Learn more about WOLF|BOT →</a>
      </div>
    </div>
  )
}

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

// ── Review section — integrated as a journal section ──────────────────────────

function ReviewSection({
  review,
  reviewRating,
  postId,
  isOwnPost,
}: {
  review:        string
  reviewRating:  number | null
  postId:        string
  isOwnPost:     boolean
}) {
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div className="post-section">
      <p className="post-section-label">
        WOLF|BOT&apos;s Review
        <button
          type="button"
          className="wb-info-btn"
          onClick={() => setInfoOpen(true)}
          aria-label="What is WOLF|BOT?"
          title="What is WOLF|BOT?"
        >
          <Info size={14} strokeWidth={2} />
        </button>
      </p>
      <div className="post-body">
        {review.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {isOwnPost && (
        <RatingWidget postId={postId} initialRating={reviewRating} />
      )}

      <WolfBotInfoOverlay open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}

// ── Legacy review section ─────────────────────────────────────────────────────

function LegacySection({ text }: { text: string }) {
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div className="post-section">
      <p className="post-section-label">
        WOLF|BOT&apos;s Review
        <button
          type="button"
          className="wb-info-btn"
          onClick={() => setInfoOpen(true)}
          aria-label="What is WOLF|BOT?"
          title="What is WOLF|BOT?"
        >
          <Info size={14} strokeWidth={2} />
        </button>
      </p>
      <div className="post-body">
        {text.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <WolfBotInfoOverlay open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}

// ── Trigger section — no review yet, own post ─────────────────────────────────

function TriggerSection({ postId, pixelGrid, pixelPalette }: { postId: string; pixelGrid?: PixelGrid; pixelPalette?: PixelPalette }) {
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

// ── Main export ───────────────────────────────────────────────────────────────

export default function WolfBotSection({ synthesis, wolfbotReviews, isOwnPost, postId, promptVersion, pixelGrid, pixelPalette }: Props) {
  const hasReview = !!wolfbotReviews?.review
  const hasLegacy = wolfbotReviews?.reviewHelpful || wolfbotReviews?.reviewSassy
  const hasSynthesis = !!synthesis

  if (!hasReview && !hasLegacy && !hasSynthesis && !isOwnPost) return null

  return (
    <section id="wolfbot-review" className="journal-section journal-section--wolfbot">
      {hasReview ? (
        <ReviewSection
          review={wolfbotReviews!.review!}
          reviewRating={wolfbotReviews!.reviewRating}
          postId={postId}
          isOwnPost={isOwnPost}
        />
      ) : hasLegacy ? (
        <LegacySection
          text={wolfbotReviews!.reviewHelpful || wolfbotReviews!.reviewSassy || ''}
        />
      ) : hasSynthesis ? (
        <LegacySection text={synthesis!} />
      ) : (
        <TriggerSection postId={postId} pixelGrid={pixelGrid} pixelPalette={pixelPalette} />
      )}
    </section>
  )
}
