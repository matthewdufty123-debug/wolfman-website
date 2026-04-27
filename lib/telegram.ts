// ── Telegram Bot API types ─────────────────────────────────────────────────

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
}

export interface TelegramContact {
  phone_number: string
  first_name: string
  last_name?: string
  user_id?: number
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: { id: number; type: string }
  date: number
  text?: string
  contact?: TelegramContact
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export interface InlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
}

interface TelegramApiResponse {
  ok: boolean
  description?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any
}

// ── Internal fetch helper ──────────────────────────────────────────────────

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')
  return token
}

async function telegramApi(method: string, body?: Record<string, unknown>): Promise<TelegramApiResponse> {
  const res = await fetch(`https://api.telegram.org/bot${getBotToken()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json() as TelegramApiResponse

  if (!data.ok) {
    console.error(`[Telegram] ${method} failed:`, data.description)
  }

  return data
}

// ── Outbound messages ──────────────────────────────────────────────────────

export async function sendMessage(
  chatId: number | string,
  text: string,
  options?: { parseMode?: string }
): Promise<TelegramApiResponse> {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode,
  })
}

export async function sendMessageWithButtons(
  chatId: number | string,
  text: string,
  buttons: InlineKeyboardButton[][],
  options?: { parseMode?: string }
): Promise<TelegramApiResponse> {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode,
    reply_markup: { inline_keyboard: buttons },
  })
}

export async function sendContactRequest(
  chatId: number | string,
  text: string
): Promise<TelegramApiResponse> {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: {
      keyboard: [[{ text: '📱 Share Phone Number', request_contact: true }]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  })
}

// ── Webhook management ─────────────────────────────────────────────────────

export async function setWebhook(url: string, secretToken?: string): Promise<TelegramApiResponse> {
  return telegramApi('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
  })
}

export async function deleteWebhook(): Promise<TelegramApiResponse> {
  return telegramApi('deleteWebhook', {})
}

export async function getWebhookInfo(): Promise<TelegramApiResponse> {
  return telegramApi('getWebhookInfo')
}
