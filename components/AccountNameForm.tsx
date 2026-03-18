'use client'

import { useActionState } from 'react'
import { updateName } from '@/lib/actions/account'

export default function AccountNameForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState(updateName, undefined)

  return (
    <form action={formAction} className="account-form">
      {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state?.success && <p className="auth-success">{state.success}</p>}
      <div className="auth-field">
        <label htmlFor="name" className="auth-label">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={currentName}
          className="auth-input"
          autoComplete="name"
          required
        />
      </div>
      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save name'}
      </button>
    </form>
  )
}
