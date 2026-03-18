'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SlidersHorizontal, ShoppingCart, Smile, Meh, Crown, Code2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import WolfLogo from './WolfLogo'
import ThemeButtons from './ThemeButtons'
import FontSizeButtons from './FontSizeButtons'
import DevOverlay from './DevOverlay'
import { useCart } from '@/lib/cart'

const NAV_LINKS = [
  { href: '/talk-data',   label: 'talk data',          pathKey: 'talk-data' },
  { href: '/intentions',  label: 'set an intention',   pathKey: 'intentions' },
  { href: '/shop',        label: 'buy something cool', pathKey: 'shop' },
  { href: '/about',       label: 'discover Wolfman',   pathKey: 'about' },
]

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [devOpen, setDevOpen] = useState(false)
  const pathname = usePathname()
  const { count: cartCount } = useCart()
  const { data: session } = useSession()
  const [navHidden, setNavHidden] = useState(false)
  const isPostPage = pathname.startsWith('/posts/')

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
        setMenuOpen(false)
        setSettingsOpen(false)
        setDevOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Prevent body scroll when an overlay is open
  useEffect(() => {
    document.body.style.overflow = menuOpen || settingsOpen || devOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen, settingsOpen, devOpen])

  function closeAll() {
    setMenuOpen(false)
    setSettingsOpen(false)
    setDevOpen(false)
  }

  // Active page is excluded from the menu list
  const visibleLinks = NAV_LINKS.filter(
    (l) => !pathname.startsWith('/' + l.pathKey)
  )

  return (
    <>
      {/* ── Nav bar ── */}
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

        {/* Experience button */}
        <button
          className="nav-btn nav-btn--left"
          aria-label={settingsOpen ? 'Close experience' : 'Open experience'}
          onClick={() => {
            setSettingsOpen((o) => !o)
            setMenuOpen(false)
            setDevOpen(false)
          }}
        >
          <SlidersHorizontal size={25} strokeWidth={1.5} />
        </button>

        {/* Cart button */}
        <Link
          href={cartCount > 0 ? '/cart' : '/shop'}
          className="nav-btn nav-btn--cart"
          aria-label={cartCount > 0 ? `Cart — ${cartCount} item${cartCount !== 1 ? 's' : ''}` : 'Go to shop'}
          onClick={closeAll}
        >
          <ShoppingCart size={25} strokeWidth={1.5} />
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
          }}
        >
          <WolfLogo size={64} priority />
        </button>

        {/* Face / auth button */}
        <Link
          href={session ? '/account' : '/login'}
          className="nav-btn nav-btn--face"
          aria-label={session ? `Account — ${session.user?.name ?? 'signed in'}` : 'Sign in'}
          onClick={closeAll}
        >
          {session?.user?.role === 'admin'
            ? <Crown size={25} strokeWidth={1.5} />
            : session
              ? <Smile size={25} strokeWidth={1.5} />
              : <Meh size={25} strokeWidth={1.5} />
          }
        </Link>

        {/* Dev overlay button */}
        <button
          className="nav-btn nav-btn--right nav-dev"
          aria-label={devOpen ? 'Close development' : 'Open development'}
          onClick={() => { setDevOpen((o) => !o); setMenuOpen(false); setSettingsOpen(false) }}
        >
          <Code2 size={25} strokeWidth={1.5} />
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
                <Link href="/login" onClick={closeAll}>
                  sign in
                </Link>
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
        </div>
      </div>

      {/* ── Dev overlay ── */}
      <DevOverlay isOpen={devOpen} onClose={() => setDevOpen(false)} />
    </>
  )
}
