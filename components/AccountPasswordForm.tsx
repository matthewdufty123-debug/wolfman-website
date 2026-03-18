'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/lib/actions/account'

export default function AccountPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined)

  return (
    <form action={formAction} className="account-form">
      {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state?.success && <p className="auth-success">{state.success}</p>}
      <div className="auth-field">
        <label htmlFor="current" className="auth-label">Current password</label>
        <input id="current" name="current" type="password" className="auth-input" required />
      </div>
      <div className="auth-field">
        <label htmlFor="next" className="auth-label">New password</label>
        <input id="next" name="next" type="password" className="auth-input" required />
      </div>
      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? 'Saving…' : 'Update password'}
      </button>
    </form>
  )
}
