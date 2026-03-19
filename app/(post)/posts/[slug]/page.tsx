import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllSlugs, getAllPosts, getPostBySlug, ProcessedPost, ParsedSection, PostMeta } from '@/lib/posts'
import { notFound } from 'next/navigation'
import ShareButton from '@/components/ShareButton'
import EveningReflection from '@/components/EveningReflection'

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found — Wolfman' }
  const url = `https://wolfman.blog/posts/${post.slug}`
  return {
    title: `${post.title} — Wolfman`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: 'Wolfman',
      type: 'article',
      publishedTime: post.date,
      ...(post.image ? { images: [{ url: post.image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: post.image ? 'summary_large_image' : 'summary',
      title: post.title,
      description: post.excerpt,
      ...(post.image ? { images: [post.image] } : {}),
    },
    alternates: { canonical: url },
  }
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

function PostNav({ nextPost, slug, title }: { nextPost: PostMeta | null; slug: string; title: string }) {
  const url = `https://wolfman.blog/posts/${slug}`
  return (
    <nav className="post-nav">
      <div className="post-nav-share-row">
        <ShareButton title={title} url={url} />
      </div>
      <div className="post-nav-links-row">
        <Link href="/intentions" className="post-nav-btn" aria-label="Back to Morning Intentions">
          <IconBack />
          <span className="post-nav-label">All posts</span>
        </Link>
        {nextPost ? (
          <Link href={`/posts/${nextPost.slug}`} className="post-nav-btn post-nav-btn--right" aria-label={`Next: ${nextPost.title}`}>
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
    </nav>
  )
}

function MorningIntentionPost({ post }: { post: ProcessedPost }) {
  const hasSections = post.sections && post.sections.length > 0
  return (
    <article className="post">
      {hasSections
        ? post.sections!.map((section: ParsedSection) => (
            <div key={section.label} className="post-section">
              <p className="post-section-label">{section.label}</p>
              <div
                className="post-body"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </div>
          ))
        : (
            <div
              className="post-body"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />
          )
      }
    </article>
  )
}

function MorningWalkPost({ post }: { post: ProcessedPost }) {
  return (
    <article className="post post--walk">
      {post.contextHtml && (
        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: post.contextHtml }}
        />
      )}
      {post.videoId && (
        <div className="post-video">
          <iframe
            src={`https://www.youtube.com/embed/${post.videoId}?rel=0`}
            allowFullScreen
            loading="lazy"
            title={post.title}
          />
        </div>
      )}
    </article>
  )
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [post, allPosts] = await Promise.all([getPostBySlug(slug), getAllPosts()])

  if (!post) notFound()

  // Posts sorted newest-first; next = the next older post
  const currentIndex = allPosts.findIndex(p => p.slug === slug)
  const nextPost = currentIndex !== -1 && currentIndex < allPosts.length - 1
    ? allPosts[currentIndex + 1]
    : null

  return (
    <>
      {post.category === 'morning-walk'
        ? <MorningWalkPost post={post} />
        : <MorningIntentionPost post={post} />
      }

      <div className="post-author-review-wrap">
        {/* Author block */}
        <div className="post-author">
          <img src="/images/site_images/matthew-face.jpg" alt="Matthew Wolfman" className="post-author-photo" />
          <div>
            <p className="post-author-byline">This post was written by</p>
            <p className="post-author-name">Matthew Wolfman</p>
            <p className="post-author-bio">Data engineer, mountain biker, photographer, wood carver. Writing every morning.</p>
          </div>
        </div>

        {/* Claude review block */}
        {post.review && (
          <div className="post-claude-review">
            <div className="post-claude-review-header">
              <img src="/images/site_images/claudecode-color.png" alt="Claude" className="post-claude-icon" />
              <span className="post-claude-review-label">Claude&apos;s take</span>
            </div>
            <div className="post-claude-review-body">
              {post.review.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <PostNav nextPost={nextPost} slug={slug} title={post.title} />

      {/* Evening reflection — admin only, invisible to readers */}
      {post.id && <EveningReflection postId={post.id} />}
    </>
  )
}
