# CLAUDE.md — Wolfman Website Project

## Who is Wolfman?

Wolfman is a mindful living brand built on outward truth and inner honesty. Through mindfulness,
self-exploration, and gratitude, Wolfman shows that life's smallest moments can become its greatest
joys. Purpose is found in the doing. Joy is meant to be shared.

The Wolfman brand is the personal expression of Matthew Wolfman — a data engineer, mountain biker,
photographer, wood carver, and mindful human being based in the UK. Everything on this site is
authentic, personal, and real.

wolfman.blog is a public beta for a mindful morning journalling app. Registered users log their
daily morning routine (intentions, mood scales, rituals, evening reflections) and receive a WOLF|BOT
review. Data accumulates over time enabling personal habit tracking. The author's public blog
continues as a separate feed visible to all.

---

## The Website

**Domain:** wolfman.app (wolfman.blog redirects here)
**Deployment:** Git → GitHub → Vercel (auto-deploys on push)
**Local folder:** D:\Websites\Wolfman.blog

### Tech Stack

| Service | Purpose |
|---------|---------|
| Next.js 15 (App Router) + TypeScript | Framework |
| Tailwind CSS | Styling |
| Auth.js v5 (next-auth@beta) | Authentication — JWT sessions, email/password + GitHub + Google OAuth |
| Neon PostgreSQL + Drizzle ORM | Database. Schema: `lib/db/schema.ts`. Apply changes: `npm run db:push`. Full table definitions: `docs/SCHEMA.md` |
| Vercel Blob | Image storage — never commit large images to git. Upload via `/api/admin/upload` |
| Stripe | Payments — test keys in `.env.local`, production in Vercel dashboard |
| Printful API | Print-on-demand fulfilment |
| Resend | Email — all functions in `lib/email.ts`. Full detail: `docs/NOTIFICATIONS.md` |
| Anthropic API | WOLF|BOT and title/excerpt generation. Key: `ANTHROPIC_API_KEY`. Full detail: `docs/WOLFBOT.md` |

**Auth notes:**
- GitHub login auto-assigns admin role for `matthewdufty123-debug`
- Route protection via middleware (`auth.config.ts` — edge-compatible)

**Environment:**
- Local: `.env.local` (pull via `vercel env pull .env.local`) — never commit
- Production: Vercel dashboard — source of truth

---

## Sub-file Reference

**Read the relevant file before working on these features. Do not rely on memory.**

| Feature / Area | File | Read when... |
|----------------|------|-------------|
| WOLF\|BOT | `docs/WOLFBOT.md` | Any WOLF\|BOT work: reviews, prompts, admin, pixel art, ratings |
| Morning Routines & Scales | `docs/ROUTINES.md` | Morning state, ritual keys, scales, evening reflection |
| Database Schema | `docs/SCHEMA.md` | Any schema change, DB query, or table structure question |
| App Architecture | `docs/ARCHITECTURE.md` | Folder structure, finding components, route mapping |
| Email & Notifications | `docs/NOTIFICATIONS.md` | Email functions, cron jobs, reminders, admin alerts |
| Roadmap & Releases | `docs/ROADMAP.md` | Milestone scope, feature freeze, label conventions |
| Navigation | `docs/NAVIGATION.md` | Nav bar slots, configurations, route-to-config mapping |
| Communities | `docs/COMMUNITIES.md` | Communities feature (not yet built — placeholder) |
| Achievements | `docs/ACHIEVEMENTS.md` | Achievements feature (not yet built — placeholder) |
| Shop | `docs/SHOP.md` | Shop, Stripe, Printful — expand when feature goes live |
| Statistics | `docs/STATISTICS.md` | Statistics feature — expand when built |

---

## Site Structure

### Journals (the heart of the site)

Matthew writes a daily morning intention journal. User-facing copy always uses **journal** not "post".

Each journal has three sections:
- **Today's Intention** — a story, observation or reflection leading to a lesson for the day
- **I'm Grateful For** — something specific, vivid and personal. Never generic.
- **Something I'm Great At** — a strength, owned with confidence and without apology

Journals are DB-backed (`posts` table). Canonical URL: `/[username]/[slug]`

**Reading experience — this is sacred. Never compromise it:**
- The reader sees NOTHING but the text — no navigation, no header, no clutter
- Pure text, like opening a book
- At the very bottom: "You have been reading... [post title]"
- Below that: the animated Wolfman wolf logo — gently pulsing, inviting a click
- Clicking the logo returns to the home page

### Morning Data

Users capture morning scales (1–8), a routine checklist (10 rituals), and an evening reflection
per journal. Full detail: `docs/ROUTINES.md`

### WOLF|BOT

AI journalling assistant — generates one personalised review per journal. Full detail: `docs/WOLFBOT.md`

### Home Page

Two-tab journal feed:
- **Community tab** (default) — Matthew's published journals
- **My Journals tab** (`?view=mine`) — logged-in user's own journals including drafts

### Profile & Stats

`/[username]` — per-user profile: avatar, headline stats (total journals, current streak, longest
streak, this month), Morning Zone scatter chart, trend charts. Owner sees edit affordance.

### Shop

Photography canvases, prints, wellbeing clothing. Print-on-demand via Printful. Stripe payments.
Guest checkout supported. Full detail: `docs/SHOP.md`

### Key Pages

| Route | Purpose |
|-------|---------|
| `/` | Home — journal feed |
| `/[username]` | User profile + stats |
| `/[username]/[slug]` | Journal reading page |
| `/write` | New journal form |
| `/edit/[id]` | Edit journal form |
| `/account` | Profile editing |
| `/settings` | Theme, font, morning reminder |
| `/admin` | Admin dashboard |
| `/admin/wolfbot` | WOLF\|BOT prompt + pixel art editor |
| `/discover` | Discover hub (NBLS2 destination) |
| `/features` | Non-technical release roadmap |
| `/dev` | GitHub-integrated development hub |
| `/beta` | Beta info, terms, countdown |
| `/feedback` | Beta feedback → GitHub Issues |
| `/shop` | Shop listing |
| `/morning-ritual/[key]` | Filter journals by ritual |
| `/rituals` | Rituals overview (placeholder) |
| `/achievements` | Achievements overview (placeholder) |

### Navigation

Two fixed rectangular bars (upper 44px + lower 64px). NBLS6 is always WOLF|BOT.
Full detail: `docs/NAVIGATION.md`. Single source of truth: `lib/nav-config.ts`.

---

## Brand & Design

### Primary Palette

| Name | Hex | Use |
|------|-----|-----|
| Steel Blue | `#4A7FA5` | Navigation, structural elements |
| Copper/Bronze | `#A0622A` | Accents, highlights |
| Charcoal | `#4A4A4A` | Body text, dark backgrounds |
| White | `#FFFFFF` | Reading backgrounds, reversed text |
| Black | `#000000` | Wolf illustration, strong contrast |

### Statement / CTA Colour

**Deep Navy `#214459`** — primary CTA buttons and high-impact actions only.
Always paired with white text. Use sparingly — reserve for the most important action on a page.

### Extended Palette

`#3AB87A` Emerald · `#2A6AB0` Royal Blue · `#C8B020` Mustard/Gold · `#6090C0` Cornflower Blue ·
`#A82020` Crimson · `#70C0C8` Teal · `#A8D0E0` Powder Blue · `#909090` Mid Grey · `#C87840` Copper/Terracotta

### Logo

The Wolfman wolf mark — a howling wolf across three panels (blue, copper, grey). Used as a round
icon at the bottom of journal posts. Animate gently — pulse or subtle glow. Give it space.

### Typography

The font system is **locked** — do not add a font selector or allow font-family switching.

| Role | Font | CSS variable |
|------|------|-------------|
| Headings / titles | Inter | `--font-inter` |
| Body / reading | Lora | `--font-lora` |
| UI / nav / labels | Inter | `--font-inter` |
| Code / monospace | JetBrains Mono | `--font-jetbrains` |

- `body { font-family: var(--font-lora) }` — Lora cascades to all reading text by default
- Font size (`data-fontsize`: normal / large / xlarge) is user-configurable via settings overlay
- Loaded via `next/font/google` in `app/layout.tsx`

### Design Principles

- Minimalism above everything
- Photography and words are the heroes — never compete with them
- White space is intentional, not empty
- Every element must earn its place
- Never add UI chrome that distracts from the reading experience
- Mobile first — journals will be read on phones

---

## Tone of Voice

Matthew's voice is: **honest** (examines himself without flinching) · **warm** (never cold or
corporate) · **self-aware** (finds humour in his own contradictions) · **philosophical** (goes
deep, always comes back to something real) · **energetic** (ends with forward momentum, never
defeat) · **never preachy** (shares experience, never lectures).

When writing any copy — nav labels, button text, error messages, product descriptions — match
this voice. Nothing generic. Nothing corporate.

---

## Content Guidelines

- Journal entries are written by Matthew (and beta users) — never AI-generated
- Product descriptions should feel like Matthew wrote them
- Image alt text: descriptive and warm, not mechanical
- SEO matters but never at the expense of the reading experience

---

## Technical Rules

- **Git workflow:** add → commit locally. Do NOT push unless Matthew explicitly asks.
- Commit messages: descriptive and human. Include `closes #N` to auto-close GitHub issues.
- **Images:** never commit large images — upload to Vercel Blob via admin upload tool
- **Schema changes:** edit `lib/db/schema.ts` → run `npm run db:push`. Full schema: `docs/SCHEMA.md`
- **Mobile:** never break the mobile reading experience

### Branching Strategy

- **main** — production. Every push deploys to wolfman.blog via Vercel.
- **Feature branches** — `feature/short-description`. Branch from main, merge back via PR.
- **Vercel preview deployments** — every branch pushed to GitHub gets a preview URL automatically.
  Use for device/mobile testing before merging. No dedicated dev subdomain needed.

---

## Version Numbering

Four-part format: `[site state].[release state].[feature state].[minor update]`

Full versioning rules: `VERSIONING.md`

**Quick rules — apply on every commit:**
- **Minor fix** (bug, copy, style): increment the fourth part only. `0.1.2.0` → `0.1.2.1`
- **New feature**: increment the third part, reset fourth. `0.1.2.1` → `0.1.3.0`
- **New release milestone**: increment the second part, reset third and fourth. `0.1.X.Y` → `0.2.0.0`
- Bump `appVersion` in `package.json` on **every commit** — even minor amends

---

## Session Startup — Do This Every Time

> Matthew works across desktop and phone. Phone sessions push directly to GitHub. Always pull
> before touching anything to prevent history divergence.

1. **Check for open `claude/*` branches** — phone/worktree sessions. Fetch via API, flag any:
   `GET https://api.github.com/repos/matthewdufty123-debug/wolfman-website/branches?per_page=100`
2. **`git pull origin main`** — pull any merged phone work before touching anything.
3. **`git log --oneline -10`** — see recent commits.
4. **Fetch open issues** via GitHub API (PAT in `.env.local` as `GITHUB_TOKEN`):
   `https://api.github.com/repos/matthewdufty123-debug/wolfman-website/issues?state=open&per_page=100`
5. **Check for `in-progress` issues** — these were left mid-session and jump the queue.
6. **Identify active milestone** — priority order: Closed Alpha Development → Phase 1 → feature milestones.
7. **Summarise** — open branches, recent commits, anything in-flight, suggested next issue. Let Matthew confirm before starting.

---

## Session Workflow

1. Once an issue is agreed, apply the `in-progress` label via GitHub API.
2. Use the issue's description as the brief — generate a plan and confirm with Matthew before implementing.
3. **On completion — four steps before committing:**
   - **a. Bump version** in `package.json` per versioning rules above
   - **b. Features check** — open `lib/releases.ts`. Does this commit fully complete anything marked "In Development" or "Coming Soon"? If yes, flag it and ask Matthew to confirm before marking as `'built'`
   - **c. Log version entry** — after deploy, go to `/admin` → "Log version entry" to update the release notes on `/dev`. Do not skip this.
   - **d. Commit** with `closes #N` in the message to auto-close the GitHub issue
4. **Push only when Matthew explicitly confirms.**

### Raising GitHub Issues

When creating a new issue:
- State which feature it affects by name (e.g. "WOLF|BOT", "Routines", "Shop")
- Reference the relevant docs/ file (e.g. "See `docs/WOLFBOT.md`")
- Apply the correct label (see `docs/ROADMAP.md` for label conventions)
- **Draft issues must never be actioned** — wait for Matthew to complete the scope

---

## Beta Parameters

- **Closed Alpha:** No new registrations. Issues must ship before Public Beta opens.
- **Public Beta:** 51 users maximum including admin. Registration auto-closes at cap.
- **Beta close:** Hard date. Users get 30-day grace period to export data, then deletion.
- **Successful close:** Site continues, user data migrates, users carry on seamlessly.

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

A reader finds a Wolfman post on LinkedIn during their lunch break. They click the link. The words
fill their screen. They read. They feel something. They finish. They see "You have been reading..."
They smile. They click the wolf. They arrive at wolfman.blog. They want to know more. They find the
shop. They buy a canvas that reminds them of how they felt reading that post.

That is the Wolfman journey. Every decision we make should serve it.
