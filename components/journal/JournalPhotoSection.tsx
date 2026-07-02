import Image from 'next/image'

interface Props {
  imageUrl: string | null | undefined
  title: string
  caption?: string | null
}

export default function JournalPhotoSection({ imageUrl, title, caption }: Props) {
  if (!imageUrl) return null

  return (
    <section id="journal-photo" className="journal-section">
      <h2 className="journal-section-title">Journal Photo</h2>
      <div className="journal-photo-wrap">
        <Image
          src={imageUrl}
          alt={caption || title}
          width={800}
          height={800}
          sizes="(max-width: 720px) 100vw, 680px"
          className="journal-photo-img"
          style={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 8 }}
        />
        {caption && (
          <p className="journal-photo-caption">{caption}</p>
        )}
      </div>
    </section>
  )
}
