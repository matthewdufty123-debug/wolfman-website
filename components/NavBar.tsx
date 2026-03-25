'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SlidersHorizontal, Bot, Home, Layers, User, LayoutList } from 'lucide-react'
import { useSession } from 'next-auth/react'
import WolfLogo from './WolfLogo'
import ThemeButtons from './ThemeButtons'
import FontSizeButtons from './FontSizeButtons'
import FontFamilyButtons from './FontFamilyButtons'
import { signInWithGoogle, signInWithGitHub } from '@/lib/actions/oauth'
import { loginForModal } from '@/lib/actions/auth'

const MORE_PAGES = [
  { href: '/',         label: 'home' },
  { href: '/write',    label: 'set an intention' },
  { href: '/features', label: 'features' },
  { href: '/shop',     label: 'buy something cool' },
  { href: '/about',    label: 'discover wolfman' },
  { href: '/beta',     label: 'about the beta' },
  { href: '/dev',      label: 'development log' },
  { href: '/feedback', label: 'give feedback' },
  { href: '/terms',    label: 'terms' },
]

export default function NavBar({ registrationOpen }: { registrationOpen: boolean }) {
  const [wolfPanelOpen, setWolfPanelOpen] = useState(false)
  const [morePagesOpen, setMorePagesOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [wolfbotOpen, setWolfbotOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [navHidden, setNavHidden] = useState(false)
  const segments = pathname.split('/').filter(Boolean)
  const KNOWN_PREFIXES = new Set(['admin', 'edit', 'write', 'account', 'settings', 'shop', 'cart', 'checkout', 'login', 'register', 'about', 'morning-ritual', 'morning-stats', 'intentions', 'feedback', 'beta', 'dev', 'features', 'terms', 'discover', 'api'])
  const isPostPage = pathname.startsWith('/posts/') ||
    (segments.length === 2 && !KNOWN_PREFIXES.has(segments[0]))

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const avatarUrl = session?.user?.avatar ?? session?.user?.image ?? null

  // Fade nav after 3s inactivity on post pages; reappear on any interaction
  useEffect(() => {
    if (!isPostPage) { setNavHidden(false); return }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let timer: ReturnType<typeof setTimeout>
    function resetTimer() {
      setNavHidden(false)
      clearTimeout(timer)
      timer = setTimeout(() => setNavHidden(true), 3000)
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
  }, [isPostPage])

  // Escape key closes all overlays
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setWolfPanelOpen(false)
        setMorePagesOpen(false)
        setSettingsOpen(false)
        setLoginOpen(false)
        setWolfbotOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Prevent body scroll when an overlay is open
  useEffect(() => {
    document.body.style.overflow = wolfPanelOpen || morePagesOpen || settingsOpen || loginOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [wolfPanelOpen, morePagesOpen, settingsOpen, loginOpen])

  function closeAll() {
    setWolfPanelOpen(false)
    setMorePagesOpen(false)
    setSettingsOpen(false)
    setLoginOpen(false)
    setWolfbotOpen(false)
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

  return (
    <>
      {/* ── Nav bar (wolf logo only) ── */}
      <nav className={`wolfman-nav${navHidden ? ' nav--hidden' : ''}`} id="wolfmanNav">
        <svg
          className="nav-bg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 375 100"
          aria-hidden="true"
        >
          <path d="M0,100 L0,46 L95,46 C125,46 158,0 187.5,0 C217,0 250,46 280,46 L375,46 L375,100 Z" />
        </svg>

        {/* Wolf logo — toggles wolf panel */}
        <button
          className="nav-btn nav-btn--center wolf-btn"
          id="wolfBtn"
          aria-label={wolfPanelOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => {
            setWolfPanelOpen((o) => !o)
            setMorePagesOpen(false)
            setSettingsOpen(false)
            setLoginOpen(false)
            setWolfbotOpen(false)
          }}
        >
          <WolfLogo size={64} priority />
        </button>
      </nav>

      {/* ── Wolf panel ── */}
      <div
        className={`wolf-panel${wolfPanelOpen ? ' is-open' : ''}`}
        aria-hidden={!wolfPanelOpen}
      >
        <svg
          className="wolf-panel-bg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 375 260"
          aria-hidden="true"
        >
          <path d="M0,260 L0,160 C75,160 110,60 187.5,30 C265,60 300,160 375,160 L375,260 Z" />
        </svg>

        <div className="wolf-panel-icons">
          {/* 1 — Experience */}
          <button
            className="wolf-panel-btn wpb-1"
            aria-label="Experience settings"
            onClick={() => { setSettingsOpen(true); setWolfPanelOpen(false) }}
          >
            <SlidersHorizontal size={20} strokeWidth={1.5} />
            <span>experience</span>
          </button>

          {/* 2 — Features */}
          <Link className="wolf-panel-btn wpb-2" href="/features" onClick={closeAll} aria-label="Features">
            <Layers size={20} strokeWidth={1.5} />
            <span>features</span>
          </Link>

          {/* 3 — Home */}
          <Link className="wolf-panel-btn wpb-3" href="/" onClick={closeAll} aria-label="Home">
            <Home size={20} strokeWidth={1.5} />
            <span>home</span>
          </Link>

          {/* 4 — WOLF|BOT (centre peak) */}
          <button
            className="wolf-panel-btn wpb-4 wolf-panel-btn--wolfbot"
            aria-label="WOLF|BOT"
            onClick={() => setWolfbotOpen((o) => !o)}
          >
            <Bot size={24} strokeWidth={1.5} />
            <span>wolf|bot</span>
          </button>

          {/* 5 — Account */}
          {session ? (
            <Link
              className="wolf-panel-btn wpb-5"
              href="/account"
              onClick={closeAll}
              aria-label="Account"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={session.user?.name ?? 'avatar'}
                  width={22}
                  height={22}
                  className="wolf-panel-avatar"
                  unoptimized
                />
              ) : (
                <User size={20} strokeWidth={1.5} />
              )}
              <span>{session.user?.name?.split(' ')[0]?.toLowerCase() ?? 'account'}</span>
            </Link>
          ) : (
            <button
              className="wolf-panel-btn wpb-5"
              aria-label="Sign in"
              onClick={() => { setLoginOpen(true); setWolfPanelOpen(false) }}
            >
              <User size={20} strokeWidth={1.5} />
              <span>sign in</span>
            </button>
          )}

          {/* 6 — More pages */}
          <button
            className="wolf-panel-btn wpb-6"
            aria-label="More pages"
            onClick={() => { setMorePagesOpen(true); setWolfPanelOpen(false) }}
          >
            <LayoutList size={20} strokeWidth={1.5} />
            <span>more</span>
          </button>
        </div>

        {/* WOLF|BOT offline notice */}
        {wolfbotOpen && (
          <p className="wolf-panel-wolfbot-msg">WOLF|BOT search is offline right now.</p>
        )}
      </div>

      {/* ── More pages overlay ── */}
      <nav
        className={`menu-overlay${morePagesOpen ? ' is-open' : ''}`}
        aria-hidden={!morePagesOpen}
      >
        <button
          className="menu-close"
          aria-label="Close menu"
          onClick={() => setMorePagesOpen(false)}
        >
          &times;
        </button>
        <div className="menu-inner">
          <p className="menu-prompt">where to?</p>
          <ul className="menu-links">
            {MORE_PAGES.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={closeAll}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── Experience overlay ── */}
      <div
        className={`settings-overlay${settingsOpen ? ' is-open' : ''}`}
        aria-hidden={!settingsOpen}
      >
        <button
          className="settings-close"
          aria-label="Close experience"
          onClick={() => setSettingsOpen(false)}
        >
          &times;
        </button>
        <div className="settings-inner">
          <p className="settings-overlay-title">experience</p>
          <ThemeButtons />
          <FontSizeButtons />
          <FontFamilyButtons />
        </div>
      </div>

      {/* ── Login overlay ── */}
      <div
        className={`login-overlay${loginOpen ? ' is-open' : ''}`}
        aria-hidden={!loginOpen}
        role="dialog"
        aria-label="Sign in"
      >
        <button
          className="login-close"
          aria-label="Close"
          onClick={() => setLoginOpen(false)}
        >
          &times;
        </button>
        <div className="login-inner">
          <p className="login-title">Good to see you.</p>

          {/* OAuth buttons */}
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

          {/* Email/password form */}
          <form className="login-form" onSubmit={handleEmailLogin}>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="login-input"
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              className="login-input"
              required
              autoComplete="current-password"
            />
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit" className="login-submit" disabled={loginLoading}>
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {registrationOpen && (
            <p className="login-register-prompt">
              No account?{' '}
              <Link href="/register" onClick={closeAll}>
                Register here
              </Link>
            </p>
          )}
        </div>
      </div>

    </>
  )
}
