import { getAllPosts } from '@/lib/posts'
import { auth } from '@/auth'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  'morning-intention': 'Morning Intention',
  'morning-walk':      'Morning Walk with Matthew',
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default async function IntentionsPage() {
  const [posts, session] = await Promise.all([getAllPosts(), auth()])
  const isAdmin = session?.user?.role === 'admin'

  return (
    <>
      <header className="intentions-header">
        <h1 className="intentions-title">Morning Intentions</h1>
      </header>

      {posts.length === 0 ? (
        <ul className="post-list">
          <li className="post-list-empty">No posts yet.</li>
        </ul>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug} className="post-list-item" style={isAdmin ? { display: 'flex', alignItems: 'stretch' } : undefined}>
              <Link href={`/posts/${post.slug}`} className="post-list-link" style={isAdmin ? { flex: 1 } : undefined}>
                <span className="post-list-date">{formatDate(post.date)}</span>
                <span className="post-list-title">{post.title}</span>
                <span className="post-list-category">{CATEGORY_LABELS[post.category] ?? post.category}</span>
              </Link>
              {isAdmin && (
                <Link
                  href={`/admin/publish?edit=${post.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 0.75rem',
                    fontSize: '0.72rem',
                    color: '#909090',
                    textDecoration: 'none',
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    borderLeft: '1px solid #E8E4DF',
                  }}
                >
                  edit
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
