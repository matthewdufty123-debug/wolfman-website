import type { ProcessedPost, ParsedSection } from '@/lib/posts'

interface Props {
  post: ProcessedPost
}

function MorningIntentionPost({ post }: { post: ProcessedPost }) {
  const hasSections = post.sections && post.sections.length > 0
  return (
    <article className="post">
      {hasSections
        ? post.sections!
            .filter((section: ParsedSection) => section.html.trim().length > 0)
            .map((section: ParsedSection) => (
              <div key={section.label} className="post-section">
                <p className="post-section-label">{section.label}</p>
                <div className="post-body" dangerouslySetInnerHTML={{ __html: section.html }} />
              </div>
            ))
        : <div className="post-body" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      }
    </article>
  )
}

function MorningWalkPost({ post }: { post: ProcessedPost }) {
  return (
    <article className="post post--walk">
      {post.contextHtml && (
        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.contextHtml }} />
      )}
    </article>
  )
}

export default function JournalTextSection({ post }: Props) {
  return (
    <section id="the-journal" className="journal-section journal-section--text">
      {post.category === 'morning-walk'
        ? <MorningWalkPost post={post} />
        : <MorningIntentionPost post={post} />
      }
    </section>
  )
}
