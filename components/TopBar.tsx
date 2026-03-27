'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, User } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [navHidden, setNavHidden] = useState(false)

  const segments = pathname.split('/').filter(Boolean)
  const KNOWN_PREFIXES = new Set([
    'admin', 'edit', 'write', 'account', 'settings', 'shop', 'cart',
    'checkout', 'login', 'register', 'about', 'morning-ritual',
    'morning-stats', 'intentions', 'feedback', 'beta', 'dev',
    'features', 'terms', 'discover', 'api', 'posts',
  ])
  const isPostPage = pathname.startsWith('/posts/') ||
    (segments.length === 2 && !KNOWN_PREFIXES.has(segments[0]))

  // Inactivity fade on post pages — same timing as bottom nav
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

  // Hidden on auth pages
  if (['/login', '/register'].some(p => pathname.startsWith(p))) return null

  const avatarUrl = session?.user?.avatar ?? session?.user?.image ?? null
  const profileHref = session?.user?.username ? `/${session.user.username}` : '/account'

  return (
    <div className={`top-bar${navHidden ? ' top-bar--hidden' : ''}`}>

      {/* Left — new journal */}
      {session && (
        <button
          className="top-bar-btn top-bar-btn--left"
          onClick={() => router.push('/write')}
          aria-label="New journal"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      )}

      {/* Centre — beta feedback */}
      <Link href="/feedback" className="top-bar-feedback">BETA FEEDBACK</Link>

      {/* Right — avatar / sign in */}
      {session ? (
        <Link href={profileHref} className="top-bar-btn top-bar-btn--right top-bar-avatar-btn" aria-label="Your profile">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={session.user?.name ?? 'avatar'}
              width={26}
              height={26}
              className="top-bar-avatar"
              unoptimized
            />
          ) : (
            <User size={16} strokeWidth={1.5} />
          )}
        </Link>
      ) : (
        <Link href="/login" className="top-bar-btn top-bar-btn--right" aria-label="Sign in">
          <User size={16} strokeWidth={1.5} />
        </Link>
      )}

    </div>
  )
}
