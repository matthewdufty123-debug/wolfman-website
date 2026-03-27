import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betaInterest } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Resend webhook events we care about
type ResendEmailEvent = 'email.delivered' | 'email.bounced' | 'email.complained'

const STATUS_MAP: Record<ResendEmailEvent, string> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
}

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const secret = process.env.RESEND_WEBHOOK_SECRET
    if (secret) {
      const signature = req.headers.get('svix-signature')
      const msgId = req.headers.get('svix-id')
      const msgTimestamp = req.headers.get('svix-timestamp')

      if (!signature || !msgId || !msgTimestamp) {
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 })
      }

      // Svix signature verification
      const { Webhook } = await import('svix')
      const wh = new Webhook(secret)
      const payload = await req.text()
      try {
        wh.verify(payload, {
          'svix-id': msgId,
          'svix-timestamp': msgTimestamp,
          'svix-signature': signature,
        })
      } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }

      const event = JSON.parse(payload)
      await handleEvent(event)
    } else {
      // No secret configured — process without verification (dev only)
      const event = await req.json()
      await handleEvent(event)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[resend-webhook] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handleEvent(event: { type: string; data: { to: string[] } }) {
  const eventType = event.type as ResendEmailEvent
  const newStatus = STATUS_MAP[eventType]

  if (!newStatus) return // not an event we handle

  const recipientEmail = event.data?.to?.[0]
  if (!recipientEmail) return

  await db
    .update(betaInterest)
    .set({ emailStatus: newStatus, emailStatusAt: new Date() })
    .where(eq(betaInterest.email, recipientEmail.toLowerCase().trim()))
}
