import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import AuthForm from '@/components/AuthForm'

export default function RegisterPage() {
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
