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
  - `users` — id, email, passwordHash, name, displayName, bio, image, avatar, role, username
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
- **Claude's Take** — auto-generates a day synthesis (scores + narrative). Generated at Review time via `/api/posts/[id]/review` (all users) or `/api/admin/claude-take` (admin). Updated again when evening reflection is saved. Scores stored as flexible JSONB.
- **WOLF|BOT** — the AI journalling assistant. Personality modes, multi-review storage, and journal page UI (#133). All user-facing references use **WOLF|BOT** (not "Wolfbot").
- **Review → Publish flow** — PostForm "Review" button saves draft, calls `/api/posts/[id]/review`, Claude generates: SEO excerpt (stored silently), refined title (pre-fills form), Claude's Take (scores + synthesis stored in `day_scores`). Button then flips to "Publish".
- **SEO meta generation** (admin) — `/api/admin/seo` generates excerpt + suggestedTitle + review for Matthew's posts
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

### Blog — Morning Intentions (Journals)
The heart of the site. Matthew writes a daily morning intention journal
and shares it here first, then links to it from LinkedIn, Facebook,
and Instagram. User-facing copy uses "journal" not "post" throughout.

Each journal has three sections:
- **Today's Intention** — a story, observation or reflection that
leads to a lesson or intention for the day
- **I'm Grateful For** — something specific, vivid and personal.
Could be a Honda engine, a walk, a moment. Never generic.
- **Something I'm Great At** — a strength, owned with confidence
and without apology

Journals are stored in the Neon `posts` table (DB-backed, not markdown files — the table is named `posts` internally but presented as "journals" in the UI).
Each journal can have an associated `morning_state`, `evening_reflection`, and `day_scores` record.
Canonical URL: `/[username]/[slug]`

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
- **Morning State** — captured at publish time via PostForm: brain activity scale, body energy scale, happy scale (all 1–6), plus routine checklist (10 rituals: sunlight, breathwork, cacao, meditation, cold shower, walk, animal love, caffeine, yoga, workout)
- **Evening Reflection** — logged at end of day: reflection text, wentToPlan, dayRating (1–6). Available to any post owner via PostFooter.
- **Claude's Take** — generated at Review time (post content + morning state) and optionally regenerated when evening reflection is saved. Stored in `day_scores`.
- **Stats & Profile page** (`/[username]`) — per-user charts, Morning Zone scatter, headline stats (total journals, current streak, longest streak, this month). Owner sees edit affordance; visitors see public view. `/morning-stats` and `/journal` redirect here for logged-in users, else to `/login`.
- **Morning Ritual pages** (`/morning-ritual`, `/morning-ritual/[key]`) — filter journals by ritual

### Home Page
- Two-tab **Journal Feed** (built as of #115):
  - **Community tab** (default) — Matthew's published journals with author card, title, date, excerpt, and ritual icons
  - **My Journals tab** (`?view=mine`) — logged-in user's own journals including drafts; redirects to `/login` if unauthenticated
  - Empty states for both tabs
- `/intentions` redirects here (301)
- This replaced the old "Hello, I'm Matthew Wolfman" minimal hero (#44 superseded by #115)

### About
- Matthew's story — who he is, how he lives, what Wolfman means
- Warm, personal, honest
- Not yet built — open issues #47–#50

### Shop
- Photography canvases and prints — Matthew's own photography
- Wellbeing themed clothing
- Print-on-demand via Printful (API integrated — products managed in Printful dashboard)
- Stripe for payments (test mode until products are live)
- Cart persists to localStorage across page refreshes
- Guest checkout supported — no account required to purchase

### Auth & Account Pages
- `/login`, `/register` — public auth pages (register includes beta terms summary)
- `/account` — user profile (username with live availability check, name, display name, bio, avatar, password)
- `/settings` — user settings
- `/beta` — beta information, terms, data policy, and countdown
- `/feedback` — beta feedback form (submits to GitHub Issues API)

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

- Journal entries are written by Matthew (and beta users) and pasted in — never
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
    [username]/             — Public profile page: avatar, stats, scatter, streak
      [slug]/               — Canonical journal post page (sacred reading experience, no chrome)
    about/                  — About page (stub)
    account/                — User profile (username, name, avatar, password)
    admin/                  — Admin dashboard (stats, orders, journals)
    beta/                   — Beta info, terms, data policy, countdown
    cart/                   — Shopping cart
    checkout/               — Stripe checkout + success
    feedback/               — Beta feedback form (GitHub Issues integration)
    intentions/             — 301 redirect → /
    login/                  — Login page
    morning-ritual/         — Ritual overview + [key] filter page
    morning-stats/          — Redirects logged-in users → /[username], else → /login
    journal/                — Redirects logged-in users → /[username], else → /login
    register/               — Register page (includes beta terms summary)
    settings/               — User settings (theme, font — persisted to DB)
    shop/                   — Shop listing + [id] product page
  (post)/                   — Route group for write/edit overlays
    posts/[slug]/           — Legacy URL — 301 redirects to /[username]/[slug]
    write/                  — New journal form (all authenticated users)
    edit/[id]/              — Edit journal form (post owner only)
  api/
    admin/
      claude-take/          — Generate Claude's Take (admin/Matthew's posts)
      evening-reflection/   — Save/update evening reflection (admin)
      github-token/         — GitHub token helper
      posts/                — Post CRUD + [id] (admin)
      seo/                  — SEO meta generation (admin)
      upload/               — Vercel Blob upload (admin only, 10MB)
    auth/[...nextauth]/     — Auth.js handler
    checkout/               — Stripe checkout session creation
    claude-take/            — Generate Claude's Take (post owner)
    evening-reflection/     — Save/update evening reflection (post owner)
    feedback/               — Beta feedback → GitHub Issues API
    morning-stats/          — Morning stats data API
    posts/                  — User post CRUD (authenticated users)
      [id]/                 — Individual post CRUD (owner only)
        review/             — Claude review: excerpt + title + Claude's Take
    user/
      avatar/               — Avatar upload (Vercel Blob)
      settings/             — Read/write user preferences (theme, font)
      username/             — Username availability check (GET ?u=foo)
    webhooks/stripe/        — Stripe webhook handler
  layout.tsx                — Root layout with CartProvider

components/                 — Shared React components
  AccountNameForm.tsx       — Profile name editing
  AccountPasswordForm.tsx   — Password change form
  AccountUsernameForm.tsx   — Username editing with live availability check
  AddToCartButton.tsx       — Shop add-to-cart
  AuthForm.tsx / AuthProvider.tsx
  AvatarUpload.tsx          — Avatar upload with preview
  DayScoreScatter.tsx       — Scatter chart for day scores
  DevOverlay.tsx / DevPageClient.tsx
  EveningReflection.tsx     — Evening reflection form + display (post owner)
  FontFamilyButtons.tsx / FontSizeButtons.tsx — Reader font controls
  MorningRitualIconBar.tsx  — Ritual icons on post page
  MorningScaleBar.tsx       — Brain activity/body/happy scale display
  MorningZoneScatter.tsx    — Morning Zone scatter (body vs brain vs happiness)
  NavBar.tsx                — Bottom bell-curve site navigation with login modal
  PostFooter.tsx            — "You have been reading..." + wolf logo + owner actions
  PostForm.tsx              — Write/edit form with Review→Publish Claude flow
  RoutineIcons.tsx          — Morning routine icon set
  ShareButton.tsx           — Post sharing
  StatsCharts.tsx           — Trend charts for profile/stats pages
  ThemeButtons.tsx / ThemeProvider.tsx — Reader theme controls (DB-persisted)
  TopBar.tsx                — Fixed top utility bar: + new journal, BETA FEEDBACK, edit
  WolfLogo.tsx              — Animated wolf logo

lib/
  db/                       — Drizzle schema and database client
  actions/                  — Next.js server actions (auth, account, oauth)
  post-context.tsx          — React context: shares post ownership from page → TopBar
  posts.ts                  — Post fetching/parsing utilities (includes authorUsername in PostMeta)
  printful.ts               — Printful API client
  email.ts                  — Resend email helpers
  cart.tsx                  — Cart context and localStorage logic
  username.ts               — Username utilities: slugifyName, isValidUsername, generateUniqueUsername, isUsernameAvailable

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

### Roadmap

All work is organised by **milestone**, then **label**. No stage codes — milestones are the grouping unit.

**Active milestones:**

| Milestone | GitHub # | Purpose | Due |
|-----------|----------|---------|-----|
| Closed Alpha Development | #15 | Must be complete before public beta opens | 30 April 2026 |
| Phase 1 — Public Alpha | #13 | About page and SEO work (non-blocking) | — |
| Phase 2 — Public Beta | #12 | All beta features + formerly Phase 3 scope | 30 June 2026 |

**Beta timeline:**
- **Now → 30 April 2026:** Closed Alpha — no new registrations. Closed Alpha Development issues must ship.
- **1 May 2026:** Public Beta opens. Up to 51 users.
- **30 June 2026:** Beta closes. Hard date.

**Current status (25 March 2026):**
- Closed Alpha Development: 14 open issues (bugs + launch prep + branding). This is the active queue.
- Phase 1: 4 open issues — About page (#47–#50). Not blocking beta.
- Phase 2: 16 open issues — beta features, notifications, admin panel, WOLF|BOT, subscriptions, drafts.
- Phase 3 milestone: closed — all scope folded into Phase 2.

### Session startup — do this every time before any work begins

1. Run `git log --oneline -10` to see the last 10 commits.
2. Fetch open issues via the GitHub API using the PAT in `.env.local` (`GITHUB_TOKEN`):
   `https://api.github.com/repos/matthewdufty123-debug/wolfman-website/issues?state=open&per_page=100`
3. Check for any `in-progress` labelled issues — these were left mid-session and jump the queue.
4. Identify the active milestone. Priority order: **Closed Alpha Development** first, then Phase 1, then Phase 2.
5. Summarise: recent commits, anything in-flight, suggested next issue. Let Matthew confirm before starting.

### Session workflow

1. Once an issue is agreed, apply the `in-progress` label via the GitHub API.
2. Use the issue's description as the brief — generate a plan and confirm with Matthew before implementing.
3. On completion, reference the issue in the commit message: `closes #N` — this auto-closes the issue on push.
4. If new work surfaces, create a new GitHub Issue with the appropriate milestone and `planned` label.

**Label conventions:**
| Label | Colour | Meaning |
|-------|--------|---------|
| `planned` | Blue `#4A7FA5` | Identified, not yet started |
| `in-progress` | Yellow `#C8B020` | Actively being worked on |
| `bug` | Red `#d73a4a` | Something broken |
| `enhancement` | Green `#a2eeef` | New feature or improvement |
| `draft` | Lavender `#D4C5F9` | Needs scoping — do not implement until fully defined |
| `beta-feedback` | — | Raised via the /feedback form by a beta user |
| `subscriptions` | Purple `#8B5CF6` | Paid subscription tiers and feature gating |
| `notifications` | — | Email and cron notification work |
| `admin` | — | Admin panel and admin-only features |
| `ux` | — | User experience and interface improvements |

> **Draft issues must never be actioned.** If an issue carries the `draft` label, stop and prompt
> Matthew to finish scoping it before any implementation begins. Draft issues are placeholders —
> the brief is incomplete. Examples: #100 (scoring system), #101 (rewards system).

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

- **Closed Alpha:** Now until 30 April 2026 — no new registrations. Interest form for pre-registration.
- **Public Beta opens:** 1 May 2026
- **Public Beta closes:** 30 June 2026 (hard close — countdown visible on feedback form)
- **User cap:** 51 users maximum including admin (registration auto-closes at cap)
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

### Subscriptions and paid tiers

The original Milestone 5 paid membership model (Stripe subscriptions, member portal) was abandoned and issues #27–#32 and #37 closed as superseded. That model is gone.

A new, lighter approach is being scoped (#149): a free vs premium feature comparison page that informs users and serves as a development reference for feature gating decisions. Premium tier scope is to be defined incrementally during the beta.

Do not reintroduce the old Milestone 5 membership architecture without explicit instruction.