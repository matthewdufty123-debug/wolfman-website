# App Architecture — Wolfman.blog

**Framework:** Next.js 15 (App Router) with TypeScript
**Styling:** Tailwind CSS

---

## Folder Structure

```
app/
  (main)/                       — Public-facing pages (shared layout with nav bars)
    [username]/                 — User profile: avatar, stats, scatter, streak
      [slug]/                   — Canonical journal reading page (sacred — no chrome)
    about/                      — About page (not yet built)
    account/                    — User profile edit: username, name, avatar, password, WOLF|BOT profile
    admin/                      — Admin dashboard
      wolfbot/                  — WOLF|BOT prompt editor, pixel art editor, version log
    beta/                       — Beta info, terms, data policy, countdown
    cart/                       — Shopping cart
    checkout/                   — Stripe checkout + success page
    dev/                        — GitHub-integrated technical hub (milestones, issues, branches, PRs, release notes)
    discover/                   — Discover hub: cards linking to all Discover section pages
    features/                   — Non-technical release roadmap (feature status badges). Data: lib/releases.ts
    feedback/                   — Beta feedback form (submits to GitHub Issues API)
    intentions/                 — 301 redirect → /
    journaling/                 — The Journalling Practice (Discover section, placeholder)
    morning-ritual/[key]/       — Filter journals by ritual key. No root page — use /rituals
    morning-stats/              — Redirects logged-in users → /[username], else → /login
    journal/                    — Redirects logged-in users → /[username], else → /login
    register/                   — Registration page (includes beta terms summary)
    rituals/                    — Rituals overview (Discover section, placeholder)
    achievements/               — Achievements overview (Discover section, placeholder)
    scores/                     — Morning Scores explainer (Discover section, placeholder)
    settings/                   — User settings: theme, font, morning reminder (DB-persisted)
    shop/                       — Shop listing + [id] product page
    terms/                      — General T&Cs (placeholder)
    login/                      — Login page
    investment/                 — Investment case (noindex, linked from About only)

  (post)/                       — Route group for write/edit overlays (minimal chrome)
    posts/[slug]/               — Legacy URL — 301 redirects to /[username]/[slug]
    write/                      — New journal form (all authenticated users)
    edit/[id]/                  — Edit journal form (post owner only)

  api/
    admin/
      claude-take/              — Legacy: Claude's Take generation (admin). Superseded by WOLF|BOT.
      evening-reflection/       — Save evening reflection (admin)
      github-token/             — GitHub PAT helper for /dev page
      posts/                    — Post CRUD (admin)
      seo/                      — SEO meta generation (admin)
      upload/                   — Vercel Blob upload (admin only, 10MB limit)
      wolfbot-config/           — GET/PATCH WOLF|BOT config keys
      wolfbot-version-log/      — GET WOLF|BOT version audit log
    auth/[...nextauth]/         — Auth.js handler
    checkout/                   — Stripe checkout session creation
    claude-take/                — Legacy: Claude's Take (post owner). Superseded by WOLF|BOT.
    evening-reflection/         — Save evening reflection (post owner)
    feedback/                   — Beta feedback → GitHub Issues API
    morning-stats/              — Morning stats data API
    posts/
      [id]/
        review/                 — Claude review: SEO excerpt + refined title suggestion
        wolfbot-reviews/        — POST: generate WOLF|BOT review
        wolfbot-rating/         — PATCH: update review rating (null/1/2/3)
        wolfbot-event/          — Event tracking
    user/
      avatar/                   — Avatar upload to Vercel Blob
      settings/                 — Read/write user preferences (theme, font)
      username/                 — Username availability check (GET ?u=foo)
      reminders/                — GET/PATCH morning reminder prefs
        unsubscribe/            — HMAC one-click opt-out
    cron/
      beta-emails/              — Daily cron: beta announcement emails
      morning-reminder/         — Every-15-min cron: morning reminder emails
    version-history/            — GET: returns versionHistory table for /dev release notes
    webhooks/stripe/            — Stripe webhook handler

  layout.tsx                    — Root layout with CartProvider
```

---

## Components

| Component | Purpose |
|-----------|---------|
| `AccountNameForm.tsx` | Profile name editing |
| `AccountPasswordForm.tsx` | Password change form |
| `AccountUsernameForm.tsx` | Username editing with live availability check |
| `AccountWolfBotProfileForm.tsx` | WOLF|BOT personalisation — profession + humour style dropdowns on /account |
| `AddToCartButton.tsx` | Shop add-to-cart |
| `AnimatedRoutineIcons.tsx` | Scroll-triggered staggered fade-in of completed ritual icons |
| `AuthForm.tsx` / `AuthProvider.tsx` | Auth UI and context |
| `AvatarUpload.tsx` | Avatar upload with preview |
| `DayScoreScatter.tsx` | Day score scatter chart (legacy — dayScores feature superseded) |
| `DevOverlay.tsx` / `DevPageClient.tsx` | /dev page client components |
| `EveningReflection.tsx` | Evening reflection form + display (post owner) |
| `FontFamilyButtons.tsx` / `FontSizeButtons.tsx` | Reader font controls |
| `JournalPage.tsx` | Main journal reading page — 9 vertical sections |
| `LandscapeBlock.tsx` | CSS-only portrait lock: full-screen overlay on touch devices in landscape |
| `LowerNavBar.tsx` | Primary nav bar (6 slots). Login modal lives here. |
| `MorningRitualIconBar.tsx` | Interactive ritual icon bar with popup + "see all journals" link |
| `MorningScaleBar.tsx` | Scale display (brain/body/happy) |
| `MorningZoneScatter.tsx` | Morning Zone scatter chart (body vs brain vs happiness) |
| `PostFooter.tsx` | "You have been reading…" + wolf logo + owner action buttons |
| `PostForm.tsx` | Write/edit form — two tabs (After Waking / Before Bed) + Review→Publish flow |
| `ReminderSettings.tsx` | Morning reminder toggle + time picker + timezone selector (on /settings) |
| `RoutineIcons.tsx` | Central ritual registry (`ROUTINE_ICON_MAP`) + `RoutineIconSet` + `RoutineIconBar` |
| `SectionHeader.tsx` | Sticky header for Discover/Beta Testing sections — logo + dropdown nav |
| `SettingsOverlay.tsx` | Theme + font overlay (triggered from nav) |
| `ShareButton.tsx` | Native share / clipboard fallback |
| `StatsCharts.tsx` | Trend charts for profile/stats pages |
| `ThemeButtons.tsx` / `ThemeProvider.tsx` | Theme switcher (DB-persisted) |
| `TopBar.tsx` | Fixed top utility bar: + new journal, Beta Feedback, edit |
| `UpperNavBar.tsx` | Utility nav bar (5 slots) |
| `WolfBotIcon.tsx` | Pixel-art SVG sprite — reads from lib/wolfbot-pixel-data.ts or live config |
| `WolfBotLoadingOverlay.tsx` | Eye-scan animation shown while WOLF|BOT generates |
| `WolfLogo.tsx` | Animated wolf logo (gently pulsing — used at bottom of journal posts) |

### Journal sub-components (`components/journal/`)

| Component | Purpose |
|-----------|---------|
| `WolfBotSection.tsx` | Full WOLF|BOT review terminal on journal reading page |

---

## lib/ Utilities

| File | Purpose |
|------|---------|
| `db/schema.ts` | Drizzle schema — all table definitions |
| `db/index.ts` | Database client |
| `actions/` | Next.js server actions (auth, account, OAuth) |
| `cart.tsx` | Cart context and localStorage logic |
| `email.ts` | Resend email helpers — all notification functions |
| `nav-config.ts` | Single source of truth for nav bar slot configurations |
| `post-context.tsx` | React context — shares post ownership from page → TopBar |
| `posts.ts` | Post fetching/parsing utilities |
| `printful.ts` | Printful API client |
| `releases.ts` | Static feature/release data for /features page — edit here to update feature status |
| `username.ts` | Username utilities: slugifyName, isValidUsername, generateUniqueUsername, isUsernameAvailable |
| `wolfbot-pixel-data.ts` | Single source of truth for WOLF|BOT pixel art — WOLFBOT_GRID, WOLFBOT_PALETTE, eye cells |

---

## Key Config Files

| File | Purpose |
|------|---------|
| `auth.ts` | Auth.js full config — providers, adapter, callbacks |
| `auth.config.ts` | Edge-compatible auth config (used by middleware) |
| `middleware.ts` | Route protection |
| `drizzle.config.ts` | Drizzle Kit config |
| `lib/nav-config.ts` | Nav bar slot configuration (see docs/NAVIGATION.md) |

---

## Navigation

Navigation is a two-bar system. Full documentation in `docs/NAVIGATION.md`.

- **Upper Nav Bar** — 5 slots, 44px, utility/contextual
- **Lower Nav Bar** — 6 slots, 64px, primary navigation
- **NBLS6** is always WOLF|BOT across all non-auth configurations
- Single source of truth: `lib/nav-config.ts`

---

## Features Page Data

Feature statuses on `/features` are driven by `lib/releases.ts` — a static TypeScript array.
To mark a feature as "Built": edit the `status` field on the relevant feature object in that file.
This is part of the post-commit workflow checklist.

---

## GitHub Issues

When raising architecture-related issues, reference this file (`docs/ARCHITECTURE.md`).
