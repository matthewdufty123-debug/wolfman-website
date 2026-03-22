'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ShareButton from './ShareButton'
import EveningReflection from './EveningReflection'

interface PostMeta { slug: string; title: string; date: string; authorUsername?: string | null }

interface Props {
  prevPost: PostMeta | null
  nextPost: PostMeta | null
  slug: string
  title: string
  postId: string | null
  authorId: string | null
  authorUsername?: string | null
}

function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconNext() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export default function PostFooter({ prevPost, nextPost, slug, title, postId, authorId, authorUsername }: Props) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  const isOwner = session?.user?.id != null && session.user.id === authorId
  const [eveningOpen, setEveningOpen] = useState(false)
  const url = authorUsername
    ? `https://wolfman.blog/${authorUsername}/${slug}`
    : `https://wolfman.blog/posts/${slug}`

  return (
    <nav className="post-nav">
      <div className="post-nav-share-row">
        <ShareButton title={title} url={url} />
      </div>

      <div className="post-nav-links-row">
        {/* Left = newer post */}
        {prevPost ? (
          <Link
            href={prevPost.authorUsername ? `/${prevPost.authorUsername}/${prevPost.slug}` : `/posts/${prevPost.slug}`}
            className="post-nav-btn"
            aria-label={`Newer: ${prevPost.title}`}
          >
            <IconBack />
            <span className="post-nav-label">{prevPost.title}</span>
          </Link>
        ) : (
          <span className="post-nav-btn post-nav-btn--disabled" aria-hidden="true">
            <IconBack /><span className="post-nav-label">Latest</span>
          </span>
        )}
        {/* Right = older post */}
        {nextPost ? (
          <Link
            href={nextPost.authorUsername ? `/${nextPost.authorUsername}/${nextPost.slug}` : `/posts/${nextPost.slug}`}
            className="post-nav-btn post-nav-btn--right"
            aria-label={`Older: ${nextPost.title}`}
          >
            <span className="post-nav-label">{nextPost.title}</span>
            <IconNext />
          </Link>
        ) : (
          <span className="post-nav-btn post-nav-btn--right post-nav-btn--disabled" aria-hidden="true">
            <span className="post-nav-label">No older posts</span>
            <IconNext />
          </span>
        )}
      </div>

      <div className="post-nav-all-posts">
        <Link href="/" className="post-nav-btn">All journals</Link>
      </div>

      {isAdmin && postId && (
        <div className="post-nav-admin">
          <span className="post-nav-admin-label">Admin</span>
          <div className="post-nav-admin-btns">
            <button onClick={() => setEveningOpen(true)} className="post-nav-admin-btn">
              🌙 Evening
            </button>
            <Link href={`/admin/publish?edit=${slug}`} className="post-nav-admin-btn">
              ✏️ Edit
            </Link>
            <Link href="/admin/publish" className="post-nav-admin-btn">
              ＋ New
            </Link>
          </div>
        </div>
      )}

      {/* Owner evening reflection button (non-admin authors) */}
      {isOwner && !isAdmin && postId && (
        <div className="post-nav-admin">
          <div className="post-nav-admin-btns">
            <button onClick={() => setEveningOpen(true)} className="post-nav-admin-btn">
              🌙 Evening
            </button>
            <Link href={`/edit/${postId}`} className="post-nav-admin-btn">
              ✏️ Edit
            </Link>
          </div>
        </div>
      )}

      {isOwner && postId && (
        <EveningReflection
          postId={postId}
          authorId={authorId}
          open={eveningOpen}
          onClose={() => { setEveningOpen(false); window.location.reload() }}
        />
      )}
    </nav>
  )
}
