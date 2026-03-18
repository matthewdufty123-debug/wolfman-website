const PRINTFUL_API = 'https://api.printful.com'

async function printfulFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${PRINTFUL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 3600 }, // cache for 1 hour
  })

  if (!res.ok) {
    throw new Error(`Printful API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  return json.result ?? json
}

export interface PrintfulVariant {
  id: number
  name: string
  retail_price: string
  currency: string
  files: { type: string; preview_url: string }[]
  options: { id: string; value: string }[]
}

export interface PrintfulProduct {
  id: number
  name: string
  description: string
  thumbnail_url: string
  variants: PrintfulVariant[]
  category: 'print' | 'clothing' | 'other'
}

export interface PrintfulProductSummary {
  id: number
  name: string
  description: string
  thumbnail_url: string
  from_price: string
  currency: string
  category: 'print' | 'clothing' | 'other'
}

function deriveCategory(name: string): PrintfulProduct['category'] {
  const lower = name.toLowerCase()
  if (lower.includes('canvas') || lower.includes('print') || lower.includes('poster') || lower.includes('photo')) {
    return 'print'
  }
  if (lower.includes('shirt') || lower.includes('hoodie') || lower.includes('tee') || lower.includes('sweat') || lower.includes('jacket')) {
    return 'clothing'
  }
  return 'other'
}

export async function getProducts(): Promise<PrintfulProductSummary[]> {
  const items = await printfulFetch<{ id: number; name: string; thumbnail_url: string }[]>('/store/products')

  const products = await Promise.all(
    items.map(async (item) => {
      try {
        const detail = await printfulFetch<{
          sync_product: { id: number; name: string; thumbnail_url: string; description?: string }
          sync_variants: { retail_price: string; currency: string }[]
        }>(`/store/products/${item.id}`)

        const prices = detail.sync_variants.map(v => parseFloat(v.retail_price)).filter(Boolean)
        const from_price = prices.length > 0 ? Math.min(...prices).toFixed(2) : '0.00'
        const currency = detail.sync_variants[0]?.currency ?? 'GBP'

        return {
          id: detail.sync_product.id,
          name: detail.sync_product.name,
          description: detail.sync_product.description ?? '',
          thumbnail_url: detail.sync_product.thumbnail_url,
          from_price,
          currency,
          category: deriveCategory(detail.sync_product.name),
        } satisfies PrintfulProductSummary
      } catch {
        return null
      }
    })
  )

  return products.filter(Boolean) as PrintfulProductSummary[]
}

export async function getProduct(id: number): Promise<PrintfulProduct | null> {
  try {
    const detail = await printfulFetch<{
      sync_product: { id: number; name: string; thumbnail_url: string; description?: string }
      sync_variants: PrintfulVariant[]
    }>(`/store/products/${id}`)

    return {
      id: detail.sync_product.id,
      name: detail.sync_product.name,
      description: detail.sync_product.description ?? '',
      thumbnail_url: detail.sync_product.thumbnail_url,
      variants: detail.sync_variants,
      category: deriveCategory(detail.sync_product.name),
    }
  } catch {
    return null
  }
}
