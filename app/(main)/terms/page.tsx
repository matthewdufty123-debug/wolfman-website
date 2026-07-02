import type { Metadata } from 'next'
import Link from 'next/link'
import { siteMetadata } from '@/lib/metadata'

export const metadata: Metadata = siteMetadata({
  title: 'Terms',
  description: 'Terms of use, privacy summary, and data handling for wolfman.app.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <main className="legal-wrap">
      <p className="legal-eyebrow">Terms &amp; Conditions</p>
      <h1 className="legal-title">The small print, plainly stated.</h1>

      <p className="legal-body legal-intro">
        These are the terms that govern your use of wolfman.app. They are written to be read, not hidden.
      </p>

      <section className="legal-section">
        <h2 className="legal-heading">Who runs this site</h2>
        <p className="legal-body">
          wolfman.app is operated by Matthew Wolfman, an individual based in the United Kingdom.
          This is a personal project, not a corporate product.
        </p>
      </section>

      <section className="legal-section">
        <h2 className="legal-heading">What you are agreeing to</h2>
        <p className="legal-body">
          By using this site and creating an account, you agree to use it honestly and respectfully.
          You own the content you write here — your journal entries are yours. You grant wolfman.app
          no rights to your writing beyond what is needed to display it back to you.
        </p>
      </section>

      <section className="legal-section">
        <h2 className="legal-heading">Your data</h2>
        <p className="legal-body legal-body--spaced">
          Your journal entries, mood scales, and ritual logs are private by default. Only you
          can see them. Matthew&apos;s posts are the only ones visible to the public.
          Your data is stored securely on Neon PostgreSQL servers and is never sold or shared
          with third parties. Read the full{' '}
          <Link href="/data-policy" className="legal-link">Data Policy</Link> for details.
        </p>
        <p className="legal-body">
          You can request deletion of your account and all associated data at any time
          via the{' '}
          <Link href="/feedback" className="legal-link">feedback form</Link>.
        </p>
      </section>

      <section className="legal-section">
        <h2 className="legal-heading">Cookies and analytics</h2>
        <p className="legal-body">
          This site uses Vercel Analytics for anonymous page-view data. No personally
          identifiable information is collected through analytics. Authentication uses
          secure HTTP-only cookies via Auth.js. No advertising cookies are used.
        </p>
      </section>

      <section className="legal-section">
        <h2 className="legal-heading">Contact</h2>
        <p className="legal-body">
          Questions about these terms?{' '}
          <Link href="/feedback" className="legal-link">Get in touch via the feedback form</Link>
          {' '}or find Matthew on{' '}
          <a
            href="https://www.linkedin.com/in/matthewwolfman"
            className="legal-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>.
        </p>
      </section>

      <p className="legal-footnote">
        Last updated: June 2026.
      </p>
    </main>
  )
}
