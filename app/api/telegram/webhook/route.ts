import { NextResponse } from 'next/server'
import { sendMessage, sendContactRequest, type TelegramUpdate } from '@/lib/telegram'
import { handleTelegramMessage } from '@/lib/telegram-bot'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { normalisePhone } from '@/lib/phone'

export async function POST(request: Request) {
  // Verify webhook secret
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const headerSecret = request.headers.get('x-telegram-bot-api-secret-token')
    if (headerSecret !== secret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
    }
  }

  let update: TelegramUpdate
  try {
    update = await request.json() as TelegramUpdate
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Extract chatId from message or callback query
  const message = update.message ?? update.callback_query?.message
  if (!message) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const contact = update.message?.contact

  console.log(`[Telegram] chatId=${chatId} text=${update.message?.text ?? '(none)'} callback=${update.callback_query?.data ?? '(none)'}`)

  try {
    // Handle contact share — account linking
    if (contact) {
      await handleContactShare(chatId, contact.phone_number)
      return NextResponse.json({ ok: true })
    }

    // Check if this chat is linked to a user
    const [linkedUser] = await db.select({
      id: users.id,
      name: users.name,
      timezone: users.timezone,
      profession: users.profession,
      humourSource: users.humourSource,
      telegramState: users.telegramState,
    })
      .from(users)
      .where(eq(users.telegramChatId, String(chatId)))
      .limit(1)

    if (linkedUser) {
      await handleTelegramMessage(chatId, linkedUser, update)
    } else {
      // Not linked — prompt to share phone number
      await sendContactRequest(
        chatId,
        'Welcome to Wolfman! To link your account, please share your phone number using the button below.'
      )
    }
  } catch (err) {
    console.error('[Telegram] webhook handler error:', err)
  }

  // Always return 200 promptly — Telegram retries on failure
  return NextResponse.json({ ok: true })
}

async function handleContactShare(chatId: number, rawPhone: string) {
  // Telegram sometimes sends numbers without '+' prefix — add it if missing
  const prefixed = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`
  const phone = normalisePhone(prefixed) ?? prefixed.replace(/[\s\-()]/g, '')

  const [matchedUser] = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.phoneNumber, phone))
    .limit(1)

  if (!matchedUser) {
    await sendMessage(
      chatId,
      "I couldn't find an account with that number.\n\nCheck your phone number in your Wolfman account settings at wolfman.app/account"
    )
    return
  }

  await db.update(users)
    .set({ telegramChatId: String(chatId), phoneVerified: true })
    .where(eq(users.id, matchedUser.id))

  await sendMessage(
    chatId,
    `You're linked, ${matchedUser.name ?? 'friend'}! I'll send your morning check-ins here.\n\nTap /menu to get started.`
  )
}
