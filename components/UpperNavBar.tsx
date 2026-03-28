'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home, Sunrise, Pencil, ShoppingBag, User, Settings,
  Share2, Download, ArrowLeft, ChevronLeft, ChevronRight,
  LayoutDashboard, BadgeInfo, Bot,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getNavConfigKey, NAV_CONFIGS, type NavIcon, type SlotType } from '@/lib/nav-config'
import { usePostContext } from '@/lib/post-context'
import SettingsOverlay from './SettingsOverlay'

// ─── Icon renderer ────────────────────────────────────────────────────────────

function NavIconEl({ icon, size = 18 }: { icon: NavIcon; size?: number }) {
  const props = { size, strokeWidth: 1.5 }
  switch (icon) {
    case 'Home':           return <Home {...props} />
    case 'Sunrise':        return <Sunrise {...props} />
    case 'Pencil':         return <Pencil {...props} />
    case 'ShoppingBag':    return <ShoppingBag {...props} />
    case 'User':           return <User {...props} />
    case 'Settings':       return <Settings {...props} />
    case 'Share2':         return <Share2 {...props} />
    case 'Download':       return <Download {...props} />
    case 'ArrowLeft':      return <ArrowLeft {...props} />
    case 'ChevronLeft':    return <ChevronLeft {...props} />
    case 'ChevronRight':   return <ChevronRight {...props} />
    case 'LayoutDashboard':return <LayoutDashboard {...props} />
    case 'BadgeInfo':      return <BadgeInfo {...props} />
    case 'Bot':            return <Bot {...props} />
    default:               return null
  }
}

// ─── Adjacent post type ───────────────────────────────────────────────────────

type AdjacentPost = { slug: string; authorUsername: string | null } | null

// ─── Component ───────────────────────────────────────────────────────────────

export default function UpperNavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { post: postCtx } = usePostContext()

  const configKey = getNavConfigKey(pathname)
  const config = NAV_CONFIGS[configKey]

  const [faded, setFaded] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [adjacent, setAdjacent] = useState<{ prev: AdjacentPost; next: AdjacentPost } | null>(null)

  // Hide bar entirely on auth pages
  if (config.hideBars) return null

  // Fade on inactivity (journal reading only)
  useEffect(() => {
    if (!config.fadeOnInactivity) { setFaded(false); return }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let timer: ReturnType<typeof setTimeout>
    function resetTimer() {
      setFaded(false)
      clearTimeout(timer)
      timer = setTimeout(() => setFaded(true), 3000)
    }
    resetTimer()
    window.addEventListener('scroll', resetTimer, { passive: true })
    window.addEventListener('mousemove', resetTimer, { passive: true })
    window.addEventListener('touchstart', resetTimer, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', resetTimer)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
    }
  }, [config.fadeOnInactivity])

  // Fetch adjacent posts for journal-reading prev/next
  useEffect(() => {
    if (configKey !== 'journal-reading' || !postCtx?.postId) { setAdjacent(null); return }
    fetch(`/api/posts/${postCtx.postId}/adjacent`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setAdjacent(data))
      .catch(() => {})
  }, [configKey, postCtx?.postId])

  const segments = pathname.split('/').filter(Boolean)

  function renderSlot(slot: SlotType, idx: number) {
    const key = idx

    switch (slot.kind) {
      case 'empty':
        return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />

      case 'link':
        return (
          <Link key={key} href={slot.href} className="nav-slot nav-slot--link" aria-label={slot.label}>
            <NavIconEl icon={slot.icon} />
            <span className="nav-slot-label">{slot.label}</span>
          </Link>
        )

      case 'action':
        if (slot.action === 'open-settings') {
          return (
            <button key={key} className="nav-slot nav-slot--btn" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
              <NavIconEl icon={slot.icon} />
              <span className="nav-slot-label">{slot.label}</span>
            </button>
          )
        }
        return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />

      case 'prev-post': {
        if (!adjacent?.prev) return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />
        const href = `/${adjacent.prev.authorUsername ?? segments[0]}/${adjacent.prev.slug}`
        return (
          <Link key={key} href={href} className="nav-slot nav-slot--link" aria-label="Previous post">
            <ChevronLeft size={18} strokeWidth={1.5} />
            <span className="nav-slot-label">prev</span>
          </Link>
        )
      }

      case 'next-post': {
        if (!adjacent?.next) return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />
        const href = `/${adjacent.next.authorUsername ?? segments[0]}/${adjacent.next.slug}`
        return (
          <Link key={key} href={href} className="nav-slot nav-slot--link" aria-label="Next post">
            <ChevronRight size={18} strokeWidth={1.5} />
            <span className="nav-slot-label">next</span>
          </Link>
        )
      }

      default:
        return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />
    }
  }

  return (
    <>
      <nav className={`upper-nav${faded ? ' nav--faded' : ''}`} aria-label="Upper navigation">
        {config.upper.map((slot, idx) => renderSlot(slot, idx))}
      </nav>

      <SettingsOverlay open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
