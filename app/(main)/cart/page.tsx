'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { useState } from 'react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setCheckingOut(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setCheckingOut(false)
    }
  }

  if (count === 0) {
    return (
      <main className="cart-main">
        <div className="cart-wrap">
          <h1 className="cart-title">Your cart</h1>
          <p className="cart-empty">Nothing here yet.</p>
          <Link href="/shop" className="cart-continue">Browse the shop →</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="cart-main">
      <div className="cart-wrap">
        <h1 className="cart-title">Your cart</h1>

        <ul className="cart-items">
          {items.map((item) => (
            <li key={item.variantId} className="cart-item">
              <div className="cart-item-img-wrap">
                <Image
                  src={item.thumbnail}
                  alt={item.productName}
                  fill
                  sizes="80px"
                  className="cart-item-img"
                />
              </div>
              <div className="cart-item-details">
                <p className="cart-item-name">{item.productName}</p>
                <p className="cart-item-variant">{item.variantName}</p>
                <p className="cart-item-price">£{item.price.toFixed(2)}</p>
              </div>
              <div className="cart-item-qty">
                <button className="cart-qty-btn" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button className="cart-qty-btn" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>+</button>
              </div>
              <button className="cart-remove" onClick={() => removeItem(item.variantId)} aria-label="Remove">×</button>
            </li>
          ))}
        </ul>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="cart-checkout-btn" onClick={handleCheckout} disabled={checkingOut}>
            {checkingOut ? 'Redirecting to checkout…' : 'Checkout securely'}
          </button>

          <Link href="/shop" className="cart-continue">← Continue shopping</Link>
        </div>
      </div>
    </main>
  )
}
