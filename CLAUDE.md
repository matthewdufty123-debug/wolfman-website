# CLAUDE.md — Wolfman Website Project

## Who is Wolfman?

Wolfman is a mindful living brand built on outward truth and inner 
honesty. Through mindfulness, self-exploration, and gratitude, Wolfman 
shows that life's smallest moments can become its greatest joys. 
Purpose is found in the doing. Joy is meant to be shared.

The Wolfman brand is the personal expression of Matthew Wolfman — 
a data engineer, mountain biker, photographer, wood carver, and 
mindful human being based in the UK. Everything on this site is 
authentic, personal, and real.

---

## The Website

**Domain:** wolfman.blog
**Deployment:** Git → GitHub → Vercel (auto-deploys on push)
**Local folder:** D:\Websites\Wolfman.blog

### Tech Stack

**Framework:** Next.js 15 (App Router) with TypeScript
**Styling:** Tailwind CSS
**Authentication:** Auth.js v5 (next-auth@beta) — JWT sessions
- Providers: Email/password (bcrypt), GitHub OAuth, Google OAuth
- GitHub login auto-assigns admin role for `matthewdufty123-debug`
- Route protection via middleware (edge-compatible auth.config.ts)

**Database:** Neon PostgreSQL (serverless)
- ORM: Drizzle ORM with `@neondatabase/serverless` HTTP driver
- Schema managed via `drizzle-kit` — deploy changes with `npm run db:push`
- Tables: users, accounts, sessions, verificationTokens, orders, orderItems
- Auth adapter: `@auth/drizzle-adapter` with explicit table references

**Image Storage:** Vercel Blob
- All site images, blog post images, and product images stored here
- Upload via protected admin API route (`/api/admin/upload`) — admin only, 10MB limit
- Public URLs used directly in Next.js `<Image>` components
- Never commit large images to the git repo — always upload to Blob

**E-commerce:** Stripe
- Checkout sessions with shipping collection enabled
- Webhook handler at `/api/webhooks/stripe` — saves orders to Neon, triggers fulfilment
- Duplicate prevention via `stripePaymentIntentId` uniqueness check
- Test keys in `.env.local`, production keys in Vercel environment variables

**Print-on-demand:** Printful API
- Product catalogue fetched server-side with 1hr cache
- Orders auto-submitted to Printful on successful Stripe payment
- Fulfilment failure is non-fatal — order is recorded, can be retried manually

**Email:** Resend
- Custom domain: `orders@wolfman.blog` (DKIM/SPF/DMARC verified via Porkbun DNS)
- Order confirmation emails sent automatically on successful checkout
- Lazy-initialised (`function getResend()`) to avoid build-time env var errors

**AI:** Anthropic API (Claude)
- Used for Claude-powered features (e.g. SEO meta generation — issue #59)
- Key stored as `ANTHROPIC_API_KEY` in Vercel env and `.env.local`

**OAuth Apps:**
- GitHub: two apps — dev (localhost:3000) and production (wolfman.blog)
- Google: single app with both localhost and wolfman.blog redirect URIs

**Environment:**
- Local vars: `.env.local` (pulled via `vercel env pull .env.local`)
- Production vars: set in Vercel dashboard — source of truth for production
- Never commit `.env.local` to git

---

## Site Structure

### Blog — Morning Intentions
The heart of the site. Matthew writes a daily morning intention post 
and shares it here first, then links to it from LinkedIn, Facebook, 
and Instagram.

Each post has three sections:
- **Today's Intention** — a story, observation or reflection that 
leads to a lesson or intention for the day
- **I'm Grateful For** — something specific, vivid and personal. 
Could be a Honda engine, a walk, a moment. Never generic.
- **Something I'm Great At** — a strength, owned with confidence 
and without apology

**Reading experience — this is critical:**
- When a post opens, the reader sees NOTHING but the text
- No navigation, no header, no logo, no clutter
- Pure text, like opening a book
- At the very bottom, AFTER the text: "You have been reading... 
[post title]"
- Below that: the animated Wolfman wolf logo — gently pulsing, 
inviting a click
- Clicking the logo returns the reader to the home page
- This experience is sacred. Never compromise it.

### Home Page
- Minimal. Almost empty.
- A beautiful script font displays: "Hello, I'm Matthew Wolfman"
- Nothing else above the fold
- Below: gentle navigation to Blog, About, Shop

### About
- Matthew's story — who he is, how he lives, what Wolfman means
- Warm, personal, honest

### Shop
- Photography canvases and prints — Matthew's own photography
- Wellbeing themed clothing
- Print-on-demand via Printful (API integrated — products managed in Printful dashboard)
- Stripe for payments (test mode until products are live)
- Cart persists to localStorage across page refreshes
- Guest checkout supported — no account required to purchase

---

## Brand & Design

### Primary Palette (from the logo)
- **Steel Blue:** `#4A7FA5` — navigation, structural elements
- **Copper/Bronze:** `#A0622A` — accents, highlights
- **Charcoal:** `#4A4A4A` — body text, dark backgrounds
- **White:** `#FFFFFF` — reading backgrounds, reversed text
- **Black:** `#000000` — wolf illustration, strong contrast moments

### Statement / CTA Colour
- **Deep Navy:** `#214459` — primary call-to-action buttons and high-impact actions only
  - Always paired with **white text**
  - Use sparingly — reserve for the most important action on a page
  - This colour commands attention; don't dilute it by overusing it

### Extended Palette (supporting / accent use)
- **Emerald Green:** `#3AB87A`
- **Royal Blue:** `#2A6AB0`
- **Mustard/Gold:** `#C8B020`
- **Cornflower Blue:** `#6090C0`
- **Crimson Red:** `#A82020`
- **Teal:** `#70C0C8`
- **Powder Blue:** `#A8D0E0`
- **Mid Grey:** `#909090`
- **Copper/Terracotta:** `#C87840`

### Logo
- The Wolfman wolf mark — a howling wolf across three panels 
(blue, copper, grey)
- Used as a round icon at the bottom of blog posts
- Should animate gently — a pulse or subtle glow — to invite 
interaction
- Never cluttered around. Give it space.

### Typography
- **Headings / Hero:** Script or serif font — warm, human, personal
- **Body / Blog text:** Clean, highly readable serif — like reading 
a book. Generous line height. Comfortable margins.
- **Navigation:** Minimal sans-serif — understated, never dominant

### Design Principles
- Minimalism above everything
- Photography and words are the heroes — never compete with them
- White space is not empty — it is intentional
- Every element must earn its place on the page
- Never add UI chrome that distracts from the reading experience
- Mobile first — the morning posts will be read on phones

---

## Tone of Voice

Matthew's writing voice is:
- **Honest** — he examines himself without flinching
- **Warm** — never cold or corporate
- **Self-aware** — finds humour in his own contradictions
- **Philosophical** — goes deep, but always comes back to 
something real and practical
- **Energetic** — ends with forward momentum, never defeat
- **Never preachy** — shares experience, never lectures

When writing any copy for this site — navigation labels, 
button text, error messages, about page, product descriptions — 
always match this voice. Nothing generic. Nothing corporate.

---

## Content Guidelines

- Blog posts are written by Matthew and pasted in — never 
AI-generated
- Product descriptions should feel like Matthew wrote them
- Image alt text should be descriptive and warm, not mechanical
- SEO matters but never at the expense of the reading experience

---

## Technical Rules

- **Git workflow:** add → commit locally. Do NOT push to GitHub unless Matthew explicitly asks.
- When Matthew says "push" or "push to main" (or similar), then push. Not before.
- Commit messages should be descriptive and human
- **Closing issues:** include `closes #N` in the commit message to auto-close the GitHub issue
- Never break the mobile reading experience
- **Images:** never commit large images to git — upload to Vercel Blob via the admin upload tool, use the returned URL in code
- **Schema changes:** run `npm run db:push` after editing `lib/db/schema.ts` to apply changes to Neon

### Next.js App Router folder structure
```
app/
  (main)/           — public-facing pages (blog, shop, account, admin)
  api/              — API routes (auth, checkout, webhooks, upload)
  layout.tsx        — root layout with CartProvider
components/         — shared React components
lib/
  db/               — Drizzle schema and database client
  actions/          — Next.js server actions (auth, account, oauth)
  printful.ts       — Printful API client
  email.ts          — Resend email helpers
  cart.tsx          — Cart context and localStorage logic
posts/              — Markdown blog post files (.md)
public/
  images/           — static site images (logos, icons)
auth.ts             — Auth.js full config (providers, adapter, callbacks)
auth.config.ts      — Edge-compatible auth config (used by middleware)
middleware.ts       — Route protection
drizzle.config.ts   — Drizzle Kit config
```

---

## Development Log

GitHub Issues is the single source of truth for all planned and in-progress work.
- **Repo:** `https://github.com/matthewdufty123-debug/wolfman-website/issues`
- **Labels:** `planned` (blue), `in-progress` (yellow), `bug` (red), `enhancement` (green)
- **Milestone labels:** `Milestone-1` through `Milestone-11` (grey) — group issues by release

> `data/dev-log.json` and `data/future-dev.json` are **deprecated**. They are kept for
> historical reference only and must not be used for planning or session tracking.

**Session startup — do this every time before any work begins:**
1. Run `git log --oneline -10` to see the last 10 commits.
2. Fetch open issues from the GitHub API:
   `https://api.github.com/repos/matthewdufty123-debug/wolfman-website/issues?state=open`
3. Check for any `in-progress` labelled issues first — these were left mid-session and jump the queue.
4. Then review all `planned` issues — consider dependencies and milestone grouping, and discuss the best order with Matthew before picking one.
5. Summarise what you found: recent commits, anything in-flight, and a suggested next priority. Let Matthew confirm before starting.

**Session workflow (Issues-driven planning):**
1. Once an issue is agreed, apply the `in-progress` label to it (note it in conversation — label changes require the GitHub API or UI).
2. Use the issue's description as the brief — generate a plan and confirm with Matthew before implementing.
3. On completion, reference the issue in the commit message: `closes #N` — this auto-closes the issue on push.
4. If new work surfaces during a session, create a new GitHub Issue with appropriate labels and milestone so it doesn't get lost.

**Label conventions:**
| Label | Colour | Meaning |
|-------|--------|---------|
| `planned` | Blue `#4A7FA5` | Identified, not yet started |
| `in-progress` | Yellow `#C8B020` | Actively being worked on |
| `bug` | Red `#d73a4a` | Something broken |
| `enhancement` | Green `#a2eeef` | New feature or improvement |
| `Milestone-1` … `Milestone-11` | Grey `#bfd4f2` | Milestone grouping |

---

## What Wolfman is NOT

- Not corporate
- Not cluttered
- Not generic
- Not preachy
- Not trying to be everything to everyone
- Not compromising the reading experience for any reason

---

## The Vision

A reader finds a Wolfman post on LinkedIn during their lunch break. 
They click the link. The words fill their screen. They read. They 
feel something. They finish. They see "You have been reading..." 
They smile. They click the wolf. They arrive at "Hello, I'm Matthew 
Wolfman." They want to know more. They find the shop. They buy a 
canvas that reminds them of how they felt reading that post.

That is the Wolfman journey. Every decision we make should serve it.