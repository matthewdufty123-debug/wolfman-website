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
    <main className="max-w-2xl mx-auto px-6 py-16">
      <p className="font-[family-name:var(--font-jetbrains)] text-xs tracking-widest uppercase text-[#A0622A] mb-4">
        Terms &amp; Conditions
      </p>
      <h1 className="font-[family-name:var(--font-inter)] text-3xl font-semibold text-[#4A4A4A] mb-6">
        The small print, plainly stated.
      </h1>

      <p className="text-[#4A4A4A] leading-relaxed mb-10">
        These are the terms that govern your use of wolfman.app. They are written to be read, not hidden.
      </p>

      <section className="mb-8">
        <h2 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-[#4A4A4A] mb-3">Who runs this site</h2>
        <p className="text-[#4A4A4A] leading-relaxed">
          wolfman.app is operated by Matthew Wolfman, an individual based in the United Kingdom.
          This is a personal project, not a corporate product.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-[#4A4A4A] mb-3">What you are agreeing to</h2>
        <p className="text-[#4A4A4A] leading-relaxed">
          By using this site and creating an account, you agree to use it honestly and respectfully.
          You own the content you write here — your journal entries are yours. You grant wolfman.app
          no rights to your writing beyond what is needed to display it back to you.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-[#4A4A4A] mb-3">Your data</h2>
        <p className="text-[#4A4A4A] leading-relaxed mb-3">
          Your journal entries, mood scales, and ritual logs are private by default. Only you
          can see them. Matthew&apos;s posts are the only ones visible to the public.
          Your data is stored securely on Neon PostgreSQL servers and is never sold or shared
          with third parties. Read the full{' '}
          <Link href="/data-policy" className="text-[#A0622A] underline underline-offset-2">Data Policy</Link> for details.
        </p>
        <p className="text-[#4A4A4A] leading-relaxed">
          You can request deletion of your account and all associated data at any time
          via the{' '}
          <Link href="/feedback" className="text-[#A0622A] underline underline-offset-2">feedback form</Link>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-[#4A4A4A] mb-3">Cookies and analytics</h2>
        <p className="text-[#4A4A4A] leading-relaxed">
          This site uses Vercel Analytics for anonymous page-view data. No personally
          identifiable information is collected through analytics. Authentication uses
          secure HTTP-only cookies via Auth.js. No advertising cookies are used.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-[#4A4A4A] mb-3">Contact</h2>
        <p className="text-[#4A4A4A] leading-relaxed">
          Questions about these terms?{' '}
          <Link href="/feedback" className="text-[#A0622A] underline underline-offset-2">Get in touch via the feedback form</Link>
          {' '}or find Matthew on{' '}
          <a
            href="https://www.linkedin.com/in/matthewwolfman"
            className="text-[#A0622A] underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>.
        </p>
      </section>

      <p className="text-xs text-[#909090] mt-12">
        Last updated: June 2026.
      </p>
    </main>
  )
}
