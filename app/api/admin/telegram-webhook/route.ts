import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { setWebhook, deleteWebhook, getWebhookInfo } from '@/lib/telegram'

const PRODUCTION_WEBHOOK_URL = 'https://wolfman.app/api/telegram/webhook'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await getWebhookInfo()
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action, url } = await request.json() as { action: string; url?: string }

  if (action === 'set') {
    const webhookUrl = url || PRODUCTION_WEBHOOK_URL
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    const result = await setWebhook(webhookUrl, secret)
    return NextResponse.json(result)
  }

  if (action === 'delete') {
    const result = await deleteWebhook()
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Invalid action — use "set" or "delete"' }, { status: 400 })
}
