import type { Metadata } from 'next'
import { auth } from '@/auth'
import { buildPostMetadata, PostPageView } from '../../../[username]/[slug]/post-page-view'

// Session-aware variant of the journal reading page. Never linked or
// indexed: the middleware rewrites logged-in users' requests for
// /[username]/[slug] here (URL unchanged), and redirects anonymous
// visitors who hit /reader/* directly back to the canonical URL.
// Handles drafts, non-admin authors' private journals, and owner
// affordances — everything the static page can't know without a session.

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ username: string; slug: string }> }
): Promise<Metadata> {
  const { username, slug } = await params
  const metadata = await buildPostMetadata(username, slug)
  return { ...metadata, robots: { index: false, follow: false } }
}

export default async function ReaderPostPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params
  const session = await auth()
  return <PostPageView username={username} slug={slug} session={session} />
}
