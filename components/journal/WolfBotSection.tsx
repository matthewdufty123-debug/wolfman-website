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
  const cellSize = size / 25
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

// ── Random quip list ──────────────────────────────────────────────────────────

const WOLFBOT_QUIPS = [
  'Here we go',
  "Let's review this thing",
  "Alright, let's see what we've got",
  'Running analysis...',
  'Processing your day...',
  'Loading my thoughts...',
  'Let me take a look',
  'Interesting choices today',
  'Time for my take',
  'Stand by...',
]

// ── Main section ─────────────────────────────────────────────────────────────

interface Props {
  synthesis: string | null
}

export default function WolfBotSection({ synthesis }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [quip, setQuip] = useState(() => WOLFBOT_QUIPS[Math.floor(Math.random() * WOLFBOT_QUIPS.length)])
  const [quipVisible, setQuipVisible] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(false)

  function startReview() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      setDisplayedText(synthesis ?? '')
      setQuipVisible(true)
      return
    }
    // Pick a new random quip on replay
    setQuip(WOLFBOT_QUIPS[Math.floor(Math.random() * WOLFBOT_QUIPS.length)])
    setDisplayedText('')
    setQuipVisible(false)
    setCursorVisible(false)
    setRevealed(false)
    setTimeout(() => {
      setRevealed(true)
      setTimeout(() => setQuipVisible(true), 300)
      setTimeout(() => setCursorVisible(true), 700)
    }, 50)
  }

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      setDisplayedText(synthesis ?? '')
      setQuipVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
          setTimeout(() => setQuipVisible(true), 300)
          setTimeout(() => setCursorVisible(true), 700)
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [synthesis])

  // Typewriter effect — fires once quip is visible and synthesis exists
  useEffect(() => {
    if (!quipVisible || !synthesis) return
    const chars = synthesis.split('')
    let i = 0
    const interval = setInterval(() => {
      if (i >= chars.length) {
        clearInterval(interval)
        setCursorVisible(false)
        return
      }
      setDisplayedText(synthesis.slice(0, i + 1))
      i++
    }, 12)
    return () => clearInterval(interval)
  }, [quipVisible, synthesis])

  if (!synthesis) {
    return (
      <section id="wolfbot-review" className="journal-section">
        <h2 className="journal-section-title">WOLF|BOT Review</h2>
        <p className="journal-section-empty">No WOLF|BOT review yet.</p>
      </section>
    )
  }

  return (
    <section ref={sectionRef} id="wolfbot-review" className="journal-section">
      <div className="journal-section-header">
        <h2 className="journal-section-title">WOLF|BOT Review</h2>
        <button className="wolfbot-review-btn" onClick={startReview} aria-label="Replay WOLF|BOT review">
          ▶ Review Journal
        </button>
      </div>

      <div className="wolfbot-layout">
        {/* Quip line */}
        <div
          className="wolfbot-quip"
          style={{
            opacity: quipVisible ? 1 : 0,
            transform: quipVisible ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          <span className="wolfbot-quip-text">&gt; {quip}</span>
          <span className="wolfbot-quip-cursor" aria-hidden="true" />
        </div>

        {/* Face + bubble row */}
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

          {/* Speech bubble */}
          <div
            className="wolfbot-bubble"
            style={{
              opacity: quipVisible ? 1 : 0,
              transition: 'opacity 0.3s ease 0.2s',
            }}
          >
            <div className="wolfbot-bubble-inner">
              <span className="wolfbot-bubble-text">
                {displayedText}
                {cursorVisible && <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
