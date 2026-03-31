'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WolfBotIcon from '@/components/WolfBotIcon'
import WolfBotLoadingOverlay from '@/components/WolfBotLoadingOverlay'

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'HELPFUL' | 'INTELLECTUAL' | 'LOVELY' | 'SASSY'

export type WolfBotReviews = {
  reviewHelpful:      string | null
  reviewIntellectual: string | null
  reviewLovely:       string | null
  reviewSassy:        string | null
}

interface Props {
  synthesis:       string | null
  wolfbotReviews:  WolfBotReviews | null
  isOwnPost:       boolean
  postId:          string
  promptVersion:   number
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

const TAB_ORDER: Tab[] = ['HELPFUL', 'INTELLECTUAL', 'LOVELY', 'SASSY']

// ── Sub-components ────────────────────────────────────────────────────────────

/** State A — reviews exist: boot then tab switcher */
function NewReviewTerminal({ wolfbotReviews, promptVersion }: { wolfbotReviews: WolfBotReviews; promptVersion: number }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [revealed,     setRevealed]     = useState(false)
  const [userTriggered,setUserTriggered]= useState(false)
  const [bootLine,     setBootLine]     = useState(0)
  const [displayedBoot,setDisplayedBoot]= useState('')
  const [bootDone,     setBootDone]     = useState(false)
  const [activeTab,    setActiveTab]    = useState<Tab>('HELPFUL')
  const [displayedText,setDisplayedText]= useState('')
  const [typedTabs,    setTypedTabs]    = useState<Set<Tab>>(new Set())
  const [cursorVisible,setCursorVisible]= useState(true)

  function getReviewText(tab: Tab): string | null {
    switch (tab) {
      case 'HELPFUL':      return wolfbotReviews.reviewHelpful
      case 'INTELLECTUAL': return wolfbotReviews.reviewIntellectual
      case 'LOVELY':       return wolfbotReviews.reviewLovely
      case 'SASSY':        return wolfbotReviews.reviewSassy
    }
  }

  // Scroll reveal
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const BOOT_LINES = makeBootLines(promptVersion)

  // Boot sequence
  useEffect(() => {
    if (!revealed || !userTriggered) return
    const line = BOOT_LINES[bootLine] ?? null
    if (!line) {
      setTimeout(() => {
        setBootDone(true)
        setCursorVisible(true)
      }, 300)
      return
    }
    setDisplayedBoot('')
    let i = 0
    const interval = setInterval(() => {
      if (i >= line.length) {
        clearInterval(interval)
        setTimeout(() => { setBootLine(prev => prev + 1); setDisplayedBoot('') }, 250)
        return
      }
      setDisplayedBoot(line.slice(0, i + 1))
      i++
    }, 22)
    return () => clearInterval(interval)
  }, [revealed, bootLine])

  // Typewriter for active tab (runs once per tab)
  useEffect(() => {
    if (!bootDone) return
    const text = getReviewText(activeTab)
    if (!text) { setDisplayedText('(No review available for this personality.)'); return }

    if (typedTabs.has(activeTab)) {
      // Already typed — show instantly
      setDisplayedText(text)
      setCursorVisible(false)
      return
    }

    // First time — type it
    setDisplayedText('')
    setCursorVisible(true)
    let i = 0
    const interval = setInterval(() => {
      if (i >= text.length) {
        clearInterval(interval)
        setCursorVisible(false)
        setTypedTabs(prev => new Set(prev).add(activeTab))
        return
      }
      setDisplayedText(text.slice(0, i + 1))
      i++
    }, 12)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootDone, activeTab])

  function handleTabClick(tab: Tab) {
    if (tab === activeTab) return
    setActiveTab(tab)
  }

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
        <WolfBotIcon size={72} />
        <div className="wolfbot-integrated-title">
          <span className="wolfbot-integrated-name">WOLF|BOT</span>
          <span className="wolfbot-integrated-sub">REVIEW MODE</span>
        </div>
      </div>

      <div className="wolfbot-bubble-inner">
        {/* Generate button — shown until user triggers */}
        {!userTriggered && (
          <button
            className="wolfbot-yellow-btn"
            onClick={() => setUserTriggered(true)}
          >
            ▶ GENERATE WOLF|BOT REVIEW
          </button>
        )}

        {/* Boot lines */}
        {userTriggered && BOOT_LINES.slice(0, bootLine).map((line, idx) => (
          <p key={idx} className="wolfbot-terminal-line">
            <span className="wbt-prompt">&#62;&nbsp;</span>
            <span className="wbt-boot">{line}</span>
          </p>
        ))}
        {userTriggered && !bootDone && (
          <p className="wolfbot-terminal-line">
            <span className="wbt-prompt">&#62;&nbsp;</span>
            <span className="wbt-boot">{displayedBoot}</span>
            <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
          </p>
        )}

        {/* Tab switcher + review — shown after boot */}
        {userTriggered && bootDone && (
          <>
            <div className="wb-tabs">
              {TAB_ORDER.map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`wb-tab${activeTab === tab ? ' wb-tab--active' : ''}`}
                  onClick={() => handleTabClick(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <p className="wolfbot-terminal-line wolfbot-terminal-review">
              <span className="wbt-prompt">&#62;&nbsp;</span>
              <span className="wbt-body">{displayedText}</span>
              {cursorVisible && <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/** State B — no reviews, own post: trigger button */
function TriggerTerminal({ postId }: { postId: string }) {
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
          <WolfBotIcon size={72} />
          <div className="wolfbot-integrated-title">
            <span className="wolfbot-integrated-name">WOLF|BOT</span>
            <span className="wolfbot-integrated-sub">REVIEW MODE</span>
          </div>
        </div>
        <div className="wolfbot-bubble-inner">
          <button
            className="wolfbot-yellow-btn"
            onClick={handleTrigger}
            disabled={loading}
          >
            {error ? '▶ RETRY WOLF|BOT REVIEW' : '▶ GENERATE WOLF|BOT REVIEW'}
          </button>
          {error && (
            <p className="wolfbot-terminal-line">
              <span className="wbt-prompt">&#62;&nbsp;</span>
              <span className="wbt-error">Generation failed. Try again.</span>
            </p>
          )}
        </div>
      </div>
    </>
  )
}

/** Legacy fallback — synthesis only, no personality reviews */
function LegacyTerminal({ synthesis, promptVersion }: { synthesis: string; promptVersion: number }) {
  const sectionRef                              = useRef<HTMLDivElement>(null)
  const [revealed,     setRevealed]             = useState(false)
  const [phase,        setPhase]                = useState<'idle' | 'booting' | 'typing' | 'done'>('idle')
  const [bootLine,     setBootLine]             = useState(0)
  const [displayedBoot,setDisplayedBoot]        = useState('')
  const [displayedReview, setDisplayedReview]   = useState('')
  const [cursorVisible, setCursorVisible]       = useState(true)
  const [quip]                                  = useState(() => WOLFBOT_QUIPS[Math.floor(Math.random() * WOLFBOT_QUIPS.length)])

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

  function startReview() {
    if (phase !== 'idle') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done'); setDisplayedReview(synthesis); setCursorVisible(false); return
    }
    setPhase('booting'); setCursorVisible(true); setDisplayedBoot(''); setBootLine(0)
  }

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
  }, [phase, bootLine])

  useEffect(() => {
    if (phase !== 'typing') return
    setDisplayedReview(''); setCursorVisible(true); let i = 0
    const interval = setInterval(() => {
      if (i >= synthesis.length) { clearInterval(interval); setCursorVisible(false); setPhase('done'); return }
      setDisplayedReview(synthesis.slice(0, i + 1)); i++
    }, 12)
    return () => clearInterval(interval)
  }, [phase, synthesis])

  const isActive = phase === 'booting' || phase === 'typing'
  const isDone   = phase === 'done'

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
        <WolfBotIcon size={72} />
        <div className="wolfbot-integrated-title">
          <span className="wolfbot-integrated-name">WOLF|BOT</span>
          <span className="wolfbot-integrated-sub">REVIEW MODE</span>
        </div>
      </div>
      <div className="wolfbot-bubble-inner">
        <button
          className="wolfbot-yellow-btn"
          onClick={startReview}
          disabled={isActive || isDone}
        >
          {isActive ? '▌ REVIEWING...' : isDone ? '✦ REVIEW COMPLETE' : '▶ REVIEW JOURNAL'}
        </button>
        {phase === 'idle' && (
          <p className="wolfbot-terminal-line">
            <span className="wbt-prompt">&#62;&nbsp;</span>
            <span className="wbt-quip">{quip}</span>
            <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
          </p>
        )}
        {(isActive || isDone) && (
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
            {(phase === 'typing' || isDone) && (
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

export default function WolfBotSection({ synthesis, wolfbotReviews, isOwnPost, postId, promptVersion }: Props) {
  const hasNewReviews = wolfbotReviews && (
    wolfbotReviews.reviewHelpful ||
    wolfbotReviews.reviewIntellectual ||
    wolfbotReviews.reviewLovely ||
    wolfbotReviews.reviewSassy
  )

  // State C — nothing to show
  if (!hasNewReviews && !synthesis && !isOwnPost) return null

  return (
    <section id="wolfbot-review" className="journal-section">
      <h2 className="journal-section-title">WOLF|BOT Review</h2>
      {hasNewReviews ? (
        <NewReviewTerminal wolfbotReviews={wolfbotReviews!} promptVersion={promptVersion} />
      ) : synthesis ? (
        <LegacyTerminal synthesis={synthesis} promptVersion={promptVersion} />
      ) : (
        <TriggerTerminal postId={postId} />
      )}
    </section>
  )
}
