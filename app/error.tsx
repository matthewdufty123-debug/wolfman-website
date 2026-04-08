'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[error.tsx]', error.message, error.digest, error.stack)

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
        Something went wrong.
      </p>
      <p
        style={{
          fontSize: '0.95rem',
          opacity: 0.6,
          marginBottom: '2.5rem',
          maxWidth: '340px',
          lineHeight: 1.6,
        }}
      >
        {error.digest
          ? `An unexpected error occurred. (${error.digest})`
          : 'An unexpected error occurred.'}
      </p>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <button
          onClick={reset}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--heading, #E5CBBB)',
            fontSize: '0.9rem',
            letterSpacing: '0.06em',
            borderBottom: '1px solid currentColor',
            paddingBottom: '2px',
            opacity: 0.8,
            fontFamily: 'inherit',
          }}
        >
          try again
        </button>
        <Link
          href="/"
          style={{
            color: 'var(--heading, #E5CBBB)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            letterSpacing: '0.06em',
            borderBottom: '1px solid currentColor',
            paddingBottom: '2px',
            opacity: 0.6,
          }}
        >
          go home
        </Link>
      </div>
    </main>
  )
}
