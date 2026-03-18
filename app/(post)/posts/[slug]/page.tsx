import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllSlugs, getPostBySlug, ProcessedPost, ParsedSection } from '@/lib/posts'
import { notFound } from 'next/navigation'

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

function PostColophon({ title }: { title: string }) {
  return (
    <footer className="post-footer">
      <p className="post-colophon">You have been reading...</p>
      <p className="post-colophon post-colophon--title">{title}</p>
      <Link href="/" className="wolf-home-link" aria-label="Return to Wolfman home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/site_images/Grey Bronze LogoAsset 14300.png"
          alt="Wolfman"
          width={64}
          height={64}
        />
      </Link>
    </footer>
  )
}

function MorningIntentionPost({ post }: { post: ProcessedPost }) {
  const hasSections = post.sections && post.sections.length > 0
  return (
    <>
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
      <PostColophon title={post.title} />
    </>
  )
}

function MorningWalkPost({ post }: { post: ProcessedPost }) {
  return (
    <>
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
      <PostColophon title={post.title} />
    </>
  )
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  if (post.category === 'morning-walk') {
    return <MorningWalkPost post={post} />
  }

  return <MorningIntentionPost post={post} />
}
