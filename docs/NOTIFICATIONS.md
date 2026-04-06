# Email & Notifications — Wolfman.blog

All email is sent via **Resend**. All functions live in `lib/email.ts`.

**Custom domain:** `orders@wolfman.blog` (DKIM/SPF/DMARC verified via Porkbun DNS)
**Env var:** `RESEND_API_KEY`
**Lazy-initialised:** `getResend()` function — avoids build-time env var errors. Never call
`new Resend()` directly outside of this function.

---

## Admin Notifications

Instant alerts sent to `ADMIN_NOTIFY_EMAIL` env var (falls back to `matthew@wolfman.blog`).
All are **fire-and-forget** — called with `.catch(() => {})`. Never await them in a request path.

| Function | Trigger | What it sends |
|----------|---------|--------------|
| `notifyAdminNewRegistration(username, email, userCount, userCap)` | New user registers | Username, email, current user count vs cap |
| `notifyAdminFeedbackSubmitted(category, messagePreview, anonymous, pageUrl)` | /feedback submitted | Category, message preview, anon flag, page |
| `notifyAdminFirstPost(username, postTitle, postUrl)` | User publishes first journal | Username, post title, link |
| `notifyAdminClaudesTakeFailed(userId, postId, errorMessage)` | AI generation fails | User ID, post ID, error message |

---

## User Notifications

### Morning Reminders

| Function | Purpose |
|----------|---------|
| `sendMorningReminder(to, name, unsubscribeUrl)` | "Good morning" email prompting user to write their journal |

**Delivery:**
- Opt-in per user — `users.morningReminderEnabled`
- User sets their own time (`morningReminderTime`, e.g. "07:30") and timezone (`morningReminderTimezone`)
- Cron runs every 15 minutes: `/api/cron/morning-reminder`
- Skips users who have already posted today (`lastReminderSentAt` check)
- `users.lastReminderSentAt` updated on send to prevent duplicates

**Unsubscribe:**
- One-click HMAC-signed link: `/api/user/reminders/unsubscribe`
- Requires `REMINDER_UNSUBSCRIBE_SECRET` env var
- Sets `morningReminderEnabled = false` on click

---

## Beta Emails

| Function | Purpose |
|----------|---------|
| `sendBetaWeekNotice(recipients, betaOpensAt)` | "One week until public beta opens" announcement |
| `sendBetaGoLive(recipients)` | "We're live — register now" broadcast |
| `sendBetaInterestConfirmation(email, name)` | Confirmation email to pre-registration interest |
| `sendAdminBetaInterestAlert(email, name)` | Admin alert when someone pre-registers |

**Delivery:** `/api/cron/beta-emails` — daily cron

---

## Commerce

| Function | Purpose |
|----------|---------|
| `sendOrderConfirmation(to, orderItems, totalAmount, orderId)` | Order confirmation with item table, total, and reference ID |

Sent automatically on successful Stripe payment (in the webhook handler).

---

## Email Templates

All emails use a shared brand wrapper via `emailWrapper(content)`:
- Wolfman header
- Branded footer
- Helper functions: `p(text)`, `h1(text)`, `cta(text, href)`

Admin alert emails use a simplified functional template (`adminHtml`, `adminSend`) — plain,
fast, no branding overhead.

---

## Cron Routes

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/morning-reminder` | Every 15 min | Check and send morning reminders |
| `/api/cron/beta-emails` | Daily | Beta announcement emails |

Cron jobs are configured in `vercel.json`. Do not change the schedule without testing.

---

## Environment Variables

| Var | Purpose |
|-----|---------|
| `RESEND_API_KEY` | Resend API authentication |
| `ADMIN_NOTIFY_EMAIL` | Target for admin alerts (falls back to matthew@wolfman.blog) |
| `REMINDER_UNSUBSCRIBE_SECRET` | HMAC key for unsubscribe link signing |

---

## GitHub Issues

When raising issues for email, notifications, reminders, or cron jobs, reference this file
(`docs/NOTIFICATIONS.md`) and the feature name **Notifications** in the issue.
