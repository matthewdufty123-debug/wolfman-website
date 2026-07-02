import type { Metadata } from 'next'
import { getAllSlugsWithUsernames } from '@/lib/posts'
import { buildPostMetadata, PostPageView } from './post-page-view'

// The sacred reading experience — statically rendered and served from the
// CDN for anonymous readers. Logged-in users never reach this page: the
// middleware rewrites them to the session-aware /reader variant, so this
// render always treats the visitor as anonymous (session: null) and only
// public journals (published, admin author) come out of it.

// Refresh in the background at most every 5 minutes; publish/edit also
// revalidate on demand via revalidatePost() in lib/revalidate-post.ts.
export const revalidate = 300

// Allow slugs not in generateStaticParams to be dynamically rendered (posts published after a build)
export const dynamicParams = true

export async function generateStaticParams() {
  const pairs = await getAllSlugsWithUsernames()
  return pairs
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string; slug: string }> }
): Promise<Metadata> {
  const { username, slug } = await params
  return buildPostMetadata(username, slug)
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params
  return <PostPageView username={username} slug={slug} session={null} />
}
