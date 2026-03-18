'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart'
import type { PrintfulProduct } from '@/lib/printful'

export default function AddToCartButton({ product }: { product: PrintfulProduct }) {
  const { addItem } = useCart()
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? 0)
  const [added, setAdded] = useState(false)

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) ?? product.variants[0]

  function handleAdd() {
    if (!selectedVariant) return
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      variantName: selectedVariant.name,
      price: parseFloat(selectedVariant.retail_price),
      quantity: 1,
      thumbnail: product.thumbnail_url,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="product-actions">
      {product.variants.length > 1 && (
        <div className="auth-field">
          <label htmlFor="variant" className="auth-label">Option</label>
          <select
            id="variant"
            className="product-select"
            value={selectedVariantId}
            onChange={e => setSelectedVariantId(Number(e.target.value))}
          >
            {product.variants.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} — £{parseFloat(v.retail_price).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      )}

      <button className="product-add-btn" onClick={handleAdd} disabled={added}>
        {added ? 'Added to cart ✓' : 'Add to cart'}
      </button>
    </div>
  )
}
