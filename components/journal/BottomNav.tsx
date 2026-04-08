interface BottomNavProps {
  username: string
  nextPost: { slug: string; username: string } | null
  isOwner: boolean
  editHref: string | null
}

export default function BottomNav({ username, nextPost, isOwner, editHref }: BottomNavProps) {
  const profileHref = `/${username}`
  const nextHref = nextPost ? `/${nextPost.username}/${nextPost.slug}` : null

  return (
    <div className="journal-bottom-nav">
      <a href={profileHref} className="journal-nav-btn journal-nav-btn--default">
        View Profile
      </a>
      {nextHref && (
        <a href={nextHref} className="journal-nav-btn journal-nav-btn--default">
          Next Journal →
        </a>
      )}
      <a href="/write" className="journal-nav-btn journal-nav-btn--default">
        Write a New Journal
      </a>
      {isOwner && editHref && (
        <a href={editHref} className="journal-nav-btn journal-nav-btn--primary">
          Edit This Journal
        </a>
      )}
    </div>
  )
}
