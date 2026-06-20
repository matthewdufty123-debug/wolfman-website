import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import AuthForm from '@/components/AuthForm'
import { getRegistrationState } from '@/lib/site-config'

export default async function RegisterPage() {
  const { registrationOpen, capReached } = await getRegistrationState()

  // Registration not open — invitation only
  if (!registrationOpen) {
    return (
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-title">Registration is by invitation only.</h1>
          <p className="auth-body">
            wolfman.app is a private site. If you&apos;d like access, get in touch with Matthew directly.
          </p>
          <p className="auth-switch">
            Already have an account?{' '}
            <Link href="/login" className="auth-switch-link">Sign in →</Link>
          </p>
        </div>
      </main>
    )
  }

  // Open but cap reached
  if (capReached) {
    return (
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-title">Registration is closed.</h1>
          <p className="auth-body">
            wolfman.app has reached its current user limit. Thank you for your interest.
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
