# Navigation System — Wolfman.blog

## Overview

The site uses two fixed rectangular navigation bars — an **Upper Nav Bar** (thin,
discrete, contextual) and a **Lower Nav Bar** (thick, prominent, primary navigation).

Each bar has a fixed number of slots numbered left-to-right. Slots are evenly
distributed across the full width of the bar.

The **single source of truth for what goes in each slot** is `lib/nav-config.ts`.
This document describes the system in human-readable form and must be kept in
sync with that file whenever slots are changed.

---

## Slot Naming

### Lower Nav Bar — 6 slots

```
│ NBLS1 │ NBLS2 │ NBLS3 │ NBLS4 │ NBLS5 │ NBLS6 │
```

| Slot  | Position |
|-------|----------|
| NBLS1 | Far left |
| NBLS2 | Second from left |
| NBLS3 | Centre-left |
| NBLS4 | Centre-right |
| NBLS5 | Second from right |
| NBLS6 | Far right — **always WOLF\|BOT** |

### Upper Nav Bar — 5 slots

```
│ NBUS1 │ NBUS2 │ NBUS3 │ NBUS4 │ NBUS5 │
```

| Slot  | Position |
|-------|----------|
| NBUS1 | Far left |
| NBUS2 | Second from left |
| NBUS3 | Centre |
| NBUS4 | Second from right |
| NBUS5 | Far right |

---

## Bar Dimensions

| Bar | Height | Style |
|-----|--------|-------|
| Lower Nav Bar | 64px | Thick, pronounced, primary navigation |
| Upper Nav Bar | 44px | Thin, discrete, contextual/utility |

---

## Named Configurations

Each page (or group of pages) maps to a named configuration. The configuration
specifies what goes in each slot. The components read `lib/nav-config.ts` to
determine which configuration to render based on the current route.

---

### `standard`

**Used on:** `/`, `/[username]`, `/about`, `/features`, `/beta`, `/dev`,
`/feedback`, `/terms`, `/morning-ritual`, `/morning-stats`, `/journal`,
`/shop`, `/shop/[id]`, `/cart`, `/checkout`, `/checkout/success`, `/wolfbot`

| Bar | Slot | Content | Notes |
|-----|------|---------|-------|
| Lower | NBLS1 | Feed → `/` | Home icon |
| Lower | NBLS2 | Rituals → `/morning-ritual` | |
| Lower | NBLS3 | Write → `/write` | Hidden when logged out |
| Lower | NBLS4 | Shop → `/shop` | |
| Lower | NBLS5 | Account → `/account` OR Sign In modal | Context-aware |
| Lower | NBLS6 | WOLF\|BOT → `/wolfbot` | Always present |
| Upper | NBUS1 | — | Empty |
| Upper | NBUS2 | — | Empty |
| Upper | NBUS3 | BETA → `/beta` | Subtle label |
| Upper | NBUS4 | — | Empty |
| Upper | NBUS5 | Settings (theme/font overlay) | Icon button |

---

### `journal-reading`

**Used on:** `/[username]/[slug]`, `/posts/[slug]`

Both bars **fade to 25% opacity** after 3 seconds of user inactivity.
They return to 100% opacity on any scroll, touch, or mouse movement.
Transition: 300ms ease.

| Bar | Slot | Content | Notes |
|-----|------|---------|-------|
| Lower | NBLS1 | Feed → `/` | Back to home |
| Lower | NBLS2 | Profile → `/[username]` | Author's profile |
| Lower | NBLS3 | Share | Native share / clipboard fallback |
| Lower | NBLS4 | Edit → `/edit/[id]` | Link to edit page (edit page enforces auth) |
| Lower | NBLS5 | Export as .txt | Downloads post content |
| Lower | NBLS6 | WOLF\|BOT → `/wolfbot` | Always present |
| Upper | NBUS1 | ← Previous post | Hidden if no previous post |
| Upper | NBUS2 | — | Empty |
| Upper | NBUS3 | — | Empty |
| Upper | NBUS4 | — | Empty |
| Upper | NBUS5 | → Next post | Hidden if no next post |

---

### `writing`

**Used on:** `/write`, `/edit/[id]`

Minimal — user is in focus/writing mode.

| Bar | Slot | Content | Notes |
|-----|------|---------|-------|
| Lower | NBLS1 | ← Back | Browser back |
| Lower | NBLS2 | — | Empty |
| Lower | NBLS3 | — | Empty |
| Lower | NBLS4 | — | Empty |
| Lower | NBLS5 | Settings (theme/font overlay) | |
| Lower | NBLS6 | WOLF\|BOT → `/wolfbot` | Always present |
| Upper | NBUS1–5 | — | All empty |

---

### `auth`

**Used on:** `/login`, `/register`

Both bars are **hidden entirely** — clean auth focus, no distraction.

---

### `admin`

**Used on:** `/admin`, `/admin/wolfbot`

| Bar | Slot | Content |
|-----|------|---------|
| Lower | NBLS1 | Feed → `/` |
| Lower | NBLS2 | Admin → `/admin` |
| Lower | NBLS3 | — |
| Lower | NBLS4 | — |
| Lower | NBLS5 | Account → `/account` |
| Lower | NBLS6 | WOLF\|BOT → `/wolfbot` |
| Upper | NBUS1–5 | All empty |

---

## Route → Configuration Map

This mapping is also defined in `lib/nav-config.ts` via `getNavConfig()`.
Routes are matched in order — first match wins.

| Route pattern | Configuration |
|---------------|---------------|
| `/login`, `/register` | `auth` |
| `/admin`, `/admin/*` | `admin` |
| `/write`, `/edit/*` | `writing` |
| `/[username]/[slug]`, `/posts/*` | `journal-reading` |
| Everything else | `standard` |

---

## Opacity / Fade Behaviour

Only the `journal-reading` configuration uses fading:

- **On load:** both bars are at full opacity
- **After 3 seconds of inactivity:** bars fade to **25% opacity**
- **On any interaction** (scroll, touch, mousemove): bars return to **100% opacity**
- **Transition:** `opacity 300ms ease`
- **Respects `prefers-reduced-motion`:** if set, bars stay at 100% opacity always

All other configurations: bars always at 100% opacity.

---

## WOLF|BOT — NBLS6

NBLS6 is the permanent home of the WOLF|BOT button across all non-auth
configurations. It links to `/wolfbot`.

The icon used is the `WolfBotIcon` pixel-art component (`components/WolfBotIcon.tsx`),
which is rendered from a 25×25 grid defined in that file.

To update the WOLF|BOT icon design, edit the `GRID` and `PALETTE` constants in
`components/WolfBotIcon.tsx`.

---

## How to Update Navigation

### Change what a slot does

1. Open `lib/nav-config.ts`
2. Find the config (e.g., `standard`) and the slot (e.g., `lower[2]` for NBLS3)
3. Update the slot definition
4. Update the matching table in this document

### Add a new named configuration

1. Add a new key to `NavConfigKey` type in `lib/nav-config.ts`
2. Add the config object to `NAV_CONFIGS`
3. Add the route pattern(s) to `getNavConfig()`
4. Document the new config in this file under "Named Configurations"
5. Add it to the Route → Configuration Map table above

### Change bar heights or visual style

Edit the CSS classes `.lower-nav` and `.upper-nav` in `app/globals.css`.

---

## Implementation Notes

- **Components:** `components/UpperNavBar.tsx`, `components/LowerNavBar.tsx`
- **Config:** `lib/nav-config.ts`
- **CSS:** `app/globals.css` — classes `.upper-nav`, `.lower-nav`, `.nav-slot`, `.nav--faded`
- **Settings overlay:** `components/SettingsOverlay.tsx`
- **Login modal:** Lives inside `LowerNavBar.tsx` — triggered when NBLS5 is tapped while logged out
- **Both bars** are included in `app/(main)/layout.tsx` and `app/(post)/layout.tsx`
