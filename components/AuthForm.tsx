'use client'

import { useActionState } from 'react'

interface Field {
  name: string
  type: string
  label: string
  autoComplete?: string
}

type ActionState = { error: string } | undefined

interface Props {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  submitLabel: string
  fields: Field[]
  registeredParam?: Promise<{ registered?: string }>
  registeredMessage?: string
}

export default function AuthForm({ action, submitLabel, fields, registeredParam, registeredMessage }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="auth-form">
      {state?.error && (
        <p className="auth-error" role="alert">{state.error}</p>
      )}

      {fields.map((field) => (
        <div key={field.name} className="auth-field">
          <label htmlFor={field.name} className="auth-label">{field.label}</label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            className="auth-input"
            required
          />
        </div>
      ))}

      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? 'Please wait…' : submitLabel}
      </button>
    </form>
  )
}
