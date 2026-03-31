'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Home, Sunrise, Pencil, ShoppingBag, User, UserCircle2, Settings,
  Share2, Download, ArrowLeft, ChevronLeft, ChevronRight,
  LayoutDashboard, BadgeInfo, Bot, Plus, Building2, Rss, BookOpen, Menu, X,
  TrendingUp, Trophy, Sparkles, ShoppingCart, MessageSquare, Code2, FileText,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { signInWithGoogle, signInWithGitHub } from '@/lib/actions/oauth'
import { loginForModal } from '@/lib/actions/auth'
import { getNavConfigKey, NAV_CONFIGS, type NavIcon, type SlotType } from '@/lib/nav-config'
import { usePostContext } from '@/lib/post-context'
import WolfBotIcon from './WolfBotIcon'
import WolfLogo from './WolfLogo'
import SettingsOverlay from './SettingsOverlay'
import ThemeLogo from './ThemeLogo'

// ─── Icon renderer ────────────────────────────────────────────────────────────

function NavIconEl({ icon, size = 20 }: { icon: NavIcon; size?: number }) {
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

// ─── More Pages panel content ─────────────────────────────────────────────────

type PageLink = { href: string; label: string; icon: React.ReactNode }
type PageGroup = { title: string; links: PageLink[]; color: string; authOnly?: boolean }

const PAGE_GROUPS: PageGroup[] = [
  {
    title: 'Your Space',
    color: '#4A7FA5',
    links: [
      { href: '/',         label: 'Feed',            icon: <Home         size={16} strokeWidth={1.5} /> },
      { href: '/write',    label: 'Write a Journal', icon: <Pencil       size={16} strokeWidth={1.5} /> },
      { href: '/discover', label: 'Discover',        icon: <BadgeInfo    size={16} strokeWidth={1.5} /> },
    ],
  },
  {
    title: 'WOLF|BOT',
    color: '#C8B020',
    links: [
      { href: '/wolfbot', label: 'WOLF|BOT', icon: <WolfBotIcon size={16} /> },
    ],
  },
  {
    title: 'Discover',
    color: '#3AB87A',
    links: [
      { href: '/about',        label: 'About Wolfman',   icon: <User        size={16} strokeWidth={1.5} /> },
      { href: '/investment',   label: 'Investment Case', icon: <TrendingUp  size={16} strokeWidth={1.5} /> },
      { href: '/features',     label: 'Features',        icon: <Sparkles    size={16} strokeWidth={1.5} /> },
      { href: '/rituals',      label: 'Rituals',         icon: <Sunrise     size={16} strokeWidth={1.5} /> },
      { href: '/achievements', label: 'Achievements',    icon: <Trophy      size={16} strokeWidth={1.5} /> },
    ],
  },
  {
    title: 'Shop',
    color: '#A0622A',
    links: [
      { href: '/shop', label: 'Shop', icon: <ShoppingBag  size={16} strokeWidth={1.5} /> },
      { href: '/cart', label: 'Cart', icon: <ShoppingCart size={16} strokeWidth={1.5} /> },
    ],
  },
  {
    title: 'Beta Testing',
    color: '#C8B020',
    links: [
      { href: '/beta',     label: 'About the Beta', icon: <BadgeInfo     size={16} strokeWidth={1.5} /> },
      { href: '/feedback', label: 'Give Feedback',  icon: <MessageSquare size={16} strokeWidth={1.5} /> },
      { href: '/dev',      label: 'Dev Log',        icon: <Code2         size={16} strokeWidth={1.5} /> },
    ],
  },
  {
    title: 'Legal',
    color: '#909090',
    links: [
      { href: '/terms', label: 'Terms', icon: <FileText size={16} strokeWidth={1.5} /> },
    ],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

interface LowerNavBarProps {
  registrationOpen: boolean
}

export default function LowerNavBar({ registrationOpen }: LowerNavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { post: postCtx } = usePostContext()

  const configKey = getNavConfigKey(pathname)
  const config = NAV_CONFIGS[configKey]

  const [faded, setFaded] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [morePagesOpen, setMorePagesOpen] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const avatarUrl = session?.user?.avatar ?? session?.user?.image ?? null
  const segments = pathname.split('/').filter(Boolean)

  if (config.hideBars) return null

  // Close More Pages when route changes
  useEffect(() => { setMorePagesOpen(false) }, [pathname])

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

  // Lock body scroll when any overlay is open
  useEffect(() => {
    document.body.style.overflow = (loginOpen || morePagesOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [loginOpen, morePagesOpen])

  // Escape closes overlays
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setLoginOpen(false); setMorePagesOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function handleShare() {
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: window.location.href })
      else await navigator.clipboard.writeText(window.location.href)
    } catch {}
  }

  function handleExport() {
    const lines: string[] = []
    const RULE_HEAVY = '═'.repeat(50)
    const RULE_LIGHT = '─'.repeat(50)

    // Header
    lines.push(RULE_HEAVY)
    lines.push('  WOLFMAN MORNING JOURNAL')
    lines.push(RULE_HEAVY)
    lines.push('')

    // Title + date
    const titleEl = document.querySelector('.post-reading-end-title')
    const dateEl  = document.querySelector('.post-reading-end-date')
    if (titleEl?.textContent) lines.push(titleEl.textContent.trim())
    if (dateEl?.textContent)  lines.push(dateEl.textContent.trim())
    lines.push('')

    // Journal sections
    const sections = document.querySelectorAll('.post-section')
    if (sections.length > 0) {
      sections.forEach(sec => {
        const label = sec.querySelector('.post-section-label')?.textContent?.trim() ?? ''
        const body  = sec.querySelector('.post-body')?.textContent?.trim() ?? ''
        lines.push('')
        lines.push(`✦ ${label} ✦`)
        lines.push(RULE_LIGHT)
        lines.push('')
        lines.push(body)
      })
    } else {
      // Fallback — plain article text
      const postEl = document.querySelector('.post')
      if (postEl?.textContent) lines.push(postEl.textContent.trim())
    }

    // Footer
    lines.push('')
    lines.push('')
    lines.push(RULE_HEAVY)
    lines.push('  Exported from Wolfman.blog')
    lines.push(`  ${window.location.href}`)
    lines.push(`  ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`)
    lines.push(RULE_HEAVY)

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${segments[1] ?? 'journal'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const result = await loginForModal(loginEmail, loginPassword)
      if ('error' in result) {
        setLoginError(result.error)
      } else {
        setLoginOpen(false)
        setLoginEmail('')
        setLoginPassword('')
        router.refresh()
      }
    } finally {
      setLoginLoading(false)
    }
  }

  function renderSlot(slot: SlotType, idx: number) {
    const key = idx

    switch (slot.kind) {
      case 'empty':
        return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />

      case 'wolfbot':
        return (
          <Link key={key} href="/wolfbot" className="nav-slot nav-slot--wolfbot" aria-label="WOLF|BOT">
            <WolfBotIcon size={20} />
          </Link>
        )

      case 'feed-logo':
        return (
          <div key={key} className="nav-slot nav-slot--feed-logo">
            <Link href="/" className="feed-logo-btn" aria-label="Home feed">
              <WolfLogo size={72} className="feed-logo-img" />
            </Link>
          </div>
        )

      case 'more-pages':
        return (
          <button
            key={key}
            className={`nav-slot nav-slot--btn${morePagesOpen ? ' nav-slot--active' : ''}`}
            aria-label={morePagesOpen ? 'Close navigation panel' : 'Open site navigation'}
            onClick={() => setMorePagesOpen(o => !o)}
          >
            {morePagesOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        )

      case 'link': {
        return (
          <Link key={key} href={slot.href} className="nav-slot nav-slot--link" aria-label={slot.label}>
            <NavIconEl icon={slot.icon} />
          </Link>
        )
      }

      case 'action':
        switch (slot.action) {
          case 'open-settings':
            return (
              <button key={key} className="nav-slot nav-slot--btn" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
                <NavIconEl icon={slot.icon} />
              </button>
            )
          case 'share':
            return (
              <button key={key} className="nav-slot nav-slot--btn" aria-label="Share" onClick={handleShare}>
                <NavIconEl icon={slot.icon} />
              </button>
            )
          case 'export-txt':
            return (
              <button key={key} className="nav-slot nav-slot--btn" aria-label="Export as text" onClick={handleExport}>
                <NavIconEl icon={slot.icon} />
              </button>
            )
          case 'go-back':
            return (
              <button key={key} className="nav-slot nav-slot--btn" aria-label="Go back" onClick={() => router.back()}>
                <NavIconEl icon={slot.icon} />
              </button>
            )
          default:
            return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />
        }

      case 'account':
        if (session) {
          const profileHref = session.user?.username ? `/${session.user.username}` : '/account'
          return (
            <Link key={key} href={profileHref} className="nav-slot nav-slot--link" aria-label="Account">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={session.user?.name ?? 'avatar'}
                  width={22}
                  height={22}
                  className="nav-slot-avatar"
                  unoptimized
                />
              ) : (
                <User size={20} strokeWidth={1.5} />
              )}
            </Link>
          )
        }
        return (
          <button key={key} className="nav-slot nav-slot--btn" aria-label="Sign in" onClick={() => setLoginOpen(true)}>
            <User size={20} strokeWidth={1.5} />
          </button>
        )

      default:
        return <div key={key} className="nav-slot nav-slot--empty" aria-hidden="true" />
    }
  }

  return (
    <>
      <nav className={`lower-nav${faded ? ' nav--faded' : ''}`} aria-label="Lower navigation">
        {config.lower.map((slot, idx) => renderSlot(slot, idx))}
      </nav>

      {/* ── More Pages panel ── */}
      <div
        className={`more-pages-panel${morePagesOpen ? ' is-open' : ''}`}
        aria-hidden={!morePagesOpen}
        role="dialog"
        aria-label="Site Navigation"
      >
        {/* Close button top-right */}
        <button
          className="more-pages-close"
          aria-label="Close navigation panel"
          onClick={() => setMorePagesOpen(false)}
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        <div className="more-pages-inner">
          {/* Logo */}
          <div className="more-pages-logo-wrap">
            <ThemeLogo className="more-pages-logo" />
          </div>

          {/* Admin button — admin users only */}
          {session?.user?.role === 'admin' && (
            <Link
              href="/admin"
              className="more-pages-admin-btn"
              onClick={() => setMorePagesOpen(false)}
            >
              ADMIN
            </Link>
          )}

          {/* User row — profile link + sign out */}
          {session && (
            <div className="more-pages-user-row">
              <Link
                href={session.user?.username ? `/${session.user.username}` : '/account'}
                className="more-pages-user-profile"
                onClick={() => setMorePagesOpen(false)}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={session.user?.name ?? 'avatar'}
                    width={32}
                    height={32}
                    className="more-pages-user-avatar"
                    unoptimized
                  />
                ) : (
                  <User size={20} strokeWidth={1.5} />
                )}
                <span className="more-pages-user-name">
                  {session.user?.displayName ?? session.user?.name ?? 'Your Profile'}
                </span>
              </Link>
              <button
                className="more-pages-signout-btn"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </button>
            </div>
          )}

          <p className="more-pages-title">Site Navigation</p>

          {/* Page groups */}
          <nav className="more-pages-nav" aria-label="All pages">
            {PAGE_GROUPS.map(group => (
              <div
                key={group.title}
                className="more-pages-group"
                style={{ '--group-color': group.color } as React.CSSProperties}
              >
                <p className="more-pages-group-title">{group.title}</p>
                <ul className="more-pages-list">
                  {group.links.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="more-pages-link"
                        onClick={() => setMorePagesOpen(false)}
                      >
                        <span className="more-pages-link-icon">{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

        </div>
      </div>

      {/* ── Settings overlay ── */}
      <SettingsOverlay open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* ── Login modal ── */}
      <div
        className={`login-overlay${loginOpen ? ' is-open' : ''}`}
        aria-hidden={!loginOpen}
        role="dialog"
        aria-label="Sign in"
      >
        <button className="login-close" aria-label="Close" onClick={() => setLoginOpen(false)}>
          &times;
        </button>
        <div className="login-inner">
          <p className="login-title">Good to see you.</p>
          <div className="login-oauth">
            <form action={signInWithGoogle}>
              <button type="submit" className="login-oauth-btn login-oauth-btn--google">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </form>
            <form action={signInWithGitHub}>
              <button type="submit" className="login-oauth-btn login-oauth-btn--github">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Sign in with GitHub
              </button>
            </form>
          </div>
          <div className="login-divider"><span>or</span></div>
          <form className="login-form" onSubmit={handleEmailLogin}>
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="login-input" required autoComplete="email" />
            <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="login-input" required autoComplete="current-password" />
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit" className="login-submit" disabled={loginLoading}>
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {registrationOpen && (
            <p className="login-register-prompt">
              No account? <Link href="/register" onClick={() => setLoginOpen(false)}>Register here</Link>
            </p>
          )}
        </div>
      </div>
    </>
  )
}
