'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import WolfBotIcon from '@/components/WolfBotIcon'

export const metadata = undefined // suppressed — client component

const PAGE_BOOT_SETS = [
  [
    'WOLF|BOT v0.0.1-alpha INITIALISING...',
    'SEARCH ENGINE: OFFLINE',
    'STAND BY...',
  ],
  [
    'LOADING WOLF BRAIN v4.2.0...',
    'SNIFFING FOR SEARCH INDEX... NOPE',
    'STANDING BY ANYWAY.',
  ],
  [
    'NEURAL PATHWAYS CALIBRATED',
    'SEARCH CORPUS: 0 ITEMS',
    'OPTIMISTIC. I LIKE IT.',
  ],
]

type BootPhase = 'idle' | 'booting' | 'done'

export default function WolfBotPage() {
  const [bootPhase, setBootPhase]           = useState<BootPhase>('idle')
  const [bootSetIdx]                        = useState(() => Math.floor(Math.random() * PAGE_BOOT_SETS.length))
  const [bootLineIdx, setBootLineIdx]       = useState(0)
  const [displayedBoot, setDisplayedBoot]   = useState('')
  const [bootDone, setBootDone]             = useState(false)
  const [searchInput, setSearchInput]       = useState('')
  const [searchErrors, setSearchErrors]     = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-start boot on mount
  useEffect(() => {
    const t = setTimeout(() => setBootPhase('booting'), 600)
    return () => clearTimeout(t)
  }, [])

  // Boot line typer
  useEffect(() => {
    if (bootPhase !== 'booting') return
    const lines = PAGE_BOOT_SETS[bootSetIdx]
    const line = lines[bootLineIdx] ?? null
    if (!line) {
      setBootPhase('done')
      setBootDone(true)
      setTimeout(() => inputRef.current?.focus(), 150)
      return
    }
    setDisplayedBoot('')
    let i = 0
    const interval = setInterval(() => {
      if (i >= line.length) {
        clearInterval(interval)
        setTimeout(() => { setBootLineIdx(prev => prev + 1); setDisplayedBoot('') }, 280)
        return
      }
      setDisplayedBoot(line.slice(0, i + 1))
      i++
    }, 20)
    return () => clearInterval(interval)
  }, [bootPhase, bootLineIdx, bootSetIdx])

  function handleSearch(e: React.KeyboardEvent) {
    if (e.key !== 'Enter' || !searchInput.trim()) return
    setSearchErrors(prev => [...prev, searchInput.trim()])
    setSearchInput('')
  }

  return (
    <main className="wolfbot-page wolfbot-page--full">
      <div className="wolfbot-integrated wolfbot-page-terminal">

        {/* Integrated header */}
        <div className="wolfbot-integrated-header">
          <WolfBotIcon size={72} className="wolfbot-page-icon" />
          <div className="wolfbot-integrated-title">
            <span className="wolfbot-integrated-name">WOLF|BOT</span>
            <span className="wolfbot-integrated-sub">SEARCH &amp; ASSIST</span>
          </div>
        </div>

        {/* Terminal content */}
        <div className="wolfbot-bubble-inner wolfbot-page-content">

          {/* Completed boot lines */}
          {(bootPhase === 'booting' || bootDone) &&
            PAGE_BOOT_SETS[bootSetIdx].slice(0, bootLineIdx).map((line, idx) => (
              <p key={idx} className="wolfbot-terminal-line">
                <span className="wbt-prompt">&gt;&nbsp;</span>
                <span className="wbt-boot">{line}</span>
              </p>
            ))
          }

          {/* Currently typing boot line */}
          {bootPhase === 'booting' && (
            <p className="wolfbot-terminal-line">
              <span className="wbt-prompt">&gt;&nbsp;</span>
              <span className="wbt-boot">{displayedBoot}</span>
              <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
            </p>
          )}

          {/* Idle cursor */}
          {bootPhase === 'idle' && (
            <p className="wolfbot-terminal-line">
              <span className="wbt-prompt">&gt;&nbsp;</span>
              <span className="wolfbot-type-cursor" aria-hidden="true">▌</span>
            </p>
          )}

          {/* Search attempts + offline errors */}
          {searchErrors.map((query, idx) => (
            <div key={idx}>
              <p className="wolfbot-terminal-line">
                <span className="wbt-prompt">&gt;&nbsp;</span>
                <span className="wbt-boot">{query}</span>
              </p>
              <p className="wolfbot-terminal-line">
                <span className="wbt-prompt">&gt;&nbsp;</span>
                <span className="wbt-error">SEARCH OFFLINE — feature under development.</span>
              </p>
            </div>
          ))}

          {/* Search prompt — shown after boot */}
          {bootDone && (
            <>
              <p className="wolfbot-terminal-line more-pages-wolfbot-prompt-label">
                What would you like to search for?
              </p>
              <div className="more-pages-wolfbot-input-row">
                <span className="wbt-prompt">&gt;&nbsp;</span>
                <input
                  ref={inputRef}
                  type="text"
                  className="more-pages-wolfbot-input"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="type and press Enter..."
                  aria-label="Search WOLF|BOT"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </>
          )}

          {/* Dev Log link — pinned to bottom */}
          <div className="wolfbot-page-footer">
            <Link href="/dev" className="wolfbot-dev-log-link">
              View Dev Log →
            </Link>
          </div>

        </div>
      </div>
    </main>
  )
}
