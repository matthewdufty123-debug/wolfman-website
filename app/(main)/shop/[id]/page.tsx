import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/printful'
import AddToCartButton from '@/components/AddToCartButton'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const products = await getProducts()
    return products.map(p => ({ id: String(p.id) }))
  } catch {
    return []
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(Number(id))
  if (!product) notFound()

  const prices = product.variants.map(v => parseFloat(v.retail_price)).filter(Boolean)
  const fromPrice = prices.length > 0 ? Math.min(...prices).toFixed(2) : null

  return (
    <main className="product-main">
      <div className="product-wrap">

        <Link href="/shop" className="product-back">← Back to shop</Link>

        <div className="product-layout">
          {/* Image */}
          <div className="product-img-wrap">
            <Image
              src={product.thumbnail_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="product-img"
              priority
            />
          </div>

          {/* Details */}
          <div className="product-details">
            <h1 className="product-name">{product.name}</h1>
            {fromPrice && (
              <p className="product-price">From £{fromPrice}</p>
            )}
            {product.description && (
              <p className="product-description">{product.description}</p>
            )}

            {product.variants.length > 0 && (
              <AddToCartButton product={product} />
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
