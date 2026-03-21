'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#333F50',
          color: '#ffffff',
          fontFamily: 'Georgia, serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <p
          style={{
            fontSize: '1.1rem',
            color: '#E5CBBB',
            marginBottom: '0.5rem',
            letterSpacing: '0.04em',
          }}
        >
          Something went very wrong.
        </p>
        <p style={{ fontSize: '0.9rem', opacity: 0.55, marginBottom: '2rem' }}>
          The site encountered a serious problem.
        </p>
        <button
          onClick={reset}
          style={{
            background: 'none',
            border: '1px solid rgba(229,203,187,0.4)',
            borderRadius: '4px',
            color: '#E5CBBB',
            fontSize: '0.9rem',
            padding: '0.5rem 1.25rem',
            cursor: 'pointer',
            letterSpacing: '0.06em',
          }}
        >
          try again
        </button>
      </body>
    </html>
  )
}
