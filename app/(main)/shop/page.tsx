import Image from 'next/image'
import Link from 'next/link'
import { getProducts } from '@/lib/printful'
import type { PrintfulProductSummary } from '@/lib/printful'

export const revalidate = 3600

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  let products: PrintfulProductSummary[] = []
  let error = false

  try {
    products = await getProducts()
  } catch {
    error = true
  }

  const filtered = category && category !== 'all'
    ? products.filter(p => p.category === category)
    : products

  return (
    <main className="shop-main">
      <div className="shop-wrap">
        <header className="shop-header">
          <h1 className="shop-title">The Shop</h1>
          <p className="shop-subtitle">Photography prints, canvases, and clothing — made with care.</p>
        </header>

        {/* Category filter */}
        {products.length > 0 && (
          <div className="shop-filters">
            <Link href="/shop" className={`shop-filter-btn${!category || category === 'all' ? ' shop-filter-btn--active' : ''}`}>
              All
            </Link>
            <Link href="/shop?category=print" className={`shop-filter-btn${category === 'print' ? ' shop-filter-btn--active' : ''}`}>
              Prints &amp; Canvases
            </Link>
            <Link href="/shop?category=clothing" className={`shop-filter-btn${category === 'clothing' ? ' shop-filter-btn--active' : ''}`}>
              Clothing
            </Link>
          </div>
        )}

        {error && (
          <p className="shop-error">Unable to load products right now. Please try again shortly.</p>
        )}

        {!error && products.length === 0 && (
          <p className="shop-empty">Products coming soon.</p>
        )}

        {!error && filtered.length > 0 && (
          <div className="shop-grid">
            {filtered.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="shop-card">
                <div className="shop-card-img-wrap">
                  <Image
                    src={product.thumbnail_url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                    className="shop-card-img"
                  />
                </div>
                <div className="shop-card-body">
                  <h2 className="shop-card-name">{product.name}</h2>
                  <p className="shop-card-price">From £{product.from_price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
