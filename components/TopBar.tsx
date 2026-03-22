'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, BarChart2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { usePostContext } from '@/lib/post-context'

export default function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { post } = usePostContext()
  const [navHidden, setNavHidden] = useState(false)
  const isPostPage = !!post?.postId || pathname.startsWith('/posts/')

  // Exact same inactivity fade as bottom nav
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

  const isOwner = session?.user?.id != null && post?.authorId === session.user.id

  return (
    <div className={`top-bar${navHidden ? ' top-bar--hidden' : ''}`}>
      {session && (
        <button
          className="top-bar-btn top-bar-btn--left"
          onClick={() => router.push('/write')}
          aria-label="New journal"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      )}
      {session && (
        <Link href="/journal" className="top-bar-btn top-bar-btn--journal" aria-label="Your journal">
          <BarChart2 size={15} strokeWidth={1.5} />
        </Link>
      )}
      <Link href="/feedback" className="top-bar-feedback">BETA FEEDBACK</Link>
      {isOwner && post && (
        <button
          className="top-bar-btn top-bar-btn--right"
          onClick={() => router.push(`/edit/${post.postId}`)}
          aria-label="Edit journal"
        >
          <Pencil size={15} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}
