'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SlidersHorizontal, ShoppingCart, Smile, Meh, Code2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import WolfLogo from './WolfLogo'
import ThemeButtons from './ThemeButtons'
import FontSizeButtons from './FontSizeButtons'
import FontFamilyButtons from './FontFamilyButtons'
import DevOverlay from './DevOverlay'
import { useCart } from '@/lib/cart'
import { signInWithGoogle, signInWithGitHub } from '@/lib/actions/oauth'
import { loginForModal } from '@/lib/actions/auth'

const NAV_LINKS = [
  { href: '/intentions',  label: 'set an intention',   pathKey: 'intentions' },
  { href: '/shop',        label: 'buy something cool', pathKey: 'shop' },
  { href: '/about',       label: 'discover Wolfman',   pathKey: 'about' },
]

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [devOpen, setDevOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { count: cartCount } = useCart()
  const { data: session } = useSession()
  const [navHidden, setNavHidden] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const avatarUrl = session?.user?.avatar ?? session?.user?.image ?? null

  // Fade nav on scroll down, reveal on scroll up (all pages)
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let lastY = window.scrollY
    function onScroll() {
      const y = window.scrollY
      if (y < 60) { setNavHidden(false); lastY = y; return }
      setNavHidden(y > lastY)
      lastY = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Escape key closes all overlays
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSettingsOpen(false)
        setDevOpen(false)
        setLoginOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Prevent body scroll when an overlay is open
  useEffect(() => {
    document.body.style.overflow = menuOpen || settingsOpen || devOpen || loginOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen, settingsOpen, devOpen, loginOpen])

  function closeAll() {
    setMenuOpen(false)
    setSettingsOpen(false)
    setDevOpen(false)
    setLoginOpen(false)
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

  // Active page is excluded from the menu list
  const visibleLinks = NAV_LINKS.filter(
    (l) => !pathname.startsWith('/' + l.pathKey)
  )

  return (
    <>
      {/* ── Nav bar ── */}
      <nav className={`wolfman-nav${navHidden ? ' nav--hidden' : ''}`} id="wolfmanNav">

        {/* Experience button */}
        <button
          className="nav-btn nav-btn--left"
          aria-label={settingsOpen ? 'Close experience' : 'Open experience'}
          onClick={() => {
            setSettingsOpen((o) => !o)
            setMenuOpen(false)
            setDevOpen(false)
            setLoginOpen(false)
          }}
        >
          <SlidersHorizontal size={20} strokeWidth={1.5} />
        </button>

        {/* Cart button */}
        <Link
          href={cartCount > 0 ? '/cart' : '/shop'}
          className="nav-btn nav-btn--cart"
          aria-label={cartCount > 0 ? `Cart — ${cartCount} item${cartCount !== 1 ? 's' : ''}` : 'Go to shop'}
          onClick={closeAll}
        >
          <ShoppingCart size={20} strokeWidth={1.5} />
          {cartCount > 0 && (
            <span className="nav-cart-badge">{cartCount}</span>
          )}
        </Link>

        {/* Wolf logo — opens menu */}
        <button
          className="nav-btn nav-btn--center wolf-btn"
          id="wolfBtn"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => {
            setMenuOpen((o) => !o)
            setSettingsOpen(false)
            setLoginOpen(false)
          }}
        >
          <WolfLogo size={40} priority />
        </button>

        {/* Face / auth button */}
        {session ? (
          <Link
            href="/account"
            className="nav-btn nav-btn--face"
            aria-label={`Account — ${session.user?.name ?? 'signed in'}`}
            onClick={closeAll}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={session.user?.name ?? 'avatar'}
                width={28}
                height={28}
                className="nav-avatar"
                unoptimized
              />
            ) : (
              <Smile size={20} strokeWidth={1.5} />
            )}
          </Link>
        ) : (
          <button
            className="nav-btn nav-btn--face"
            aria-label="Sign in"
            onClick={() => {
              setLoginOpen((o) => !o)
              setMenuOpen(false)
              setSettingsOpen(false)
              setDevOpen(false)
            }}
          >
            <Meh size={20} strokeWidth={1.5} />
          </button>
        )}

        {/* Dev overlay button */}
        <button
          className="nav-btn nav-btn--right nav-dev"
          aria-label={devOpen ? 'Close development' : 'Open development'}
          onClick={() => { setDevOpen((o) => !o); setMenuOpen(false); setSettingsOpen(false); setLoginOpen(false) }}
        >
          <Code2 size={20} strokeWidth={1.5} />
        </button>
      </nav>

      {/* ── Menu overlay ── */}
      <nav
        className={`menu-overlay${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          className="menu-close"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          &times;
        </button>
        <div className="menu-inner">
          <p className="menu-prompt">What shall we do?</p>
          <ul className="menu-links">
            {visibleLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={closeAll}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="menu-links-divider" aria-hidden="true" />
            <li className="menu-links-auth">
              {session ? (
                <Link href="/account" onClick={closeAll}>
                  {session.user?.name ?? 'my account'}
                </Link>
              ) : (
                <button
                  className="menu-links-signin-btn"
                  onClick={() => { closeAll(); setLoginOpen(true) }}
                >
                  sign in
                </button>
              )}
            </li>
          </ul>
          <div className="menu-footer-icons">
            <Link href="/" aria-label="Go home" onClick={closeAll}>
              <WolfLogo
                size={54}
                className="menu-footer-icon"
                style={{ borderRadius: 8 }}
              />
            </Link>
            <button
              aria-label="Open development overlay"
              onClick={() => { closeAll(); setDevOpen(true) }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <Image
                src="/images/site_images/claudecode-color.png"
                alt="Claude Code development"
                width={54}
                height={54}
                className="menu-footer-icon"
                unoptimized
              />
            </button>
          </div>
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

          <p className="login-register-prompt">
            No account?{' '}
            <Link href="/register" onClick={closeAll}>
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* ── Dev overlay ── */}
      <DevOverlay isOpen={devOpen} onClose={() => setDevOpen(false)} />
    </>
  )
}
