interface AuthorProps {
  id: string
  name: string | null
  displayName: string | null
  bio: string | null
  avatar: string | null
  image: string | null
  username: string | null
  role: string
}

interface Props {
  author: AuthorProps
  username: string
}

export default function ProfileSection({ author, username }: Props) {
  const authorName = author.displayName ?? author.name ?? username

  return (
    <section id="profile-information" className="journal-section">
      <h2 className="journal-section-title">About the Author</h2>
      <a href={`/${username}`} className="post-author">
        {(author.avatar ?? author.image) ? (
          <img
            src={author.avatar ?? author.image ?? ''}
            alt={authorName}
            className="post-author-photo"
          />
        ) : (
          <div
            className="post-author-photo"
            style={{
              background: '#4A7FA5', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 700, borderRadius: '50%',
              fontFamily: 'var(--font-inter)',
            }}
          >
            {authorName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        )}
        <div>
          <p className="post-author-byline">This journal was written by</p>
          <p className="post-author-name">{authorName}</p>
          {author.bio && (
            <p className="post-author-bio">{author.bio}</p>
          )}
        </div>
      </a>
    </section>
  )
}
