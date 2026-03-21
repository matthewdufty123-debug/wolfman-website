import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg, #333F50)',
        color: 'var(--body-text, #ffffff)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '1.1rem',
          color: 'var(--heading, #E5CBBB)',
          letterSpacing: '0.04em',
          marginBottom: '0.5rem',
        }}
      >
        Nothing here.
      </p>
      <p
        style={{
          fontSize: '0.95rem',
          opacity: 0.6,
          marginBottom: '2.5rem',
          maxWidth: '320px',
          lineHeight: 1.6,
        }}
      >
        That page doesn&apos;t exist, or has moved on to somewhere better.
      </p>
      <Link
        href="/"
        style={{
          color: 'var(--heading, #E5CBBB)',
          textDecoration: 'none',
          fontSize: '0.9rem',
          letterSpacing: '0.06em',
          borderBottom: '1px solid currentColor',
          paddingBottom: '2px',
          opacity: 0.8,
        }}
      >
        back home
      </Link>
    </main>
  )
}
