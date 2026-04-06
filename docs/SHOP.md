# Shop — Wolfman.blog

> **Placeholder** — this file will be expanded when the Shop feature goes live.

---

## Current State

- Photography canvases, prints, and wellbeing clothing
- Print-on-demand via Printful API (products managed in Printful dashboard)
- Stripe payments (test mode until products are live)
- Cart persists to localStorage across page refreshes
- Guest checkout supported — no account required
- Order confirmation emails via Resend
- Printful fulfilment triggered automatically on successful Stripe payment
- Fulfilment failure is non-fatal — order recorded, can be retried manually

## Key Technical Notes

- Stripe webhook handler: `/api/webhooks/stripe` — saves orders to Neon, triggers fulfilment
- Duplicate prevention via `stripePaymentIntentId` uniqueness check
- Product catalogue fetched server-side with 1hr cache
- Tables: `orders`, `orderItems`
- Test keys in `.env.local`, production keys in Vercel environment variables

## To Be Defined (when Shop goes live)

- Final product catalogue
- Pricing and shipping configuration in Printful
- Switch from test → production Stripe keys
- Shop-specific terms and conditions (part of Legal feature)

## GitHub Issues

When raising issues for the Shop feature, reference this file (`docs/SHOP.md`).
