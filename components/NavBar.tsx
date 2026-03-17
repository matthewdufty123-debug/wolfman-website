'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import WolfLogo from './WolfLogo'
import ThemeButtons from './ThemeButtons'
import FontSizeButtons from './FontSizeButtons'

const NAV_LINKS = [
  { href: '/talk-data',   label: 'talk data',          pathKey: 'talk-data' },
  { href: '/intentions',  label: 'set an intention',   pathKey: 'intentions' },
  { href: '/shop',        label: 'buy something cool', pathKey: 'shop' },
  { href: '/about',       label: 'discover Wolfman',   pathKey: 'about' },
]

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isDevPage = pathname === '/development'

  // Escape key closes both overlays
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSettingsOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Prevent body scroll when an overlay is open
  useEffect(() => {
    document.body.style.overflow = menuOpen || settingsOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen, settingsOpen])

  function closeAll() {
    setMenuOpen(false)
    setSettingsOpen(false)
  }

  // Active page is excluded from the menu list
  const visibleLinks = NAV_LINKS.filter(
    (l) => !pathname.startsWith('/' + l.pathKey)
  )

  return (
    <>
      {/* ── Nav bar ── */}
      <nav className="wolfman-nav" id="wolfmanNav">
        <svg
          className="nav-bg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 375 100"
          aria-hidden="true"
        >
          <path d="M0,100 L0,46 L95,46 C125,46 158,0 187.5,0 C217,0 250,46 280,46 L375,46 L375,100 Z" />
        </svg>

        {/* Settings button — hidden on dev page */}
        {!isDevPage && (
          <button
            className="nav-btn nav-btn--left"
            aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
            onClick={() => {
              setSettingsOpen((o) => !o)
              setMenuOpen(false)
            }}
          />
        )}

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

        {/* Dev page button — hidden on dev page */}
        {!isDevPage && (
          <button
            className="nav-btn nav-btn--right nav-dev"
            aria-label="Development"
            onClick={() => router.push('/development')}
          />
        )}
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
          </ul>
          <div className="menu-footer-icons">
            <Link href="/" aria-label="Go home" onClick={closeAll}>
              <WolfLogo
                size={54}
                className="menu-footer-icon"
                style={{ borderRadius: 8 }}
              />
            </Link>
            <Link href="/development" aria-label="Development page" onClick={closeAll}>
              <Image
                src="/images/site_images/claudecode-color.png"
                alt="Claude Code development"
                width={54}
                height={54}
                className="menu-footer-icon"
                unoptimized
              />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Settings overlay ── */}
      <div
        className={`settings-overlay${settingsOpen ? ' is-open' : ''}`}
        aria-hidden={!settingsOpen}
      >
        <button
          className="settings-close"
          aria-label="Close settings"
          onClick={() => setSettingsOpen(false)}
        >
          &times;
        </button>
        <div className="settings-inner">
          <p className="settings-overlay-title">settings</p>
          <ThemeButtons />
          <FontSizeButtons />
        </div>
      </div>
    </>
  )
}
