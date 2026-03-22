import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import AuthForm from '@/components/AuthForm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

export default async function RegisterPage() {
  const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(users)
  const isClosed = Number(count) >= 51

  if (isClosed) {
    return (
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-title">Registration is closed.</h1>
          <p className="beta-register-closed-body">
            The wolfman.blog beta has reached its limit of 51 testers. Thank you for your
            interest — it means a lot.
          </p>
          <p className="beta-register-closed-body">
            The beta runs until <strong>1 June 2026</strong>. If it continues, registration
            may reopen. Keep an eye on{' '}
            <a
              href="https://www.linkedin.com/in/matthewwolfman"
              className="beta-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Matthew&apos;s LinkedIn
            </a>
            {' '}for updates.
          </p>
          <p className="beta-register-closed-body" style={{ marginTop: '2rem' }}>
            <Link href="/beta" className="beta-link">Learn more about the beta →</Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-main">
      <div className="auth-card">
        <h1 className="auth-title">Create an account.</h1>

        {/* Beta terms summary */}
        <div className="beta-register-terms">
          <p className="beta-register-terms-headline">You&apos;re joining the public beta.</p>
          <ul className="beta-register-terms-list">
            <li>Beta runs until <strong>1 June 2026</strong></li>
            <li>Your journal entries are private — only you can see them</li>
            <li>If the beta continues, your data carries over seamlessly</li>
            <li>If the beta ends, you get 30 days to download your data before deletion</li>
          </ul>
          <Link href="/beta" className="beta-register-terms-link">Full details →</Link>
        </div>

        <AuthForm
          action={register}
          submitLabel="Create account"
          fields={[
            { name: 'name', type: 'text', label: 'Your name', autoComplete: 'name' },
            { name: 'email', type: 'email', label: 'Email', autoComplete: 'email' },
            { name: 'password', type: 'password', label: 'Password', autoComplete: 'new-password' },
          ]}
        />

        <p className="auth-switch">
          Already have an account?{' '}
          <Link href="/login" className="auth-switch-link">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
