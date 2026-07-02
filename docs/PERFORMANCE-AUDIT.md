# Performance Audit — July 2026

A full sweep of the codebase for performance, redundant code, and items that no longer earn
their place. Every finding below was verified against the code (grep + a production build),
not assumed. Each to-do is tracked as a GitHub issue.

---

## The Site, Categorised

How the codebase actually breaks down today — 38 pages, 51 API routes, ~24,000 lines of TS/TSX.

| Category | What's in it | Health |
|----------|--------------|--------|
| **Journals (core)** | Home, `/feed`, reading page, `/write`, `/edit`, `/today`, morning state APIs | Sound queries (batched, `Promise.all`) — but rendering is forced dynamic everywhere (#273) |
| **WOLF\|BOT** | Reviews, admin prompt/pixel editor, ratings | Live code healthy; one 424-line orphaned admin component (#275) |
| **Profile & Stats** | `/[username]`, charts | Migrated to hand-rolled `components/charts/` — old recharts layer is now dead weight (#274, #275) |
| **Shop & Payments** | `/shop`, cart, checkout, Stripe + Printful | Uses ISR correctly (`revalidate = 3600`) ✅; module-scope Stripe init breaks secret-less builds (#279) |
| **Auth & Accounts** | Auth.js, middleware, account/settings/onboarding | Working; session gating blocks static rendering of public pages (#273) |
| **Notifications** | Resend, crons, Telegram | One cron 404s daily against a deleted route (#278) |
| **Meta pages** | `/dev`, `/beta`, `/feedback`, placeholders, redirects | Redirect-only pages cost a serverless render each (#275) |
| **One-offs** | `/car` (eBay listing), `/career` | Self-contained, fine |
| **Legacy remnants** | Root `css/`, `js/`, `images/`, `_archive/posts/` | Dead — pre-Next.js static site (#276) |

---

## Findings, Ranked by Impact

### 1. The whole site is forced dynamic — [#273](https://github.com/matthewdufty123-debug/wolfman-website/issues/273)

`app/(main)/layout.tsx` and `app/(post)/layout.tsx` both declare
`export const dynamic = 'force-dynamic'`, which cascades to **every page**. The journal
reading page has `generateStaticParams()` — it was built to be static — but the layout
setting silently defeats it. Every anonymous read is a cold serverless render plus Neon
round-trips. Fixing this is the single biggest win on the list: reading pages served from
the CDN edge instead of a database.

### 2. 159 KB of render-blocking CSS on every page — [#277](https://github.com/matthewdufty123-debug/wolfman-website/issues/277)

`app/globals.css` is 10,306 lines. A selector scan found ~400 classes with no reference in
any component — whole retired page designs (old `/dev`, old account page) still ship to
every phone. Purge first, then optionally split per-route.

### 3. Journal photos ship unoptimised — [#280](https://github.com/matthewdufty123-debug/wolfman-website/issues/280)

Feed cards, profile avatar and today-page previews use raw `<img>` against full-resolution
Vercel Blob originals — no resizing, no AVIF, no lazy-loading. `next/image` is already
configured for the Blob domain; it just isn't used on these pages.

### 4. Four unused npm dependencies (~16.5 MB) — [#274](https://github.com/matthewdufty123-debug/wolfman-website/issues/274)

`recharts` (8.7 MB — only consumed by components that are themselves unused),
`framer-motion` (5.8 MB — zero imports), `gray-matter` (0.7 MB — posts are DB-backed now),
`@stripe/stripe-js` (1.3 MB — checkout is a server-side redirect). Faster installs and builds.

### 5. ~2,000 lines of dead components and modules — [#275](https://github.com/matthewdufty123-debug/wolfman-website/issues/275)

Ten components with zero imports (StatsCharts, MorningZoneScatter, WordCountChart,
WolfbotConfigClient, MorningRitualIconBar, MorningScaleBar, ShareButton, and three
journal sections), plus `lib/releases.ts` — which CLAUDE.md's commit workflow still
references. Also: `/features` and `/intentions` are redirect-only pages that should be
`next.config.ts` redirects.

### 6. Legacy static-site folders in the repo — [#276](https://github.com/matthewdufty123-debug/wolfman-website/issues/276)

Root `css/`, `js/`, `images/` (1.3 MB) and `_archive/posts/` (74 migrated markdown
journals) — none served or imported. `data/career-lineage.json` **is** live; keep it.

### 7. Dead cron hits a 404 every morning — [#278](https://github.com/matthewdufty123-debug/wolfman-website/issues/278)

`vercel.json` schedules `/api/cron/beta-emails` daily at 08:00 but the route was removed.

### 8. Builds fail without production secrets — [#279](https://github.com/matthewdufty123-debug/wolfman-website/issues/279)

`new Stripe(process.env.STRIPE_SECRET_KEY!)` at module scope in both Stripe routes throws
during `next build`'s page-data collection in any environment without the key. Lazy-init fixes it.

---

## What's Already Healthy

Worth saying out loud — plenty of this codebase is in good shape:

- **Query patterns** — feed and profile pages batch with `inArray` and `Promise.all`; no N+1s found
- **Shop caching** — `revalidate = 3600` on shop pages is exactly right
- **Reading page structure** — per-section Suspense boundaries with skeletons
- **Fonts** — `next/font` with `display: swap`, subsetted, three families, locked
- **Static assets** — `public/` is a lean 876 KB
- **lucide-react** — 46 MB installed but tree-shaken to single icons in the bundle; fine

## Suggested Working Order

1. **#278** cron fix + **#279** Stripe lazy-init — two quick, isolated fixes
2. **#274** dependency removal + **#275** dead code + **#276** legacy folders — one cleanup pass, easy to verify with a build
3. **#273** static rendering — the big one; do it on a branch with a Vercel preview
4. **#280** images, then **#277** CSS purge — visible-quality passes, verify on a phone

*Audit run 2 July 2026 against `main` (c4db0ef). Issues: #273–#280.*
