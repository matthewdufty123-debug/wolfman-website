import Image from 'next/image'

interface Props {
  imageUrl: string | null | undefined
  title: string
}

export default function JournalPhotoSection({ imageUrl, title }: Props) {
  if (!imageUrl) return null

  return (
    <section id="journal-photo" className="journal-section">
      <h2 className="journal-section-title">Journal Photo</h2>
      <div className="journal-photo-wrap">
        <Image
          src={imageUrl}
          alt={title}
          width={600}
          height={600}
          className="journal-photo-img"
          style={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 8 }}
          unoptimized
        />
      </div>
    </section>
  )
}
