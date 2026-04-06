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
  reviewRating: number | null  // null=unrated, 1=👎, 2=👍, 3=🔥
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

function makeBootLines(promptVersion: number): string[] {
  return [
    'WOLF|BOT REVIEW INITIATED',
    `LOADING WOLF BRAIN v${promptVersion}...`,
    'PROCESSING JOURNAL ENTRY...',
  ]
}

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
  { value: 3, emoji: '🔥', label: 'Nailed it' },
]

// ── Voice slots (Web Speech API) ──────────────────────────────────────────────

type VoiceSlot = { id: string; label: string; patterns: string[] }

const VOICE_SLOTS: VoiceSlot[] = [
  { id: 'default',   label: 'DEFAULT',   patterns: [] },
  { id: 'daniel',    label: 'DANIEL',    patterns: ['daniel'] },
  { id: 'samantha',  label: 'SAMANTHA',  patterns: ['samantha'] },
  { id: 'british',   label: 'BRITISH',   patterns: ['google uk english', 'kate', 'serena', 'english (united kingdom)', 'en-gb'] },
  { id: 'google-us', label: 'GOOGLE US', patterns: ['google us english', 'google american', 'english (united states)', 'en-us'] },
]

const VOICE_PREF_KEY = 'wb-voice-slot'

function matchVoice(slot: VoiceSlot, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (slot.patterns.length === 0) return null
  const lower = voices.map(v => ({ voice: v, name: v.name.toLowerCase() }))
  for (const pattern of slot.patterns) {
    const match = lower.find(v => v.name.includes(pattern))
    if (match) return match.voice
  }
  return null
}

function buildFallbackSlots(voices: SpeechSynthesisVoice[]): VoiceSlot[] {
  const english = voices.filter(v => v.lang.startsWith('en')).slice(0, 4)
  return english.map(v => ({ id: v.voiceURI, label: v.name.toUpperCase().slice(0, 16), patterns: [v.name.toLowerCase()] }))
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

// ── Review terminal — review exists ───────────────────────────────────────────

function ReviewTerminal({
  review,
  reviewRating,
  promptVersion,
  postId,
  isOwnPost,
  pixelGrid,
  pixelPalette,
}: {
  review:        string
  reviewRating:  number | null
  promptVersion: number
  postId:        string
  isOwnPost:     boolean
  pixelGrid?:    PixelGrid
  pixelPalette?: PixelPalette
}) {
  const sectionRef      = useRef<HTMLDivElement>(null)
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voiceListRef    = useRef<SpeechSynthesisVoice[]>([])
  const [revealed,       setRevealed]       = useState(false)
  const [bootLine,       setBootLine]       = useState(0)
  const [displayedBoot,  setDisplayedBoot]  = useState('')
  const [bootDone,       setBootDone]       = useState(false)
  const [displayedText,  setDisplayedText]  = useState('')
  const [typingDone,     setTypingDone]     = useState(false)
  const [cursorVisible,  setCursorVisible]  = useState(true)
  const [speaking,       setSpeaking]       = useState(false)
  const [availableSlots, setAvailableSlots] = useState<VoiceSlot[]>([VOICE_SLOTS[0]])
  const [selectedSlotId, setSelectedSlotId] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem(VOICE_PREF_KEY) ?? 'default') : 'default'
  )

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

  // Voice loading
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    function load() {
      const all = window.speechSynthesis.getVoices()
      if (!all.length) return
      voiceListRef.current = all
      const curated = VOICE_SLOTS.filter(s => s.patterns.length === 0 || matchVoice(s, all) !== null)
      setAvailableSlots(curated.length > 1 ? curated : [VOICE_SLOTS[0], ...buildFallbackSlots(all)])
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  // Cancel speech on unmount
  useEffect(() => {
    return () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel() }
  }, [])

  function handleVoiceChange(slotId: string) {
    setSelectedSlotId(slotId)
    localStorage.setItem(VOICE_PREF_KEY, slotId)
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false) }
  }

  function handleSpeak() {
    if (!window.speechSynthesis) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const utterance = new SpeechSynthesisUtterance(review)
    utterance.rate  = 0.88
    utterance.pitch = 0.75
    const slot = VOICE_SLOTS.find(s => s.id === selectedSlotId)
    if (slot) { const voice = matchVoice(slot, voiceListRef.current); if (voice) utterance.voice = voice }
    utterance.onend  = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  const BOOT_LINES = makeBootLines(promptVersion)

  // Boot sequence — auto-starts on scroll into view
  useEffect(() => {
    if (!revealed) return
    const line = BOOT_LINES[bootLine] ?? null
    if (!line) { setTimeout(() => { setBootDone(true); setCursorVisible(true) }, 300); return }
    setDisplayedBoot('')
    let i = 0
    const interval = setInterval(() => {
      if (i >= line.length) { clearInterval(interval); setTimeout(() => { setBootLine(p => p + 1); setDisplayedBoot('') }, 250); return }
      setDisplayedBoot(line.slice(0, i + 1)); i++
    }, 22)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, bootLine])

  // Typewriter — punctuation-aware, auto-starts after boot
  useEffect(() => {
    if (!bootDone) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedText(review); setCursorVisible(false); setTypingDone(true); return
    }
    setDisplayedText(''); setCursorVisible(true)
    let i = 0
    function typeNext() {
      if (i >= review.length) { setCursorVisible(false); setTypingDone(true); return }
      setDisplayedText(review.slice(0, i + 1))
      const ch = review[i]
      let delay = 3 + Math.random() * 3
      if ('.!?'.includes(ch))  delay = 180
      else if (',;:'.includes(ch)) delay = 70
      i++
      timerRef.current = setTimeout(typeNext, delay)
    }
    typeNext()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootDone])

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
      <div className="wolfbot-integrated-header">
        <WolfBotIcon size={72} grid={pixelGrid} palette={pixelPalette} />
        <div className="wolfbot-integrated-title">
          <span className="wolfbot-integrated-name">WOLF|BOT</span>
          <span className="wolfbot-integrated-sub">REVIEW MODE</span>
        </div>
        {bootDone && typeof window !== 'undefined' && !!window.speechSynthesis && (
          <button
            type="button"
            className={`wb-play-circle${speaking ? ' wb-play-circle--speaking' : ''}`}
            onClick={handleSpeak}
            title={speaking ? 'Stop reading' : 'Read aloud'}
          >
            <span className="wb-play-circle-icon">{speaking ? '■' : '▶'}</span>
            <span className="wb-play-circle-label">{speaking ? 'stop' : 'play'}</span>
          </button>
        )}
      </div>

      <div className="wolfbot-bubble-inner">
        {/* Boot lines */}
        {BOOT_LINES.slice(0, bootLine).map((line, idx) => (
          <p key={idx} className="wolfbot-terminal-line">
            <span className="wbt-prompt">&#62;&nbsp;</span>
            <span className="wbt-boot">{line}</span>
          </p>
        ))}
        {!bootDone && (
          <p className="wolfbot-terminal-line">
            <span className="wbt-prompt">&#62;&nbsp;</span>
            <span className="wbt-boot">{displayedBoot}</span>
            <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
          </p>
        )}

        {/* Voice selector */}
        {bootDone && typeof window !== 'undefined' && !!window.speechSynthesis && (
          <div className="wb-voice-row">
            <span className="wbt-prompt">&#62;&nbsp;</span>
            <span className="wb-voice-label">VOICE</span>
            <div className="wb-voice-select-wrap">
              <select
                className="wb-voice-select"
                value={selectedSlotId}
                onChange={e => handleVoiceChange(e.target.value)}
                aria-label="Select WOLF|BOT voice"
              >
                {availableSlots.map(slot => (
                  <option key={slot.id} value={slot.id}>{slot.label}</option>
                ))}
              </select>
              <span className="wb-voice-chevron" aria-hidden="true">▾</span>
            </div>
          </div>
        )}

        {/* Review text */}
        {bootDone && (
          <>
            <p className="wolfbot-terminal-line wolfbot-terminal-review">
              <span className="wbt-prompt">&#62;&nbsp;</span>
              <span className="wbt-body">{displayedText}</span>
              {cursorVisible && <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>}
            </p>

            {/* Rating — shown after typing completes, own post only */}
            {typingDone && isOwnPost && (
              <RatingWidget postId={postId} initialRating={reviewRating} />
            )}
          </>
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
          <div className="wolfbot-integrated-title">
            <span className="wolfbot-integrated-name">WOLF|BOT</span>
            <span className="wolfbot-integrated-sub">REVIEW MODE</span>
          </div>
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

function LegacyTerminal({ text, promptVersion, pixelGrid, pixelPalette }: {
  text: string; promptVersion: number; pixelGrid?: PixelGrid; pixelPalette?: PixelPalette
}) {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const [revealed,  setRevealed]  = useState(false)
  const [phase,     setPhase]     = useState<'idle' | 'booting' | 'typing' | 'done'>('idle')
  const [bootLine,  setBootLine]  = useState(0)
  const [displayedBoot,   setDisplayedBoot]   = useState('')
  const [displayedReview, setDisplayedReview] = useState('')
  const [cursorVisible,   setCursorVisible]   = useState(true)

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

  const BOOT_LINES = makeBootLines(promptVersion)

  // Auto-start when scrolled into view
  useEffect(() => {
    if (!revealed || phase !== 'idle') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done'); setDisplayedReview(text); setCursorVisible(false); return
    }
    setPhase('booting'); setCursorVisible(true); setDisplayedBoot(''); setBootLine(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed])

  useEffect(() => {
    if (phase !== 'booting') return
    const line = BOOT_LINES[bootLine] ?? null
    if (!line) { setTimeout(() => setPhase('typing'), 300); return }
    setDisplayedBoot(''); let i = 0
    const interval = setInterval(() => {
      if (i >= line.length) { clearInterval(interval); setTimeout(() => { setBootLine(p => p + 1); setDisplayedBoot('') }, 250); return }
      setDisplayedBoot(line.slice(0, i + 1)); i++
    }, 22)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bootLine])

  useEffect(() => {
    if (phase !== 'typing') return
    setDisplayedReview(''); setCursorVisible(true); let i = 0
    const interval = setInterval(() => {
      if (i >= text.length) { clearInterval(interval); setCursorVisible(false); setPhase('done'); return }
      setDisplayedReview(text.slice(0, i + 1)); i++
    }, 3)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, text])

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
      <div className="wolfbot-integrated-header">
        <WolfBotIcon size={72} grid={pixelGrid} palette={pixelPalette} />
        <div className="wolfbot-integrated-title">
          <span className="wolfbot-integrated-name">WOLF|BOT</span>
          <span className="wolfbot-integrated-sub">REVIEW MODE</span>
        </div>
      </div>
      <div className="wolfbot-bubble-inner">
        {(phase === 'booting' || phase === 'typing' || phase === 'done') && (
          <>
            {BOOT_LINES.slice(0, bootLine).map((line, idx) => (
              <p key={idx} className="wolfbot-terminal-line">
                <span className="wbt-prompt">&#62;&nbsp;</span>
                <span className="wbt-boot">{line}</span>
              </p>
            ))}
            {phase === 'booting' && (
              <p className="wolfbot-terminal-line">
                <span className="wbt-prompt">&#62;&nbsp;</span>
                <span className="wbt-boot">{displayedBoot}</span>
                <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
              </p>
            )}
            {(phase === 'typing' || phase === 'done') && (
              <p className="wolfbot-terminal-line wolfbot-terminal-review">
                <span className="wbt-prompt">&#62;&nbsp;</span>
                <span className="wbt-body">{displayedReview}</span>
                {cursorVisible && <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>}
              </p>
            )}
          </>
        )}
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
          promptVersion={promptVersion}
          postId={postId}
          isOwnPost={isOwnPost}
          pixelGrid={pixelGrid}
          pixelPalette={pixelPalette}
        />
      ) : hasLegacy ? (
        <LegacyTerminal
          text={wolfbotReviews!.reviewHelpful || wolfbotReviews!.reviewSassy || ''}
          promptVersion={promptVersion}
          pixelGrid={pixelGrid}
          pixelPalette={pixelPalette}
        />
      ) : hasSynthesis ? (
        <LegacyTerminal text={synthesis!} promptVersion={promptVersion} pixelGrid={pixelGrid} pixelPalette={pixelPalette} />
      ) : (
        <TriggerTerminal postId={postId} pixelGrid={pixelGrid} pixelPalette={pixelPalette} />
      )}
    </section>
  )
}
