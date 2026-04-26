import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import AuthForm from '@/components/AuthForm'
import { getRegistrationState } from '@/lib/site-config'
import BetaInterestForm from '@/components/BetaInterestForm'

export default async function RegisterPage() {
  const { config, registrationOpen, capReached } = await getRegistrationState()

  // Closed alpha / closed beta — registration not open yet
  if (!registrationOpen) {
    const message = config.statusMessage ?? (
      config.status === 'closed_alpha'
        ? 'wolfman.app is currently in private alpha. Registration is not open yet.'
        : 'wolfman.app is coming soon. Registration is not open yet.'
    )
    return (
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-title">Registration is not open yet.</h1>
          <p className="beta-register-closed-body">{message}</p>
          <p className="beta-register-closed-body">
            The public beta opens on <strong>1 May 2026</strong>. Register your interest below
            and we&apos;ll let you know the moment it does.
          </p>
          <div style={{ marginTop: '1.75rem' }}>
            <BetaInterestForm source="register-page" />
          </div>
          <p className="beta-register-closed-body" style={{ marginTop: '2rem' }}>
            <Link href="/beta" className="beta-link">Learn more about the beta →</Link>
          </p>
          <p className="beta-register-closed-body">
            Already have an account?{' '}
            <Link href="/login" className="beta-link">Sign in →</Link>
          </p>
        </div>
      </main>
    )
  }

  // Open but cap reached
  if (capReached) {
    const message = config.statusMessage ?? 'The wolfman.app beta has reached its limit of testers. Thank you for your interest — it means a lot.'
    return (
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-title">Registration is closed.</h1>
          <p className="beta-register-closed-body">{message}</p>
          <p className="beta-register-closed-body">
            The beta runs until <strong>31 August 2026</strong>.{' '}
            <Link href="/beta" className="beta-link">Register your interest →</Link>
          </p>
          <p className="beta-register-closed-body" style={{ marginTop: '2rem' }}>
            <Link href="/beta" className="beta-link">Learn more about the beta →</Link>
          </p>
        </div>
      </main>
    )
  }

  // Registration is open
  return (
    <main className="auth-main">
      <div className="auth-card">
        <h1 className="auth-title">Create an account.</h1>

        <div className="beta-register-terms">
          <p className="beta-register-terms-headline">You&apos;re joining the public beta.</p>
          <ul className="beta-register-terms-list">
            <li>Beta runs until <strong>31 August 2026</strong></li>
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
            { name: 'phone', type: 'tel', label: 'Phone number', autoComplete: 'tel', placeholder: '+44...' },
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
