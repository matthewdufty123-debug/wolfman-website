import type { ProcessedPost } from '@/lib/posts'

interface Props {
  post: ProcessedPost
}

function formatPostDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  const suffix = [1, 21, 31].includes(day) ? 'st' : [2, 22].includes(day) ? 'nd'
               : [3, 23].includes(day) ? 'rd' : 'th'
  return `${day}${suffix} ${months[month - 1]} ${year}`
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ')
}

export default function PostInfoSection({ post }: Props) {
  const wordCount = countWords(stripHtml(post.bodyHtml))

  return (
    <section id="post-information" className="journal-section">
      <h2 className="journal-section-title">Post Information</h2>
      <div className="post-info-rows">
        <div className="post-info-row">
          <span className="post-info-label">Title</span>
          <span className="post-info-value">{post.title}</span>
        </div>
        <div className="post-info-row">
          <span className="post-info-label">Date</span>
          <span className="post-info-value">{formatPostDate(post.date)}</span>
        </div>
        <div className="post-info-row">
          <span className="post-info-label">Words</span>
          <span className="post-info-value">{wordCount.toLocaleString()}</span>
        </div>
        <div className="post-info-row">
          <span className="post-info-label">Status</span>
          <span className={`post-info-badge post-info-badge--${post.status}`}>{post.status}</span>
        </div>
      </div>
    </section>
  )
}
