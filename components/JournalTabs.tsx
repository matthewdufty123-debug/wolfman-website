'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { ProcessedPost, ParsedSection } from '@/lib/posts'
import MorningRitualIconBar from '@/components/MorningRitualIconBar'
import MorningScaleBar from '@/components/MorningScaleBar'
import EveningReflection from '@/components/EveningReflection'
import WolfLogo from '@/components/WolfLogo'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface JournalTabsProps {
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
    routineChecklist: Record<string, boolean>
  } | null
  eveningReflection: {
    reflection: string
    wentToPlan: boolean
    dayRating: number
  } | null
  dayScores: {
    scores: Record<string, number>
    synthesis: string
    dataCompleteness: string
  } | null
  postDates: {
    createdAt: string
    updatedAt: string
  } | null
  authorId: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAIN_LABELS: [string, string, string, string, string, string] = ['Peaceful', 'Quiet', 'Active', 'Busy', 'Racing', 'Manic']
const BODY_LABELS:  [string, string, string, string, string, string] = ['Lethargic', 'Slow', 'Steady', 'Energised', 'Strong', 'Buzzing']
const HAPPY_LABELS: [string, string, string, string, string, string] = ['Far from happy', 'Low', 'Okay', 'Good', 'Happy', 'Joyful']

const COMPLETENESS_LABELS: Record<string, string> = {
  post_only:            'from intention alone',
  post_morning:         'from intention + morning state',
  post_morning_evening: 'from full day data',
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatPostDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  const suffix = [1, 21, 31].includes(day) ? 'st' : [2, 22].includes(day) ? 'nd'
               : [3, 23].includes(day) ? 'rd' : 'th'
  return `${day}${suffix} ${months[month - 1]} ${year}`
}

function formatISODate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Post renderers ────────────────────────────────────────────────────────────

function MorningIntentionPost({ post }: { post: ProcessedPost }) {
  const hasSections = post.sections && post.sections.length > 0
  return (
    <article className="post">
      {hasSections
        ? post.sections!.map((section: ParsedSection) => (
            <div key={section.label} className="post-section">
              <p className="post-section-label">{section.label}</p>
              <div className="post-body" dangerouslySetInnerHTML={{ __html: section.html }} />
            </div>
          ))
        : <div className="post-body" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      }
    </article>
  )
}

function MorningWalkPost({ post }: { post: ProcessedPost }) {
  return (
    <article className="post post--walk">
      {post.contextHtml && (
        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.contextHtml }} />
      )}
      {post.videoId && (
        <div className="post-video">
          <iframe
            src={`https://www.youtube.com/embed/${post.videoId}?rel=0`}
            allowFullScreen
            loading="lazy"
            title={post.title}
          />
        </div>
      )}
    </article>
  )
}

// ── WOLF|BOT face SVG ─────────────────────────────────────────────────────────

function WolfBotFaceSvg() {
  return (
    <svg width="80" height="80" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="9,22 16,4 23,22" fill="#4A7FA5"/>
      <polygon points="33,22 40,4 47,22" fill="#4A7FA5"/>
      <polygon points="12,22 16,10 20,22" fill="#214459"/>
      <polygon points="36,22 40,10 44,22" fill="#214459"/>
      <rect x="7" y="20" width="42" height="30" rx="6" fill="#214459" stroke="#4A7FA5" strokeWidth="1.5"/>
      <rect x="12" y="26" width="13" height="10" rx="2" fill="#193343"/>
      <rect x="31" y="26" width="13" height="10" rx="2" fill="#193343"/>
      <rect x="14" y="28" width="9" height="6" rx="1" fill="#C8B020"/>
      <rect x="33" y="28" width="9" height="6" rx="1" fill="#C8B020"/>
      <rect x="16" y="40" width="5" height="3" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="25" y="40" width="6" height="3" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="35" y="40" width="5" height="3" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="27" y="11" width="2" height="10" rx="1" fill="#4A7FA5"/>
      <circle cx="28" cy="9" r="3" fill="#C8B020"/>
    </svg>
  )
}

// ── Orb SVGs ──────────────────────────────────────────────────────────────────

function WolfOrbSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 3 L7 9 L2 11 L5 15 Q6 19 12 20 Q18 19 19 15 L22 11 L17 9 L20 3 L14 8 L12 7 L10 8 Z" />
      <circle cx="9.5" cy="14" r="1" fill="currentColor" />
      <circle cx="14.5" cy="14" r="1" fill="currentColor" />
    </svg>
  )
}

function MoonOrbSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SquareOrbSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
    </svg>
  )
}

// ── Tab sub-components ────────────────────────────────────────────────────────

function TabJournal({ post }: { post: ProcessedPost }) {
  return post.category === 'morning-walk'
    ? <MorningWalkPost post={post} />
    : <MorningIntentionPost post={post} />
}

function TabStats({ ms, username }: {
  ms: JournalTabsProps['morningState']
  username: string
}) {
  if (!ms) {
    return <div className="tab-empty-state">No morning data for this day.</div>
  }
  return (
    <div className="post-day-block">
      <p className="post-day-block-label">How the morning started</p>

      <div className="post-day-routine-icons">
        <span className="post-day-ritual-label">Morning Rituals</span>
        <MorningRitualIconBar checklist={ms.routineChecklist} size={20} />
      </div>

      <div className="post-day-scales">
        <div className="post-day-scale-col">
          <span className="post-day-scale-name">Brain Activity</span>
          <MorningScaleBar scaleName="Brain Activity" value={ms.brainScale} labels={BRAIN_LABELS} color="#4A7FA5" />
        </div>
        <div className="post-day-scale-col">
          <span className="post-day-scale-name">Body Energy</span>
          <MorningScaleBar scaleName="Body Energy" value={ms.bodyScale} labels={BODY_LABELS} color="#A0622A" />
        </div>
        {ms.happyScale != null && (
          <div className="post-day-scale-col">
            <span className="post-day-scale-name">Happy Scale</span>
            <MorningScaleBar scaleName="Happy Scale" value={ms.happyScale} labels={HAPPY_LABELS} color="#3AB87A" />
          </div>
        )}
      </div>

      <a
        href={`/${username}`}
        style={{
          display: 'block',
          textAlign: 'center',
          background: '#214459',
          color: '#fff',
          borderRadius: 10,
          padding: '0.85rem 1.5rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          textDecoration: 'none',
          marginTop: '1.5rem',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          letterSpacing: '0.01em',
        }}
      >
        View morning stats →
      </a>
    </div>
  )
}

function TabWolfbot({ ds, post }: {
  ds: JournalTabsProps['dayScores']
  post: ProcessedPost
}) {
  const text = ds?.synthesis ?? post.review ?? null

  if (!text) return <div className="tab-empty-state">No synthesis yet.</div>

  return (
    <div className="wolfbot-review-wrap">
      <div className="wolfbot-review-face">
        <WolfBotFaceSvg />
      </div>
      <p className="wolfbot-review-label">here is my review.</p>
      <div className="wolfbot-review-body">
        {text.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  )
}

function TabEvening({ er, postId, authorId, isOwner, eveningOpen, setEveningOpen }: {
  er: JournalTabsProps['eveningReflection']
  postId: string
  authorId: string | null
  isOwner: boolean
  eveningOpen: boolean
  setEveningOpen: (open: boolean) => void
}) {
  return (
    <>
      {er ? (
        <div className="post-day-block">
          <p className="post-day-block-label">How the day ended</p>

          <div className="post-day-reflection-text">
            {er.reflection.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="post-day-evening-meta">
            <div className="post-day-went-to-plan" data-yes={er.wentToPlan}>
              {er.wentToPlan ? '✓ Went to plan' : '~ Not quite to plan'}
            </div>
            <div className="post-day-rating">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="post-day-rating-pip" data-active={n <= er.dayRating} />
              ))}
              <span className="post-day-rating-label">{er.dayRating}/6</span>
            </div>
          </div>

          {isOwner && (
            <button
              className="tab-evening-edit-btn"
              onClick={() => setEveningOpen(true)}
            >
              Edit reflection
            </button>
          )}
        </div>
      ) : isOwner ? (
        <div className="tab-empty-state tab-empty-state--cta">
          <button
            className="tab-evening-cta-btn"
            onClick={() => setEveningOpen(true)}
          >
            Add your evening reflection
          </button>
        </div>
      ) : (
        <div className="tab-empty-state">No evening reflection added.</div>
      )}

      {isOwner && postId && (
        <EveningReflection
          postId={postId}
          authorId={authorId}
          open={eveningOpen}
          onClose={() => setEveningOpen(false)}
        />
      )}
    </>
  )
}

function TabMeta({ post, author, authorName, username, postDates }: {
  post: ProcessedPost
  author: JournalTabsProps['author']
  authorName: string
  username: string
  postDates: JournalTabsProps['postDates']
}) {
  return (
    <>
      <div className="post-reading-end">
        <p className="post-reading-end-label">You have been reading</p>
        <p className="post-reading-end-title">{post.title}</p>
        <p className="post-reading-end-date">Posted {formatPostDate(post.date)}</p>
        {postDates && (
          <p className="post-reading-end-date" style={{ opacity: 0.5, fontSize: '0.78rem', marginTop: '0.25rem' }}>
            Created {formatISODate(postDates.createdAt)}
            {postDates.updatedAt !== postDates.createdAt && ` · Updated ${formatISODate(postDates.updatedAt)}`}
          </p>
        )}
      </div>

      <div className="tab-meta-logo-wrap">
        <a href="/">
          <WolfLogo size={56} />
        </a>
      </div>

      <div className="post-author-review-wrap">
        <a href={`/${username}`} className="post-author">
          {(author.avatar ?? author.image) ? (
            <img
              src={author.avatar ?? author.image ?? ''}
              alt={authorName}
              className="post-author-photo"
            />
          ) : (
            <div
              className="post-author-photo"
              style={{
                background: '#4A7FA5', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 700, borderRadius: '50%',
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              {authorName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          )}
          <div>
            <p className="post-author-byline">This post was written by</p>
            <p className="post-author-name">{authorName}</p>
            {author.bio && (
              <p className="post-author-bio">{author.bio}</p>
            )}
          </div>
        </a>
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JournalTabs({
  post,
  username,
  author,
  morningState,
  eveningReflection,
  dayScores,
  postDates,
  authorId,
}: JournalTabsProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [visible, setVisible] = useState(true)
  const [eveningOpen, setEveningOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: session } = useSession()
  const isOwner = session?.user?.id != null && session.user.id === authorId
  const authorName = author.displayName ?? author.name ?? username

  function goToTab(index: number) {
    if (index === activeTab) return
    setVisible(false)
    setTimeout(() => { setActiveTab(index); setVisible(true) }, 150)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta < -50) goToTab(Math.min(activeTab + 1, 4))
    if (delta > 50)  goToTab(Math.max(activeTab - 1, 0))
  }

  // Native wheel listener — React 18 onWheel is passive and cannot call preventDefault
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < 30) return
      e.preventDefault()
      if (wheelTimer.current) return
      const dir = e.deltaX > 0 ? 1 : -1
      setActiveTab(prev => {
        const next = Math.min(Math.max(prev + dir, 0), 4)
        if (next !== prev) { setVisible(false); setTimeout(() => setVisible(true), 150) }
        return next
      })
      wheelTimer.current = setTimeout(() => { wheelTimer.current = null }, 500)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Keyboard arrow navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (keyTimer.current) return
      const dir = e.key === 'ArrowRight' ? 1 : -1
      setActiveTab(prev => {
        const next = Math.min(Math.max(prev + dir, 0), 4)
        if (next !== prev) { setVisible(false); setTimeout(() => setVisible(true), 150) }
        return next
      })
      keyTimer.current = setTimeout(() => { keyTimer.current = null }, 300)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const ORBS = [
    { label: 'Journal',         icon: <span className="tab-orb-circle tab-orb-circle--solid" /> },
    { label: 'Stats',           icon: <span className="tab-orb-circle tab-orb-circle--outline" /> },
    { label: 'WOLF|BOT Review', icon: <WolfOrbSvg /> },
    { label: 'Evening',         icon: <MoonOrbSvg /> },
    { label: 'About this post', icon: <SquareOrbSvg /> },
  ]

  return (
    <div ref={panelRef} className="tab-panel" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* Orb row */}
      <nav className="tab-orb-row" aria-label="Journal sections">
        {ORBS.map((orb, i) => (
          <button
            key={i}
            aria-label={orb.label}
            aria-pressed={activeTab === i}
            className={`tab-orb-btn${activeTab === i ? ' tab-orb-btn--active' : ''}`}
            onClick={() => goToTab(i)}
          >
            {orb.icon}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className={`tab-content${visible ? ' tab-content--visible' : ''}`}>
        {activeTab === 0 && <TabJournal post={post} />}
        {activeTab === 1 && <TabStats ms={morningState} username={username} />}
        {activeTab === 2 && <TabWolfbot ds={dayScores} post={post} />}
        {activeTab === 3 && (
          <TabEvening
            er={eveningReflection}
            postId={post.id ?? ''}
            authorId={authorId}
            isOwner={isOwner}
            eveningOpen={eveningOpen}
            setEveningOpen={setEveningOpen}
          />
        )}
        {activeTab === 4 && (
          <TabMeta
            post={post}
            author={author}
            authorName={authorName}
            username={username}
            postDates={postDates}
          />
        )}
      </div>

    </div>
  )
}
