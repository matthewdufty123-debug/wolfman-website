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
- Auth adapter: `@auth/drizzle-adapter` with explicit table references
- Tables:
  - `users` — id, email, passwordHash, name, displayName, bio, image, avatar, role
  - `accounts`, `sessions`, `verificationTokens` — Auth.js adapter tables
  - `orders`, `orderItems` — Stripe/Printful e-commerce
  - `posts` — blog posts (DB-backed; the `posts/` markdown directory is empty and unused)
  - `morning_state` — brain/body/happy scales (1–6) + routine checklist (JSONB)
  - `evening_reflection` — end-of-day reflection text, wentToPlan flag, dayRating (1–6)
  - `day_scores` — Claude's Take synthesis: scores (JSONB), synthesis text, model, dataCompleteness

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
- **Claude's Take** — auto-generates a day synthesis (scores + narrative) when an evening reflection is saved. Scores stored as flexible JSONB so the model can evolve without schema changes. API route: `/api/admin/claude-take`
- **SEO meta generation** — planned for post pages (see open issues)
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

Posts are stored in the Neon `posts` table (DB-backed, not markdown files).
Each post can have an associated `morning_state`, `evening_reflection`, and `day_scores` record.

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

### Morning Data & Stats
- **Morning State** — captured at publish time: brain scale, body scale, happy scale (all 1–6), plus routine checklist (10 rituals: sunlight, breathwork, cacao, meditation, cold shower, walk, animal love, caffeine, yoga, workout)
- **Evening Reflection** — logged at end of day: reflection text, wentToPlan, dayRating (1–6)
- **Claude's Take** — auto-generated synthesis after evening reflection is saved
- **Morning Stats page** (`/morning-stats`) — charts and scatter plots across all posts
- **Morning Ritual pages** (`/morning-ritual`, `/morning-ritual/[key]`) — filter posts by ritual

### Home Page
- Minimal. Almost empty.
- A beautiful script font displays: "Hello, I'm Matthew Wolfman"
- Nothing else above the fold
- Below: gentle navigation to Blog, About, Shop

### About
- Matthew's story — who he is, how he lives, what Wolfman means
- Warm, personal, honest
- Not yet built — open issues #47–#50

### Talk Data (stub)
- `/talk-data` — placeholder page, Milestone 11
- Full data engineering showcase planned: Power BI embeds, Databricks notebooks, interactive visualisations

### Shop
- Photography canvases and prints — Matthew's own photography
- Wellbeing themed clothing
- Print-on-demand via Printful (API integrated — products managed in Printful dashboard)
- Stripe for payments (test mode until products are live)
- Cart persists to localStorage across page refreshes
- Guest checkout supported — no account required to purchase

### Auth & Account Pages
- `/login`, `/register` — public auth pages
- `/account` — user profile (name, display name, bio, avatar, password)
- `/settings` — user settings

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
  (main)/                   — public-facing pages
    about/                  — About page (stub)
    account/                — User profile
    admin/                  — Admin tools
      publish/              — Publish new post
    cart/                   — Shopping cart
    checkout/               — Stripe checkout + success
    intentions/             — Intentions archive
    login/                  — Login page
    morning-ritual/         — Ritual overview + [key] filter page
    morning-stats/          — Stats dashboard (charts, scatter)
    register/               — Register page
    settings/               — User settings
    shop/                   — Shop listing + [id] product page
    talk-data/              — Talk Data stub (Milestone 11)
  (post)/                   — Separate route group for sacred reading experience
    posts/[slug]/           — Individual blog post page (no chrome)
  api/
    admin/
      claude-take/          — Generate Claude's Take for a post
      evening-reflection/   — Save/update evening reflection
      github-token/         — GitHub token helper
      posts/                — Post CRUD + [id]
      seo/                  — SEO meta generation
      upload/               — Vercel Blob upload (admin only, 10MB)
    auth/[...nextauth]/     — Auth.js handler
    checkout/               — Stripe checkout session creation
    morning-stats/          — Morning stats data API
    webhooks/stripe/        — Stripe webhook handler
  layout.tsx                — Root layout with CartProvider

components/                 — Shared React components
  AccountNameForm.tsx       — Profile name editing
  AccountPasswordForm.tsx   — Password change form
  AddToCartButton.tsx       — Shop add-to-cart
  AuthForm.tsx / AuthProvider.tsx
  DayScoreScatter.tsx       — Scatter chart for day scores
  DevOverlay.tsx / DevPageClient.tsx
  EveningReflection.tsx     — Evening reflection form + display
  FontFamilyButtons.tsx / FontSizeButtons.tsx — Reader font controls
  MorningRitualIconBar.tsx  — Ritual icons on post page
  MorningScaleBar.tsx       — Brain/body/happy scale display
  NavBar.tsx                — Site navigation
  PostFooter.tsx            — "You have been reading..." + wolf logo
  RoutineIcons.tsx          — Morning routine icon set
  ShareButton.tsx           — Post sharing
  StatsCharts.tsx           — Charts for morning stats page
  ThemeButtons.tsx / ThemeProvider.tsx — Reader theme controls
  WolfLogo.tsx              — Animated wolf logo

lib/
  db/                       — Drizzle schema and database client
  actions/                  — Next.js server actions (auth, account, oauth)
  posts.ts                  — Post fetching/parsing utilities
  printful.ts               — Printful API client
  email.ts                  — Resend email helpers
  cart.tsx                  — Cart context and localStorage logic

posts/                      — Empty directory (posts are DB-backed, not markdown)
public/
  images/                   — Static site images (logos, icons)
auth.ts                     — Auth.js full config (providers, adapter, callbacks)
auth.config.ts              — Edge-compatible auth config (used by middleware)
middleware.ts               — Route protection
drizzle.config.ts           — Drizzle Kit config
```

---

## Development Log

GitHub Issues is the single source of truth for all planned and in-progress work.
- **Repo:** `https://github.com/matthewdufty123-debug/wolfman-website/issues`
- **Project board:** `https://github.com/users/matthewdufty123-debug/projects/2` — "Wolfman — Public Roadmap"

> `data/dev-log.json` and `data/future-dev.json` are **deprecated**. They are kept for
> historical reference only and must not be used for planning or session tracking.

### Three-Phase Roadmap

All work is organised into three phases, each subdivided into stages. Issues carry a stage label
(e.g. `P1S1`) and are assigned to the corresponding milestone.

**Milestones:**
- `Phase 1 — Public Alpha` (GitHub milestone #13) — closed alpha, Matthew + small test group
- `Phase 2 — Public Beta` (GitHub milestone #12) — open registration, up to 51 users, closes 1 June 2026
- `Phase 3 — Production Release` (GitHub milestone #14) — full public launch

**Stage map:**

| Stage | Name | Key issues |
|-------|------|------------|
| P1S1 | Cleanup & Housekeeping | #98, #99 |
| P1S2 | Core UX & Navigation | #44, #83, #64 |
| P1S3 | Post Creation for All Users | #80, #84, #85, #81 |
| P1S4 | User Profile & Settings | #68, #86, #82 |
| P1S5 | About & SEO | #47, #48, #49, #50, #45, #46 |
| P2S1 | Beta Infrastructure | #87, #96, #97, #88 |
| P2S2 | Scoring System & Terminology | #100 |
| P2S3 | Notifications | #91, #89, #90 |
| P2S4 | Admin Panel | #92, #93, #94, #95 |
| P2S5 | Rewards System | #101 |
| P3S1 | Public Content & Sharing | (new issues when ready) |
| P3S2 | Talk Data | (re-raise as fresh issues) |
| P3S3 | Shop & Commerce | (new issues when ready) |
| P3S4 | Completion | (anything remaining) |

**Current phase: P1 — Public Alpha.** Work through stages P1S1 → P1S5 in order.
Within a stage, pick issues in the order listed above unless dependencies or Matthew's direction say otherwise.

### Session startup — do this every time before any work begins

1. Run `git log --oneline -10` to see the last 10 commits.
2. Fetch open issues via the GitHub API using the PAT in `.env.local` (`GITHUB_TOKEN`):
   `https://api.github.com/repos/matthewdufty123-debug/wolfman-website/issues?state=open&per_page=100`
3. Check for any `in-progress` labelled issues — these were left mid-session and jump the queue.
4. Identify the current stage (lowest P#S# with open issues). Propose the next issue to work on.
5. Summarise: recent commits, anything in-flight, suggested next issue. Let Matthew confirm before starting.

### Session workflow

1. Once an issue is agreed, apply the `in-progress` label via the GitHub API.
2. Use the issue's description as the brief — generate a plan and confirm with Matthew before implementing.
3. On completion, reference the issue in the commit message: `closes #N` — this auto-closes the issue on push.
4. If new work surfaces, create a new GitHub Issue with the appropriate milestone, stage label, and `planned` label.

**Label conventions:**
| Label | Colour | Meaning |
|-------|--------|---------|
| `planned` | Blue `#4A7FA5` | Identified, not yet started |
| `in-progress` | Yellow `#C8B020` | Actively being worked on |
| `bug` | Red `#d73a4a` | Something broken |
| `enhancement` | Green `#a2eeef` | New feature or improvement |
| `P1S1`–`P3S4` | Phase colour | Stage assignment (Blue=Alpha, Yellow=Beta, Grey=Production) |

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

---

## Wolfman Public Beta — Vision & Approach
*Added March 2026*

### What this site is now

wolfman.blog is a public beta for a mindful morning journalling app. Registered users log their daily morning routine (intentions, mood scales, rituals, evening reflections) and receive Claude's Take — an AI synthesis of their entry. Data accumulates over time enabling personal habit tracking. The author's public blog continues as a separate feed visible to all.

### Beta parameters

- **End date:** 1 June 2026 (hard close — countdown visible on feedback form)
- **User cap:** 51 users maximum including admin (registration auto-closes at cap)
- **Registration:** Open or invite-only — TBD before launch
- **Target users:** 20–50 concurrent beta testers

### What happens at close

- **Successful beta:** Site continues, user data migrates to full app, users carry on seamlessly
- **Unsuccessful beta:** Users notified immediately, 30-day grace period to download all data, hard deletion after 30 days

### Architecture decisions for beta

- User data is **private by default** — each user sees only their own posts
- **Drafts** saved to database against user account, accessible across devices
- **Settings** (theme, font size, font family) persisted to database, not localStorage
- **Reminders** delivered by email via Resend, triggered by Vercel cron (every 15 min), morning entry only, not sent if user has already posted that day. User sets their own time + timezone.
- **Admin notifications** via Resend — instant alerts for registrations, first posts, feedback, account deletions, Claude's Take failures; daily digest for posts and errors; weekly for inactive users
- **Beta feedback** submitted to GitHub Issues API with label `beta-feedback`
- **User cap enforcement** at 51 users — registration route returns closed state at cap

### Deferred to post-beta v2

- Public sharing toggle on posts
- Public feed browsable by anyone
- Public stats page
- Shop section in admin panel
- Paid membership tiers

### Paid membership — abandoned

The paid membership model (Stripe subscriptions, paywalled content, member portal) was fully scoped in Milestone 5 but has been abandoned for the beta. Issues #27–#32 and #37 have been closed as superseded. Do not reintroduce membership concepts without explicit instruction.