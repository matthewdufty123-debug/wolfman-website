import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
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
                We&rsquo;ve noted your interest in the wolfman.blog public beta. When registration opens on
                <strong>1 May 2026</strong>, you&rsquo;ll be one of the first to hear about it.
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                wolfman.blog is a mindful morning journaling app &mdash; a place to set daily intentions,
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
              <a href="https://wolfman.blog" style="display: inline-block; margin-bottom: 16px;">
                <img src="https://wolfman.blog/images/wolfman-icon.png" alt="Wolfman" width="48" height="48" style="border-radius: 50%;" />
              </a>
              <p style="margin: 0; font-size: 13px; color: #909090; line-height: 1.6;">
                Wolfman &mdash; mindful living, made with care.<br>
                <a href="https://wolfman.blog" style="color: #A0622A; text-decoration: none;">wolfman.blog</a>
              </p>
              <p style="margin: 12px 0 0; font-size: 12px; color: #b0b0b0; line-height: 1.5;">
                You registered your interest via wolfman.blog. We&rsquo;ll only contact you
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
    from: 'Wolfman <orders@wolfman.blog>',
    to: email,
    subject: "You're on the list — wolfman.blog public beta",
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
    from: 'Wolfman <orders@wolfman.blog>',
    to: process.env.ADMIN_NOTIFY_EMAIL ?? 'matthew@wolfman.blog',
    subject: `Beta interest: ${name} <${email}>`,
    html,
  })
}
