'use client'

import { useRef, useEffect, useState } from 'react'

// ── Matthew's WOLF|BOT pixel face grid (25×25) ───────────────────────────────
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

function WolfBotFace({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 25"
      aria-hidden="true"
      style={{ display: 'block', imageRendering: 'pixelated', flexShrink: 0 }}
    >
      {WOLFBOT_GRID.map((row, ri) =>
        row.map((cell, ci) => {
          const fill = PALETTE[cell]
          if (!fill) return null
          return <rect key={`${ri}-${ci}`} x={ci} y={ri} width={1} height={1} fill={fill} />
        })
      )}
    </svg>
  )
}

// ── Random quips — shown idle in terminal ──────────────────────────────────

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

// ── Terminal boot lines ────────────────────────────────────────────────────

const BOOT_LINES = [
  'WOLF|BOT REVIEW INITIATED',
  'PROCESSING JOURNAL ENTRY...',
]

type Phase = 'idle' | 'booting' | 'typing' | 'done'

interface Props {
  synthesis: string | null
}

export default function WolfBotSection({ synthesis }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [revealed, setRevealed]               = useState(false)
  const [phase, setPhase]                     = useState<Phase>('idle')
  const [bootLine, setBootLine]               = useState(0)
  const [displayedBoot, setDisplayedBoot]     = useState('')
  const [displayedReview, setDisplayedReview] = useState('')
  const [cursorVisible, setCursorVisible]     = useState(true)
  const [quip]                                = useState(() => WOLFBOT_QUIPS[Math.floor(Math.random() * WOLFBOT_QUIPS.length)])

  // Scroll reveal — whole terminal fades in
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setRevealed(true); observer.disconnect() }
      },
      { threshold: 0.1 }
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

  // Boot sequence
  useEffect(() => {
    if (phase !== 'booting') return
    const line = BOOT_LINES[bootLine] ?? null
    if (!line) {
      setTimeout(() => setPhase('typing'), 300)
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
  }, [phase, bootLine])

  // Review typewriter
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

      <div
        className="wolfbot-integrated"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {/* Integrated header: face + title */}
        <div className="wolfbot-integrated-header">
          <WolfBotFace size={72} />
          <div className="wolfbot-integrated-title">
            <span className="wolfbot-integrated-name">WOLF|BOT</span>
            <span className="wolfbot-integrated-sub">REVIEW MODE</span>
          </div>
        </div>

        {/* Terminal content */}
        <div className="wolfbot-bubble-inner">
          {/* Yellow review button */}
          <button
            className="wolfbot-yellow-btn"
            onClick={startReview}
            disabled={isActive || isDone}
            aria-label="Start WOLF|BOT review"
          >
            {isActive ? '▌ REVIEWING...' : isDone ? '✦ REVIEW COMPLETE' : '▶ REVIEW JOURNAL'}
          </button>

          {/* Idle quip */}
          {phase === 'idle' && (
            <p className="wolfbot-terminal-line">
              <span className="wbt-prompt">&#62;&nbsp;</span>
              <span className="wbt-quip">{quip}</span>
              <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
            </p>
          )}

          {/* Boot + review output */}
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
    </section>
  )
}
