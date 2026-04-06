import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

// ── Shared email chrome ────────────────────────────────────────────────────

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #F9F6F5; font-family: Georgia, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9F6F5; padding: 48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 4px; overflow: hidden;">
          <tr>
            <td style="background: #193343; padding: 32px 40px; text-align: center;">
              <p style="margin: 0; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(229,203,187,0.6);">Wolfman</p>
              <p style="margin: 6px 0 0; font-size: 13px; color: rgba(229,203,187,0.4); letter-spacing: 0.06em;">wolfman.app</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #f0ebe6; text-align: center;">
              <a href="https://wolfman.app" style="display: inline-block; margin-bottom: 16px;">
                <img src="https://wolfman.app/images/wolfman-icon.png" alt="Wolfman" width="48" height="48" style="border-radius: 50%;" />
              </a>
              <p style="margin: 0; font-size: 13px; color: #909090; line-height: 1.6;">
                Wolfman &mdash; mindful living, made with care.<br>
                <a href="https://wolfman.app" style="color: #A0622A; text-decoration: none;">wolfman.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function p(text: string) {
  return `<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.8; color: #4A4A4A;">${text}</p>`
}

function h1(text: string) {
  return `<h1 style="margin: 0 0 28px; font-size: 26px; font-weight: 400; color: #193343; line-height: 1.3;">${text}</h1>`
}

function cta(text: string, href: string) {
  return `<p style="margin: 28px 0 0; text-align: center;">
    <a href="${href}" style="display: inline-block; background: #214459; color: #ffffff; font-family: Georgia, serif; font-size: 15px; padding: 14px 32px; border-radius: 3px; text-decoration: none; letter-spacing: 0.04em;">${text}</a>
  </p>`
}

// ── Beta broadcast emails (week notice + go-live) ─────────────────────────

interface BetaBroadcastParams {
  recipients: { email: string; name: string | null }[]
}

export async function sendBetaWeekNotice({ recipients, betaOpensAt }: BetaBroadcastParams & { betaOpensAt: Date }) {
  const dateStr = betaOpensAt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  await Promise.allSettled(
    recipients.map(({ email, name }) => {
      const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,'
      const html = emailWrapper(`
        ${h1('One week to go.')}
        ${p(greeting)}
        ${p(`The wolfman.app beta opens in one week — on <strong>${dateStr}</strong>.`)}
        ${p('You signed up to be one of the first testers. That spot is still yours. On launch day you\'ll receive a direct link to register and get started.')}
        ${p('In the meantime, if you have any questions just hit reply — I read everything.<br><br>— Matthew')}
        ${cta('Learn more about the beta', 'https://wolfman.app/beta')}
      `)
      return getResend().emails.send({
        from: 'Matthew at Wolfman <orders@wolfman.app>',
        to: email,
        subject: 'One week until the wolfman.app beta opens',
        html,
      })
    })
  )
}

export async function sendBetaGoLive({ recipients }: BetaBroadcastParams) {
  await Promise.allSettled(
    recipients.map(({ email, name }) => {
      const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,'
      const html = emailWrapper(`
        ${h1('We\'re live.')}
        ${p(greeting)}
        ${p('The wolfman.app beta is open. You\'re in.')}
        ${p('Head over and create your account. Your first journal is waiting.<br><br>— Matthew')}
        ${cta('Register now', 'https://wolfman.app/register')}
      `)
      return getResend().emails.send({
        from: 'Matthew at Wolfman <orders@wolfman.app>',
        to: email,
        subject: 'The wolfman.app beta is live — register now',
        html,
      })
    })
  )
}

interface OrderItem {
  productName: string
  variantName: string
  quantity: number
  unitPrice: number
}

interface SendOrderConfirmationParams {
  to: string
  orderItems: OrderItem[]
  totalAmount: number
  orderId: string
}

export async function sendOrderConfirmation({
  to,
  orderItems,
  totalAmount,
  orderId,
}: SendOrderConfirmationParams) {
  const itemRows = orderItems.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0ebe6; color: #4A4A4A; font-size: 15px;">${item.productName}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0ebe6; color: #909090; font-size: 14px;">${item.variantName}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0ebe6; color: #4A4A4A; font-size: 15px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0ebe6; color: #A0622A; font-size: 15px; text-align: right;">£${(item.unitPrice / 100).toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #F9F6F5; font-family: Georgia, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9F6F5; padding: 48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 4px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: #193343; padding: 32px 40px; text-align: center;">
              <p style="margin: 0; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(229,203,187,0.6);">Wolfman</p>
              <h1 style="margin: 8px 0 0; font-size: 28px; font-weight: 400; color: #E5CBBB;">Order confirmed.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                Thank you for your order. Everything is being prepared and will be with you soon.
              </p>

              <!-- Order items -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <thead>
                  <tr>
                    <th style="text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #A0622A; padding-bottom: 8px; border-bottom: 2px solid #f0ebe6;">Item</th>
                    <th style="text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #A0622A; padding-bottom: 8px; border-bottom: 2px solid #f0ebe6;">Option</th>
                    <th style="text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #A0622A; padding-bottom: 8px; border-bottom: 2px solid #f0ebe6;">Qty</th>
                    <th style="text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #A0622A; padding-bottom: 8px; border-bottom: 2px solid #f0ebe6;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="font-size: 16px; color: #4A4A4A;">Total</td>
                  <td style="font-size: 18px; color: #193343; font-weight: 700; text-align: right;">£${(totalAmount / 100).toFixed(2)}</td>
                </tr>
              </table>

              <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7; color: #909090;">
                Your order reference is <span style="font-family: monospace; color: #4A4A4A;">${orderId.slice(0, 8).toUpperCase()}</span>.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #909090;">
                You'll receive a shipping notification once your order is on its way.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #f0ebe6; text-align: center;">
              <a href="https://wolfman.app" style="display: inline-block; margin-bottom: 16px;">
                <img src="https://wolfman.app/images/wolfman-icon.png" alt="Wolfman" width="48" height="48" style="border-radius: 50%;" />
              </a>
              <p style="margin: 0; font-size: 13px; color: #909090; line-height: 1.6;">
                Wolfman &mdash; mindful living, made with care.<br>
                <a href="https://wolfman.app" style="color: #A0622A; text-decoration: none;">wolfman.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await getResend().emails.send({
    from: 'Wolfman <orders@wolfman.app>',
    to,
    subject: 'Your Wolfman order is confirmed',
    html,
  })
}

export async function sendBetaInterestConfirmation(email: string, name: string) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #F9F6F5; font-family: Georgia, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9F6F5; padding: 48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 4px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: #193343; padding: 32px 40px; text-align: center;">
              <p style="margin: 0; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(229,203,187,0.6);">Wolfman</p>
              <h1 style="margin: 8px 0 0; font-size: 28px; font-weight: 400; color: #E5CBBB;">You&rsquo;re on the list.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                Hi ${name},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                We&rsquo;ve noted your interest in the wolfman.app public beta. When registration opens on
                <strong>1 May 2026</strong>, you&rsquo;ll be one of the first to hear about it.
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                wolfman.app is a mindful morning journaling app &mdash; a place to set daily intentions,
                track your morning rituals, and watch honest patterns emerge over time.
              </p>
              <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                See you on the other side.<br><br>
                &mdash; Matthew
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #f0ebe6; text-align: center;">
              <a href="https://wolfman.app" style="display: inline-block; margin-bottom: 16px;">
                <img src="https://wolfman.app/images/wolfman-icon.png" alt="Wolfman" width="48" height="48" style="border-radius: 50%;" />
              </a>
              <p style="margin: 0; font-size: 13px; color: #909090; line-height: 1.6;">
                Wolfman &mdash; mindful living, made with care.<br>
                <a href="https://wolfman.app" style="color: #A0622A; text-decoration: none;">wolfman.app</a>
              </p>
              <p style="margin: 12px 0 0; font-size: 12px; color: #b0b0b0; line-height: 1.5;">
                You registered your interest via wolfman.app. We&rsquo;ll only contact you
                once &mdash; when the beta opens. No spam, no marketing.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await getResend().emails.send({
    from: 'Wolfman <orders@wolfman.app>',
    to: email,
    subject: "You're on the list — wolfman.app public beta",
    html,
  })
}

export async function sendAdminBetaInterestAlert(email: string, name: string) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 24px; background: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #333;">
  <p style="margin: 0 0 16px;"><strong>New beta interest registration</strong></p>
  <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
    <tr>
      <td style="padding: 6px 16px 6px 0; color: #909090; font-size: 13px;">Name</td>
      <td style="padding: 6px 0; font-size: 13px;">${name}</td>
    </tr>
    <tr>
      <td style="padding: 6px 16px 6px 0; color: #909090; font-size: 13px;">Email</td>
      <td style="padding: 6px 0; font-size: 13px;">${email}</td>
    </tr>
    <tr>
      <td style="padding: 6px 16px 6px 0; color: #909090; font-size: 13px;">Time</td>
      <td style="padding: 6px 0; font-size: 13px;">${new Date().toUTCString()}</td>
    </tr>
  </table>
</body>
</html>
  `

  await getResend().emails.send({
    from: 'Wolfman <orders@wolfman.app>',
    to: process.env.ADMIN_NOTIFY_EMAIL ?? 'matthew@wolfman.app',
    subject: `Beta interest: ${name} <${email}>`,
    html,
  })
}

// ── Admin instant alerts ─────────────────────────────────────────────────────
// Clean functional template — not brand tone. Fast, scannable, server-only.

function adminHtml(heading: string, rows: Array<[string, string]>): string {
  const tableRows = rows
    .map(([label, value]) =>
      `<tr>
        <td style="padding:5px 20px 5px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
        <td style="padding:5px 0;font-size:13px;color:#222;">${value}</td>
      </tr>`
    )
    .join('')
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#fff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#333;">
  <p style="margin:0 0 16px;font-size:15px;font-weight:bold;color:#193343;">${heading}</p>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${tableRows}</table>
  <p style="margin:20px 0 0;font-size:11px;color:#bbb;">wolfman.app &mdash; ${new Date().toUTCString()}</p>
</body></html>`
}

function adminSend(subject: string, html: string): Promise<void> {
  const to = process.env.ADMIN_NOTIFY_EMAIL ?? 'matthew@wolfman.app'
  return getResend().emails.send({
    from: 'Wolfman Admin <orders@wolfman.app>',
    to,
    subject,
    html,
  }).then(() => undefined)
}

export function notifyAdminNewRegistration(params: {
  username: string
  email: string
  userCount: number
  userCap: number
}): void {
  const html = adminHtml('New user registered', [
    ['Username', params.username],
    ['Email', params.email],
    ['User count', `${params.userCount} / ${params.userCap}`],
  ])
  adminSend(`New registration: ${params.username}`, html).catch(() => {})
}

export function notifyAdminFeedbackSubmitted(params: {
  category: string
  messagePreview: string
  anonymous: boolean
  pageUrl?: string | null
}): void {
  const rows: Array<[string, string]> = [
    ['Category', params.category],
    ['Message', params.messagePreview],
    ['Anonymous', params.anonymous ? 'Yes' : 'No'],
  ]
  if (!params.anonymous && params.pageUrl) rows.push(['Page', params.pageUrl])
  const html = adminHtml(`Beta feedback: ${params.category}`, rows)
  adminSend(`Feedback [${params.category}]: ${params.messagePreview.slice(0, 55)}`, html).catch(() => {})
}

export function notifyAdminFirstPost(params: {
  username: string
  postTitle: string
  postUrl: string
}): void {
  const html = adminHtml('User published their first journal', [
    ['Username', params.username],
    ['Title', params.postTitle],
    ['URL', params.postUrl],
  ])
  adminSend(`First post: ${params.username} — "${params.postTitle.slice(0, 50)}"`, html).catch(() => {})
}

// ── Morning reminder ──────────────────────────────────────────────────────────

export async function sendMorningReminder(params: {
  to: string
  name: string | null
  unsubscribeUrl: string
}): Promise<void> {
  const first = params.name?.split(' ')[0] ?? 'there'
  const html = emailWrapper(`
    ${h1('Good morning.')}
    ${p(`Hi ${first},`)}
    ${p("This is your morning reminder to set your intention for today. It only takes a few minutes — and it's always worth it.")}
    ${cta('Write today\'s journal', 'https://wolfman.app/write')}
    <p style="margin: 28px 0 0; font-size: 12px; color: #b0b0b0; text-align: center; line-height: 1.6;">
      You asked for this reminder via wolfman.app settings.<br>
      <a href="${params.unsubscribeUrl}" style="color: #b0b0b0;">Turn off reminders</a>
    </p>
  `)
  await getResend().emails.send({
    from: 'Matthew at Wolfman <orders@wolfman.app>',
    to: params.to,
    subject: 'Good morning — time to set your intention',
    html,
  })
}

export function notifyAdminClaudesTakeFailed(params: {
  userId: string
  postId: string
  errorMessage: string
}): void {
  const html = adminHtml("Claude's Take generation failed", [
    ['Post ID', params.postId],
    ['User ID', params.userId],
    ['Error', params.errorMessage],
  ])
  adminSend(`Claude's Take failed — post ${params.postId.slice(0, 8)}`, html).catch(() => {})
}
