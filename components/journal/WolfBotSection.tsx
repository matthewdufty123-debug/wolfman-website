'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WolfBotIcon from '@/components/WolfBotIcon'
import WolfBotLoadingOverlay from '@/components/WolfBotLoadingOverlay'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'

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

// ── Curated voice slots ────────────────────────────────────────────────────────

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
  if (slot.patterns.length === 0) return null // default — no specific voice
  const lower = voices.map(v => ({ voice: v, name: v.name.toLowerCase() }))
  for (const pattern of slot.patterns) {
    const match = lower.find(v => v.name.includes(pattern))
    if (match) return match.voice
  }
  return null
}

// If curated slots don't match, pick up to 4 English voices from the device
function buildFallbackSlots(voices: SpeechSynthesisVoice[]): VoiceSlot[] {
  const english = voices.filter(v => v.lang.startsWith('en')).slice(0, 4)
  return english.map(v => ({ id: v.voiceURI, label: v.name.toUpperCase().slice(0, 16), patterns: [v.name.toLowerCase()] }))
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** State A — reviews exist: boot then tab switcher */
function trackEvent(postId: string, action: string) {
  fetch(`/api/posts/${postId}/wolfbot-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  }).catch(() => {})
}

function NewReviewTerminal({ wolfbotReviews, promptVersion, postId }: { wolfbotReviews: WolfBotReviews; promptVersion: number; postId: string }) {
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
  const [speaking,     setSpeaking]     = useState(false)
  const [availableSlots, setAvailableSlots] = useState<VoiceSlot[]>([VOICE_SLOTS[0]])
  const [selectedSlotId, setSelectedSlotId] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem(VOICE_PREF_KEY) ?? 'default') : 'default'
  )
  const voiceListRef = useRef<SpeechSynthesisVoice[]>([])

  // Load voices — async on Chrome, sync on Safari/Firefox
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    function load() {
      const all = window.speechSynthesis.getVoices()
      if (!all.length) return
      voiceListRef.current = all
      const curated = VOICE_SLOTS.filter(slot =>
        slot.patterns.length === 0 || matchVoice(slot, all) !== null
      )
      // If only DEFAULT matched, fall back to device English voices
      const slots = curated.length > 1 ? curated : [VOICE_SLOTS[0], ...buildFallbackSlots(all)]
      setAvailableSlots(slots)
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  function handleVoiceChange(slotId: string) {
    setSelectedSlotId(slotId)
    localStorage.setItem(VOICE_PREF_KEY, slotId)
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false) }
  }

  // Auto-start if TriggerTerminal saved a personality choice before generating
  useEffect(() => {
    const saved = sessionStorage.getItem('wb-personality-select')
    if (saved && (TAB_ORDER as string[]).includes(saved)) {
      sessionStorage.removeItem('wb-personality-select')
      setActiveTab(saved as Tab)
      setUserTriggered(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, bootLine, userTriggered])

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
    }, 6)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootDone, activeTab])

  // Stop speech when tab changes
  useEffect(() => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [activeTab])

  // Stop speech on unmount
  useEffect(() => {
    return () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel() }
  }, [])

  function handleSpeak() {
    if (!window.speechSynthesis) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    trackEvent(postId, 'play')
    const text = getReviewText(activeTab)
    if (!text) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate  = 0.88
    utterance.pitch = 0.75
    const slot = VOICE_SLOTS.find(s => s.id === selectedSlotId)
    if (slot) {
      const voice = matchVoice(slot, voiceListRef.current)
      if (voice) utterance.voice = voice
    }
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  function handleTabClick(tab: Tab) {
    if (tab === activeTab) return
    trackEvent(postId, tab.toLowerCase())
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
        {/* Personality selector — shown until user triggers */}
        {!userTriggered && (
          <div className="wb-personality-select">
            <p className="wb-personality-prompt">Choose a personality to read the review:</p>
            <div className="wb-personality-grid">
              {TAB_ORDER.map(tab => (
                <button
                  key={tab}
                  type="button"
                  className="wb-personality-btn"
                  onClick={() => { setActiveTab(tab); setUserTriggered(true) }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
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

            {/* Voice selector — shown whenever speech synthesis is available */}
            {typeof window !== 'undefined' && !!window.speechSynthesis && (
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
    trackEvent(postId, 'trigger')
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
          <div className="wb-personality-select">
            <p className="wb-personality-prompt">
              {error ? 'Generation failed — choose a personality to retry:' : 'Choose a personality to generate your review:'}
            </p>
            <div className="wb-personality-grid">
              {TAB_ORDER.map(tab => (
                <button
                  key={tab}
                  type="button"
                  className="wb-personality-btn"
                  disabled={loading}
                  onClick={() => {
                    sessionStorage.setItem('wb-personality-select', tab)
                    handleTrigger()
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
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
    }, 6)
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
      <SectionInfoHeader
        title="WOLF|BOT Review"
        description="An AI companion's perspective on this entry, offered in four distinct personalities."
        popupBody="WOLF|BOT is powered by Claude AI. It reads the journal through four lenses: Helpful is practical and grounded; Intellectual goes deep on themes and meaning; Lovely is warm and encouraging; Sassy is witty and doesn't pull punches. Each review is generated fresh from the journal content."
      />
      {hasNewReviews ? (
        <NewReviewTerminal wolfbotReviews={wolfbotReviews!} promptVersion={promptVersion} postId={postId} />
      ) : synthesis ? (
        <LegacyTerminal synthesis={synthesis} promptVersion={promptVersion} />
      ) : (
        <TriggerTerminal postId={postId} />
      )}
    </section>
  )
}
