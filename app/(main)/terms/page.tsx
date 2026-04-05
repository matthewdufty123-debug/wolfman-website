import type { Metadata } from 'next'
import Link from 'next/link'
import { siteMetadata } from '@/lib/metadata'

export const metadata: Metadata = siteMetadata({
  title: 'Terms',
  description: 'Terms of use, privacy summary, and data handling for wolfman.blog.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <main className="beta-page">
      <div className="beta-card">
        <p className="beta-eyebrow">Terms &amp; Conditions</p>
        <h1 className="beta-title">The small print, plainly stated.</h1>

        <p className="beta-intro">
          These are the terms that govern your use of wolfman.blog during the beta period.
          They are written to be read, not hidden. A full legal review will be completed
          before v1.0 goes live — see{' '}
          <Link href="/features" className="beta-link">Release 0.9 — Legal</Link>.
        </p>

        <div className="beta-section">
          <h2 className="beta-section-title">Who runs this site</h2>
          <p className="beta-section-body">
            wolfman.blog is operated by Matthew Wolfman, an individual based in the United Kingdom.
            This is not a corporate product — it is a personal project built in public.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">What you are agreeing to</h2>
          <p className="beta-section-body">
            By using this site and creating an account, you agree to use it honestly and respectfully.
            You own the content you write here — your journal entries are yours. You grant wolfman.blog
            no rights to your writing beyond what is needed to display it back to you.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">Your data</h2>
          <p className="beta-section-body">
            Your journal entries, mood scales, and ritual logs are private by default. Only you
            can see them. Matthew&apos;s posts are the only ones visible to the public.
            Your data is stored securely on Neon PostgreSQL servers and is never sold or shared
            with third parties. Read the full{' '}
            <Link href="/data-policy" className="beta-link">Data Policy</Link> for details.
          </p>
          <p className="beta-section-body" style={{ marginTop: '0.75rem' }}>
            You can request deletion of your account and all associated data at any time.
            During the beta, contact Matthew directly via the{' '}
            <Link href="/feedback" className="beta-link">feedback form</Link>.
            A self-serve deletion option is coming in Release 0.1.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">Cookies and analytics</h2>
          <p className="beta-section-body">
            This site uses Vercel Analytics for anonymous page-view data. No personally
            identifiable information is collected through analytics. Authentication uses
            secure HTTP-only cookies via Auth.js. No advertising cookies are used.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">Beta disclaimer</h2>
          <p className="beta-section-body">
            This is a beta product. Features may change, break, or be removed.
            Matthew will communicate any significant changes directly. If the beta ends,
            you will have 30 days to export your data before it is permanently deleted.
            See the{' '}
            <Link href="/beta" className="beta-link">beta page</Link>{' '}
            for full details.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">Contact</h2>
          <p className="beta-section-body">
            Questions about these terms?{' '}
            <Link href="/feedback" className="beta-link">Get in touch via the feedback form</Link>
            {' '}or find Matthew on{' '}
            <a
              href="https://www.linkedin.com/in/matthewwolfman"
              className="beta-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            .
          </p>
        </div>

        <p className="beta-section-body" style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.6 }}>
          Last updated: March 2026. These terms will be replaced by a full legal review at Release 0.9.
        </p>
      </div>
    </main>
  )
}
