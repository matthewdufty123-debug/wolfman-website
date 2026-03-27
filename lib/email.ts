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
              <p style="margin: 6px 0 0; font-size: 13px; color: rgba(229,203,187,0.4); letter-spacing: 0.06em;">wolfman.blog</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #f0ebe6; text-align: center;">
              <a href="https://wolfman.blog" style="display: inline-block; margin-bottom: 16px;">
                <img src="https://wolfman.blog/images/wolfman-icon.png" alt="Wolfman" width="48" height="48" style="border-radius: 50%;" />
              </a>
              <p style="margin: 0; font-size: 13px; color: #909090; line-height: 1.6;">
                Wolfman &mdash; mindful living, made with care.<br>
                <a href="https://wolfman.blog" style="color: #A0622A; text-decoration: none;">wolfman.blog</a>
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

// ── Beta interest emails ───────────────────────────────────────────────────

interface BetaConfirmationParams {
  to: string
  name: string | null
}

export async function sendBetaInterestConfirmation({ to, name }: BetaConfirmationParams) {
  const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,'

  const html = emailWrapper(`
    ${h1('You\'re on the list.')}
    ${p(`${greeting}`)}
    ${p('Thank you for signing up to be a beta tester for wolfman.blog. It means a lot — genuinely.')}
    ${p('Here\'s what we\'re building together: a simple, honest space for morning journalling. You\'ll log your daily intentions, your mood, your morning rituals — and over time, a picture of your inner life starts to form. No noise. No feed. Just you and the page.')}
    ${p('As part of the beta you\'ll also get access to <strong>WOLF|BOT</strong> — an AI journalling companion that reads your entries and reflects something back. Not generic advice. Something specific to your morning.')}
    ${p('Your data is private. Only you can see your journals. The beta runs until <strong>31 August 2026</strong>. If it continues, your data carries over seamlessly. If it ends, you\'ll get 30 days\' notice and a way to download everything you\'ve written.')}
    ${p('You\'ll hear from me again <strong>one week before the beta opens</strong> with the exact go-live date. Then again on the day itself with a link to register.')}
    ${p('That\'s it for now. I\'m glad you\'re here.<br><br>— Matthew')}
  `)

  await getResend().emails.send({
    from: 'Matthew at Wolfman <orders@wolfman.blog>',
    to,
    subject: 'You\'re on the list — wolfman.blog beta',
    html,
  })
}

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
        ${p(`The wolfman.blog beta opens in one week — on <strong>${dateStr}</strong>.`)}
        ${p('You signed up to be one of the first testers. That spot is still yours. On launch day you\'ll receive a direct link to register and get started.')}
        ${p('In the meantime, if you have any questions just hit reply — I read everything.<br><br>— Matthew')}
        ${cta('Learn more about the beta', 'https://wolfman.blog/beta')}
      `)
      return getResend().emails.send({
        from: 'Matthew at Wolfman <orders@wolfman.blog>',
        to: email,
        subject: 'One week until the wolfman.blog beta opens',
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
        ${p('The wolfman.blog beta is open. You\'re in.')}
        ${p('Head over and create your account. Your first journal is waiting.<br><br>— Matthew')}
        ${cta('Register now', 'https://wolfman.blog/register')}
      `)
      return getResend().emails.send({
        from: 'Matthew at Wolfman <orders@wolfman.blog>',
        to: email,
        subject: 'The wolfman.blog beta is live — register now',
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
              <a href="https://wolfman.blog" style="display: inline-block; margin-bottom: 16px;">
                <img src="https://wolfman.blog/images/wolfman-icon.png" alt="Wolfman" width="48" height="48" style="border-radius: 50%;" />
              </a>
              <p style="margin: 0; font-size: 13px; color: #909090; line-height: 1.6;">
                Wolfman &mdash; mindful living, made with care.<br>
                <a href="https://wolfman.blog" style="color: #A0622A; text-decoration: none;">wolfman.blog</a>
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
    from: 'Wolfman <orders@wolfman.blog>',
    to,
    subject: 'Your Wolfman order is confirmed',
    html,
  })
}
