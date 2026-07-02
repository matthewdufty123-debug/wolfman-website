import Stripe from 'stripe'

// Lazily constructed so importing a route doesn't require STRIPE_SECRET_KEY —
// the SDK throws at construction when the key is missing, which breaks
// `next build` page-data collection in environments without secrets.
let stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  return stripe
}
