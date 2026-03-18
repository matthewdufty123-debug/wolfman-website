import Link from 'next/link'
import ClearCartOnSuccess from '@/components/ClearCartOnSuccess'

export default function CheckoutSuccessPage() {
  return (
    <main className="auth-main">
      <ClearCartOnSuccess />
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 className="auth-title">Order received.</h1>
        <p style={{ color: 'var(--body-text)', opacity: 0.7, marginBottom: '2rem', lineHeight: 1.7 }}>
          Thank you — your order is confirmed and will be with you soon.
          You&apos;ll receive a confirmation email shortly.
        </p>
        <Link href="/" className="auth-submit" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Back to Wolfman
        </Link>
      </div>
    </main>
  )
}
