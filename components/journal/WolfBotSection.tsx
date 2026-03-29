'use client'

import { useRef, useEffect, useState } from 'react'

// ── Matthew's WOLF|BOT pixel face grid (25×25) ───────────────────────────────
// WOLFBOT PALETTE:
//   1 = transparent (background)   2 = #D9D9D9 (Main Fur)   3 = #2E2E2E (Core Facial)
//   4 = #666666 (Alt Facial)       5 = #4A90C4 (Outer Eye)  6 = #C6DDEA (Inner Eye)
//   7 = #BB9040 (Tongue/Bronze)    8 = #E8A0B0 (Heart/Blush)
//   9 = #BF7E54 (Object/Copper)   10 = #A72525 (Angry)

const WOLFBOT_GRID = [
  [1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1],
  [1,1,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,2,2,2,2,1,1,1,1],
  [1,1,1,2,3,3,2,2,1,1,1,1,1,1,1,1,2,2,3,3,2,2,1,1,1],
  [1,1,1,2,3,3,3,2,1,1,1,1,1,1,1,1,2,2,3,3,3,2,1,1,1],
  [1,1,2,2,3,3,3,2,2,1,1,1,1,1,1,1,2,2,3,3,3,2,2,1,1],
  [1,2,2,3,3,3,3,3,2,2,1,1,1,1,1,2,2,3,3,3,3,3,2,1,1],
  [1,2,3,3,3,3,3,3,3,2,2,2,2,2,2,2,3,3,3,3,3,3,2,1,1],
  [2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1],
  [2,2,3,3,9,9,9,9,9,9,9,3,3,3,9,9,9,9,9,9,9,3,3,2,1],
  [2,2,3,3,9,9,9,9,9,9,9,3,3,3,9,9,9,9,9,9,9,3,3,2,1],
  [2,2,3,3,3,3,3,5,5,5,3,3,3,3,3,3,3,3,5,5,5,3,2,2,1],
  [1,2,2,3,3,3,3,5,5,5,3,3,3,3,3,3,3,3,5,5,5,3,2,2,1],
  [1,1,2,3,3,3,3,3,3,3,3,2,2,2,3,3,3,3,3,3,3,2,2,1,1],
  [1,1,2,3,3,3,3,3,3,2,2,2,2,2,2,2,3,3,3,3,3,2,2,1,1],
  [1,1,2,2,3,3,3,3,2,3,3,3,3,3,3,3,2,3,3,3,2,2,1,1,1],
  [1,1,2,2,3,3,3,2,2,2,3,3,3,3,3,2,2,2,3,3,2,2,1,1,1],
  [1,1,1,2,3,3,2,2,3,2,2,2,2,2,2,2,3,2,2,2,2,1,1,1,1],
  [1,1,1,2,2,2,2,3,3,3,2,2,2,2,2,3,3,3,2,2,2,1,1,1,1],
  [1,1,1,1,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,2,1,1,1,1,1],
  [1,1,1,1,2,2,3,3,3,9,9,9,9,9,9,9,3,3,3,2,1,1,1,1,1],
  [1,1,1,1,1,2,2,3,3,9,9,9,9,9,9,9,3,3,2,1,1,1,1,1,1],
  [1,1,1,1,1,2,2,3,3,3,3,3,3,3,3,3,3,3,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,3,3,3,3,3,3,3,3,3,3,3,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,2,3,3,3,3,3,3,3,3,3,2,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1],
]

const PALETTE: Record<number, string> = {
  2:  '#D9D9D9',
  3:  '#2E2E2E',
  4:  '#666666',
  5:  '#4A90C4',
  6:  '#C6DDEA',
  7:  '#BB9040',
  8:  '#E8A0B0',
  9:  '#BF7E54',
  10: '#A72525',
}

function WolfBotFace({ size = 100 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 25"
      aria-hidden="true"
      style={{ display: 'block', imageRendering: 'pixelated' }}
    >
      {WOLFBOT_GRID.map((row, ri) =>
        row.map((cell, ci) => {
          const fill = PALETTE[cell]
          if (!fill) return null
          return (
            <rect
              key={`${ri}-${ci}`}
              x={ci}
              y={ri}
              width={1}
              height={1}
              fill={fill}
            />
          )
        })
      )}
    </svg>
  )
}

// ── Random quips — shown in bubble on scroll ───────────────────────────────

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

// ── Terminal boot lines — shown after button click ─────────────────────────

const BOOT_LINES = [
  'WOLF|BOT REVIEW INITIATED',
  'PROCESSING JOURNAL ENTRY...',
]

type Phase = 'idle' | 'booting' | 'typing' | 'done'

// ── Main section ─────────────────────────────────────────────────────────────

interface Props {
  synthesis: string | null
}

export default function WolfBotSection({ synthesis }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [quipVisible, setQuipVisible] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [bootLine, setBootLine] = useState(0)       // which boot line we're on
  const [displayedBoot, setDisplayedBoot] = useState('')
  const [displayedReview, setDisplayedReview] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [quip] = useState(() => WOLFBOT_QUIPS[Math.floor(Math.random() * WOLFBOT_QUIPS.length)])

  // Scroll reveal — face + quip appear
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      setQuipVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          setTimeout(() => setQuipVisible(true), 300)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function startReview() {
    if (phase !== 'idle' || !synthesis) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done')
      setDisplayedReview(synthesis)
      setCursorVisible(false)
      return
    }
    setPhase('booting')
    setCursorVisible(true)
    setDisplayedBoot('')
    setBootLine(0)
  }

  // Boot sequence — types out boot lines one by one
  useEffect(() => {
    if (phase !== 'booting') return
    const line = BOOT_LINES[bootLine] ?? null
    if (!line) {
      // All boot lines done — move to review typing
      setTimeout(() => {
        setPhase('typing')
      }, 300)
      return
    }
    setDisplayedBoot('')
    let i = 0
    const interval = setInterval(() => {
      if (i >= line.length) {
        clearInterval(interval)
        // Pause then move to next line
        setTimeout(() => {
          setBootLine(prev => prev + 1)
          setDisplayedBoot('')
        }, 250)
        return
      }
      setDisplayedBoot(line.slice(0, i + 1))
      i++
    }, 22)
    return () => clearInterval(interval)
  }, [phase, bootLine])

  // Review typewriter — fires when phase = 'typing'
  useEffect(() => {
    if (phase !== 'typing' || !synthesis) return
    setDisplayedReview('')
    setCursorVisible(true)
    let i = 0
    const interval = setInterval(() => {
      if (i >= synthesis.length) {
        clearInterval(interval)
        setCursorVisible(false)
        setPhase('done')
        return
      }
      setDisplayedReview(synthesis.slice(0, i + 1))
      i++
    }, 12)
    return () => clearInterval(interval)
  }, [phase, synthesis])

  if (!synthesis) {
    return (
      <section id="wolfbot-review" className="journal-section">
        <h2 className="journal-section-title">WOLF|BOT Review</h2>
        <p className="journal-section-empty">No WOLF|BOT review yet.</p>
      </section>
    )
  }

  const isActive = phase === 'booting' || phase === 'typing'
  const isDone   = phase === 'done'

  return (
    <section ref={sectionRef} id="wolfbot-review" className="journal-section">
      <h2 className="journal-section-title">WOLF|BOT Review</h2>

      {/* Full-width button — first thing seen on scroll */}
      <button
        className="wolfbot-review-btn wolfbot-review-btn--full"
        onClick={startReview}
        disabled={isActive || isDone}
        aria-label="Start WOLF|BOT review"
      >
        {isActive ? '▌ REVIEWING...' : isDone ? '✦ REVIEW COMPLETE' : '▶ REVIEW JOURNAL'}
      </button>

      <div className="wolfbot-layout">
        <div className="wolfbot-face-row">
          {/* Pixel face */}
          <div
            className="wolfbot-face-wrap"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'scale(1)' : 'scale(0.85)',
              transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
            }}
          >
            <WolfBotFace size={100} />
          </div>

          {/* Terminal speech bubble */}
          <div
            className="wolfbot-bubble wolfbot-bubble--terminal"
            style={{
              opacity: quipVisible ? 1 : 0,
              transition: 'opacity 0.4s ease 0.2s',
            }}
          >
            <div className="wolfbot-terminal-bar">
              <span className="wolfbot-terminal-dot wbt-red" />
              <span className="wolfbot-terminal-dot wbt-amber" />
              <span className="wolfbot-terminal-dot wbt-green" />
              <span className="wolfbot-terminal-label">WOLF|BOT v2.0</span>
            </div>

            <div className="wolfbot-bubble-inner">
              {phase === 'idle' && (
                <p className="wolfbot-terminal-line">
                  <span className="wbt-prompt">&#62;&nbsp;</span>
                  <span className="wbt-quip">{quip}</span>
                  <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
                </p>
              )}

              {(phase === 'booting' || phase === 'typing' || phase === 'done') && (
                <>
                  {/* Completed boot lines */}
                  {BOOT_LINES.slice(0, bootLine).map((line, idx) => (
                    <p key={idx} className="wolfbot-terminal-line">
                      <span className="wbt-prompt">&#62;&nbsp;</span>
                      <span className="wbt-boot">{line}</span>
                    </p>
                  ))}

                  {/* Currently typing boot line */}
                  {phase === 'booting' && (
                    <p className="wolfbot-terminal-line">
                      <span className="wbt-prompt">&#62;&nbsp;</span>
                      <span className="wbt-boot">{displayedBoot}</span>
                      <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
                    </p>
                  )}

                  {/* Review text */}
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
        </div>
      </div>
    </section>
  )
}
