import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Prevent duplicate processing
    const existing = await db.select().from(orders)
      .where(eq(orders.stripePaymentIntentId, session.payment_intent as string))
      .limit(1)
    if (existing.length > 0) return NextResponse.json({ ok: true })

    const metadata = session.metadata ?? {}
    const cartItems = JSON.parse(metadata.items ?? '[]') as {
      variantId: number
      productId: number
      productName: string
      variantName: string
      quantity: number
      unitPrice: number
    }[]

    const [order] = await db.insert(orders).values({
      userId: metadata.userId || null,
      stripePaymentIntentId: session.payment_intent as string,
      status: 'paid',
      totalAmount: session.amount_total ?? 0,
      email: session.customer_email ?? session.customer_details?.email ?? '',
    }).returning()

    if (cartItems.length > 0) {
      await db.insert(orderItems).values(
        cartItems.map(item => ({
          orderId: order.id,
          printfulProductId: String(item.productId),
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      )
    }

    // Trigger Printful fulfilment
    await triggerPrintfulOrder(order.id, session, cartItems)
  }

  return NextResponse.json({ ok: true })
}

async function triggerPrintfulOrder(
  orderId: string,
  session: Stripe.Checkout.Session,
  items: { variantId: number; productName: string; variantName: string; quantity: number }[]
) {
  const shipping = (session as Stripe.Checkout.Session & {
    shipping_details?: { name?: string; address?: { line1?: string; line2?: string; city?: string; state?: string; country?: string; postal_code?: string } }
  }).shipping_details
  if (!shipping?.address) return

  try {
    const res = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: orderId,
        recipient: {
          name: shipping.name,
          address1: shipping.address.line1,
          address2: shipping.address.line2 ?? '',
          city: shipping.address.city,
          state_code: shipping.address.state ?? '',
          country_code: shipping.address.country,
          zip: shipping.address.postal_code,
          email: session.customer_email ?? session.customer_details?.email,
        },
        items: items.map(item => ({
          sync_variant_id: item.variantId,
          quantity: item.quantity,
        })),
      }),
    })

    if (res.ok) {
      await db.update(orders).set({ status: 'fulfilled' }).where(eq(orders.id, orderId))
    }
  } catch {
    // Fulfilment failure is non-fatal — order is recorded, can be retried manually
  }
}
