import { readFile } from 'fs/promises'
import path from 'path'
import Link from 'next/link'

interface Post {
  date: string
  title: string
  slug: string
  category: string
}

interface Category {
  id: string
  label: string
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default async function IntentionsPage() {
  let posts: Post[] = []
  let categories: Category[] = []

  try {
    const postsRaw = await readFile(path.join(process.cwd(), 'posts', 'posts.json'), 'utf-8')
    posts = JSON.parse(postsRaw)
  } catch {
    // posts.json missing or malformed — render empty state
  }

  try {
    const catsRaw = await readFile(path.join(process.cwd(), 'posts', 'categories.json'), 'utf-8')
    categories = JSON.parse(catsRaw)
  } catch {
    // categories.json missing — proceed without labels
  }

  const categoryLabel = (id: string) =>
    categories.find((c) => c.id === id)?.label ?? id

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
                <span className="post-list-category">{categoryLabel(post.category)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
