import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'

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
  const posts = await getAllPosts()

  return (
    <>
      <header className="intentions-header">
        <h1 className="intentions-title">Morning Intentions</h1>
        <Link href="/admin" className="admin-link">+ new post</Link>
      </header>

      {posts.length === 0 ? (
        <ul className="post-list">
          <li className="post-list-empty">No posts yet.</li>
        </ul>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug} className="post-list-item">
              <Link href={`/posts/${post.slug}`} className="post-list-link">
                <span className="post-list-date">{formatDate(post.date)}</span>
                <span className="post-list-title">{post.title}</span>
                <span className="post-list-category">{CATEGORY_LABELS[post.category] ?? post.category}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
