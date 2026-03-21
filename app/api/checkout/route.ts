import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import type { CartItem } from '@/lib/cart'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const session = await auth()
  const { items } = await request.json() as { items: CartItem[] }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
  }

  const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'https://wolfman.blog'

  const lineItems = items.map((item) => ({
    price_data: {
      currency: 'gbp',
      product_data: {
        name: item.productName,
        description: item.variantName,
        images: [item.thumbnail],
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }))

  let checkoutSession: Stripe.Checkout.Session
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: session?.user?.email ?? undefined,
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK'],
      },
      metadata: {
        userId: session?.user?.id ?? '',
        items: JSON.stringify(items.map(i => ({
          variantId: i.variantId,
          productId: i.productId,
          productName: i.productName,
          variantName: i.variantName,
          quantity: i.quantity,
          unitPrice: Math.round(i.price * 100),
        }))),
      },
    })
  } catch (err) {
    console.error('[checkout] Stripe session creation failed:', err)
    return NextResponse.json({ error: 'Unable to create checkout session. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}
