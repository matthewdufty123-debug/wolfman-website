'use client'

import { useActionState } from 'react'
import { updatePhone, removePhone } from '@/lib/actions/account'

interface Props {
  currentPhone: string | null
  phoneVerified: boolean
}

export default function AccountPhoneForm({ currentPhone, phoneVerified }: Props) {
  const [state, formAction, pending] = useActionState(updatePhone, undefined)
  const [removeState, removeAction, removePending] = useActionState(removePhone, undefined)

  return (
    <div>
      {currentPhone && (
        <p className="account-phone-status">
          <span className={`account-phone-badge ${phoneVerified ? 'account-phone-badge--verified' : ''}`}>
            {phoneVerified ? 'Verified' : 'Not verified'}
          </span>
        </p>
      )}

      <form action={formAction} className="account-form">
        {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
        {state?.success && <p className="auth-success">{state.success}</p>}
        <div className="auth-field">
          <label htmlFor="phone" className="auth-label">Phone number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={currentPhone ?? ''}
            placeholder="+44..."
            className="auth-input"
            autoComplete="tel"
            required
          />
        </div>
        <button type="submit" className="auth-submit" disabled={pending}>
          {pending ? 'Saving...' : 'Save phone number'}
        </button>
      </form>

      {currentPhone && (
        <form action={removeAction} className="account-form" style={{ marginTop: '0.75rem' }}>
          {removeState?.error && <p className="auth-error" role="alert">{removeState.error}</p>}
          {removeState?.success && <p className="auth-success">{removeState.success}</p>}
          <button type="submit" className="auth-submit auth-submit--danger" disabled={removePending}>
            {removePending ? 'Removing...' : 'Remove phone number'}
          </button>
        </form>
      )}
    </div>
  )
}
