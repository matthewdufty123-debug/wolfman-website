'use client'

import { useActionState } from 'react'
import { updatePhone, removePhone, unlinkTelegram } from '@/lib/actions/account'

interface Props {
  currentPhone: string | null
  phoneVerified: boolean
  telegramLinked: boolean
}

export default function AccountPhoneForm({ currentPhone, phoneVerified, telegramLinked }: Props) {
  const [state, formAction, pending] = useActionState(updatePhone, undefined)
  const [removeState, removeAction, removePending] = useActionState(removePhone, undefined)
  const [unlinkState, unlinkAction, unlinkPending] = useActionState(unlinkTelegram, undefined)

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

      {/* Telegram link status */}
      {currentPhone && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-muted, #e5e5e5)' }}>
          <p className="auth-label" style={{ marginBottom: '0.5rem' }}>Telegram</p>
          {telegramLinked ? (
            <>
              <p className="account-phone-status">
                <span className="account-phone-badge account-phone-badge--verified">Linked</span>
              </p>
              <form action={unlinkAction} className="account-form" style={{ marginTop: '0.5rem' }}>
                {unlinkState?.error && <p className="auth-error" role="alert">{unlinkState.error}</p>}
                {unlinkState?.success && <p className="auth-success">{unlinkState.success}</p>}
                <button type="submit" className="auth-submit auth-submit--danger" disabled={unlinkPending}>
                  {unlinkPending ? 'Unlinking...' : 'Unlink Telegram'}
                </button>
              </form>
            </>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #909090)' }}>
              Not linked — message the Wolfman bot on Telegram to connect.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
