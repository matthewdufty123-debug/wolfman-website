# Roadmap & Releases — Wolfman.blog

GitHub Issues is the single source of truth for all planned and in-progress work.

- **Repo:** `https://github.com/matthewdufty123-debug/wolfman-website/issues`
- **Project board:** `https://github.com/users/matthewdufty123-debug/projects/2`

> `data/dev-log.json` and `data/future-dev.json` are **deprecated**. Do not use them for planning.

---

## Beta Timeline

- **Closed Alpha:** No new registrations. All Closed Alpha issues must ship before Public Beta opens.
- **Public Beta:** Up to 51 users (including admin). Registration auto-closes at cap.
- **Beta close:** Hard close — users notified, 30-day grace period to export data, then deletion.

---

## Active Milestones

Work is organised by milestone, then label. No version numbers or dates in this file —
features are referenced by name.

| Milestone | GitHub # | Scope |
|-----------|----------|-------|
| Closed Alpha Development | #15 | Bugs, launch prep, branding, About page, donations |
| Phase 1 — Public Alpha | #13 | About page work (non-blocking) |
| Journaling Feature | #16 | Core journals, rituals, scales, profile stats, notifications, admin basics, data deletion |
| WOLF\|BOT Feature | #17 | Single review system, journal review, title toggle, admin prompt config |
| Communities Feature | #18 | Community walls, public/private communities, nav, public sharing |
| Rituals Feature | #19 | Standard rituals with logos/descriptions, custom rituals |
| Statistics Feature | #20 | Profile stats finalised, site-wide stats, WOLF\|BOT data layer, achievements foundation |
| Achievements Feature | #21 | Achievements, streaks, badges (built on Statistics data layer) |
| Shop Feature | #22 | Shop live, Printful fulfilment, Stripe payments |
| Subscriptions Feature | #23 | Free vs premium tier, feature gating, paid tier live |
| Legal Feature | #24 | Data protection, T&Cs, GDPR, cookie consent, EU/US legal, shop/subscription terms — must complete before go-live |

---

## Feature Freeze Policy

The scope of each milestone is locked. **New feature requests face strict scrutiny.**

- New features default to **post-live** unless there is a compelling, well-reasoned case
- The bar is high: must be core to the beta's purpose, not additive
- Bug fixes and critical UX issues are always exempt
- To request a scope change: raise a GitHub issue with a clear rationale. Review before implementation.

---

## Subscriptions — Architecture Note

The original paid membership model (Stripe subscriptions, member portal) was **abandoned**.
Issues #27–#32 and #37 are closed as superseded. Do not reintroduce that architecture.

The current approach: a free vs premium feature comparison (lightweight). Premium tier scope
defined incrementally during beta. `isPremium()` stub in API routes — all users treated as
premium until Subscriptions feature ships.

---

## Shipping History

Version entries are logged manually via `/admin` → "Log version entry" after each deploy.
These appear on the `/dev` page release notes. The `versionHistory` table must be populated
after every deploy — this is part of the post-commit workflow checklist.

See git log for a full history of what has shipped.

---

## GitHub Issues — How to Raise

When creating a new issue:
1. Reference the feature by name (e.g. "WOLF|BOT", "Routines", "Shop")
2. Reference the relevant docs/ file (e.g. "See docs/WOLFBOT.md")
3. Apply the correct label and milestone
4. Do not action `draft` issues — wait for scoping to be complete

### Label Conventions

| Label | Colour | Meaning |
|-------|--------|---------|
| `planned` | `#4A7FA5` | Identified, not yet started |
| `in-progress` | `#C8B020` | Actively being worked on |
| `bug` | `#d73a4a` | Something broken |
| `enhancement` | `#a2eeef` | New feature or improvement |
| `draft` | `#D4C5F9` | Needs scoping — do not implement |
| `beta-feedback` | — | Raised via /feedback by a beta user |
| `subscriptions` | `#8B5CF6` | Paid tier and feature gating |
| `notifications` | — | Email and cron work |
| `admin` | — | Admin panel and admin-only features |
| `ux` | — | User experience and interface |

> **Draft issues must never be actioned.** If an issue carries `draft`, stop and prompt
> Matthew to finish scoping before any implementation begins.
