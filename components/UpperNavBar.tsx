'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Home, Sunrise, Pencil, ShoppingBag, User, UserCircle2, Settings,
  Share2, Download, ArrowLeft, ChevronLeft, ChevronRight,
  LayoutDashboard, BadgeInfo, Bot, Plus, Building2, Rss, BookOpen, Menu, X,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getNavConfigKey, NAV_CONFIGS, type NavIcon, type SlotType } from '@/lib/nav-config'
import { usePostContext } from '@/lib/post-context'
import SettingsOverlay from './SettingsOverlay'

function NavIconEl({ icon, size = 16 }: { icon: NavIcon; size?: number }) {
  const p = { size, strokeWidth: 1.5 }
  switch (icon) {
    case 'Home':            return <Home {...p} />
    case 'Sunrise':         return <Sunrise {...p} />
    case 'Pencil':          return <Pencil {...p} />
    case 'ShoppingBag':     return <ShoppingBag {...p} />
    case 'User':            return <User {...p} />
    case 'UserCircle2':     return <UserCircle2 {...p} />
    case 'Settings':        return <Settings {...p} />
    case 'Share2':          return <Share2 {...p} />
    case 'Download':        return <Download {...p} />
    case 'ArrowLeft':       return <ArrowLeft {...p} />
    case 'ChevronLeft':     return <ChevronLeft {...p} />
    case 'ChevronRight':    return <ChevronRight {...p} />
    case 'LayoutDashboard': return <LayoutDashboard {...p} />
    case 'BadgeInfo':       return <BadgeInfo {...p} />
    case 'Bot':             return <Bot {...p} />
    case 'Plus':            return <Plus {...p} />
    case 'Building2':       return <Building2 {...p} />
    case 'Rss':             return <Rss {...p} />
    case 'BookOpen':        return <BookOpen {...p} />
    case 'Menu':            return <Menu {...p} />
    case 'X':               return <X {...p} />
    default:                return null
  }
}

type AdjacentPost = { slug: string; authorUsername: string | null } | null

export default function UpperNavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { post: postCtx } = usePostContext()

  const configKey = getNavConfigKey(pathname)
  const config = NAV_CONFIGS[configKey]

  const [faded, setFaded] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [adjacent, setAdjacent] = useState<{ prev: AdjacentPost; next: AdjacentPost } | null>(null)

  if (config.hideBars) return null

  // Fade on inactivity — journal reading only
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

  // Fetch prev/next for journal reading
  useEffect(() => {
    if (configKey !== 'journal-reading' || !postCtx?.postId) { setAdjacent(null); return }
    fetch(`/api/posts/${postCtx.postId}/adjacent`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setAdjacent(data))
      .catch(() => {})
  }, [configKey, postCtx?.postId])

  const segments = pathname.split('/').filter(Boolean)
  const avatarUrl = session?.user?.avatar ?? session?.user?.image ?? null
  const profileHref = session?.user?.username ? `/${session.user.username}` : '/account'

  function renderSlot(slot: SlotType, idx: number) {
    const key = idx

    switch (slot.kind) {
      case 'empty':
        return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />

      case 'write-plus':
        if (!session) return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />
        return (
          <Link key={key} href="/write" className="nav-slot nav-slot--link" aria-label="Write a journal">
            <Plus size={16} strokeWidth={2} />
          </Link>
        )

      case 'profile-link':
        if (!session) return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />
        return (
          <Link key={key} href={profileHref} className="nav-slot nav-slot--link" aria-label="Your profile">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={session?.user?.name ?? 'avatar'}
                width={20}
                height={20}
                className="upper-nav-avatar"
                unoptimized
              />
            ) : (
              <UserCircle2 size={16} strokeWidth={1.5} />
            )}
          </Link>
        )

      case 'text-link':
        return (
          <Link key={key} href={slot.href} className="nav-slot nav-slot--text-link">
            {slot.text}
          </Link>
        )

      case 'link':
        return (
          <Link key={key} href={slot.href} className="nav-slot nav-slot--link" aria-label={slot.label}>
            <NavIconEl icon={slot.icon} />
            {!slot.hideLabel && <span className="nav-slot-label">{slot.label}</span>}
          </Link>
        )

      case 'action':
        if (slot.action === 'open-settings') {
          return (
            <button key={key} className="nav-slot nav-slot--btn" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
              <NavIconEl icon={slot.icon} />
              {!slot.hideLabel && <span className="nav-slot-label">{slot.label}</span>}
            </button>
          )
        }
        return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />

      case 'prev-post': {
        if (!adjacent?.prev) return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />
        const href = `/${adjacent.prev.authorUsername ?? segments[0]}/${adjacent.prev.slug}`
        return (
          <Link key={key} href={href} className="nav-slot nav-slot--link" aria-label="Previous post">
            <ChevronLeft size={16} strokeWidth={1.5} />
            <span className="nav-slot-label">prev</span>
          </Link>
        )
      }

      case 'next-post': {
        if (!adjacent?.next) return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />
        const href = `/${adjacent.next.authorUsername ?? segments[0]}/${adjacent.next.slug}`
        return (
          <Link key={key} href={href} className="nav-slot nav-slot--link" aria-label="Next post">
            <ChevronRight size={16} strokeWidth={1.5} />
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
