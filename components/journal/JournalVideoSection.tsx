interface Props {
  videoId: string
  title: string
}

export default function JournalVideoSection({ videoId, title }: Props) {
  return (
    <section id="the-video" className="journal-section journal-section--video">
      <h2 className="journal-section-title">Watch</h2>
      <div className="post-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          allowFullScreen
          loading="lazy"
          title={title}
        />
      </div>
    </section>
  )
}
