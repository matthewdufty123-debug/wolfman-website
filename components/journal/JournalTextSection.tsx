import type { ProcessedPost, ParsedSection } from '@/lib/posts'
import SectionInfoHeader from '@/components/journal/SectionInfoHeader'

interface Props {
  post: ProcessedPost
}

function MorningIntentionPost({ post }: { post: ProcessedPost }) {
  const hasSections = post.sections && post.sections.length > 0
  return (
    <article className="post">
      {hasSections
        ? post.sections!.map((section: ParsedSection) => (
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
      <SectionInfoHeader
        title="The Journal"
        description="Matthew's morning intention — a reflection, a lesson, and a commitment to the day ahead."
        popupBody="Each entry follows a three-part structure: Today's Intention is a story or observation that leads to a lesson; I'm Grateful For names something vivid and specific, never generic; Something I'm Great At is a strength, owned without apology. Writing these, daily, is the heart of the Wolfman practice."
        popupLink={{ href: '/journaling', label: 'About the journalling practice' }}
      />
      {post.category === 'morning-walk'
        ? <MorningWalkPost post={post} />
        : <MorningIntentionPost post={post} />
      }
    </section>
  )
}
