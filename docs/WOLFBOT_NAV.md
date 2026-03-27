# WOLFBOT_NAV — Custom Nav Menu Developer Reference

This document is the single source of truth for building context-sensitive WOLF|BOT nav menus in the bottom dome navigation.

All pages fall back to the **default state** automatically. A **custom state** is only needed when a specific route requires a different set of actions.

---

## How it works

The bottom nav dome (`wolf-panel`) renders differently based on the current route:

- **Default state** — 5 arc buttons for site-wide navigation. Rendered on all pages unless a custom state is defined.
- **Custom state** — a different set of arc buttons (and optional discrete bottom buttons) tied to a specific route. The wolf trigger button swaps to the WOLF|BOT robot face to signal the context change.

---

## Default State

### Trigger button
The `wolf-btn` at the bottom-centre of the nav bar. Renders `<WolfLogo size={64} />` — a theme-aware SVG of the Wolfman wolf. Has a gentle pulse animation (`pulse` keyframes, 5s infinite).

### Arc buttons

| Slot | CSS class | Lucide icon | Label | Action | Angle | left % | top % |
|------|-----------|-------------|-------|--------|-------|--------|-------|
| 1 | `wpb-1` | `SlidersHorizontal` | experience | Opens settings overlay | 160° | 17.1% | 38.0% |
| 2 | `wpb-2` | `Layers` | features | Navigate to `/features` | 125° | 27.1% | 17.2% |
| 3 | `wpb-3` | `Home` | journal | Navigate to `/` | 90° | 50.0% | 12.5% |
| 4 | `wpb-4` | `User` / avatar | account / first name | Navigate to `/account` (or open login) | 55° | 72.9% | 17.2% |
| 5 | `wpb-5` | `LayoutList` | more | Opens more-pages overlay | 20° | 82.9% | 38.0% |

### WOLF|BOT face
When the dome is open, the WOLF|BOT robot face appears at `left: 50%; top: 33%` inside the dome. It shows "hello. where to?" then transitions to "...zzz" after 5s. The dome auto-closes after 10s. The face is a placeholder SVG — it will be replaced with real assets in issue #161.

---

## Arc Position Formula

The dome is a full circle: `120vw × 120vw`, `border-radius: 50%`. Its centre is anchored at the bottom-centre of the viewport:

```css
bottom: -60vw;   /* bottom edge 60vw below viewport — circle centre at viewport bottom */
left: 50%;
```

To place a button at angle θ (degrees from horizontal, counter-clockwise) at radius r (in vw):

```
left = (60 + r · cos(θ)) / 120 · 100%
top  = (60 − r · sin(θ)) / 120 · 100%
```

### Radii in use
| Slot | Radius |
|------|--------|
| Side buttons (wpb-1, wpb-5) | 42vw |
| Mid buttons (wpb-2, wpb-4) | 48vw |
| Peak button (wpb-3) | 45vw |

### Reference: 5-button arc (current default)
| Slot | Angle | r | left % | top % |
|------|-------|---|--------|-------|
| 1 | 160° | 42 | 17.1% | 38.0% |
| 2 | 125° | 48 | 27.1% | 17.2% |
| 3 |  90° | 45 | 50.0% | 12.5% |
| 4 |  55° | 48 | 72.9% | 17.2% |
| 5 |  20° | 42 | 82.9% | 38.0% |

### Reference: 5-button arc with discrete bottom buttons
Use this layout when adding prev/next or other action buttons at the base of the dome:

| Slot | Angle | r | left % | top % | Note |
|------|-------|---|--------|-------|------|
| 1 | 160° | 42 | 17.1% | 38.0% | |
| 2 | 125° | 48 | 27.1% | 17.2% | |
| 3 |  90° | 45 | 50.0% | 12.5% | |
| 4 |  55° | 48 | 72.9% | 17.2% | |
| 5 |  20° | 42 | 82.9% | 38.0% | |
| prev | — | — | 22.0% | 62.0% | Discrete bottom-left |
| next | — | — | 78.0% | 62.0% | Discrete bottom-right |

---

## How to add a custom state

### Step 1 — Detect the route

In `components/NavBar.tsx`, add a boolean using `usePathname()`:

```tsx
const pathname = usePathname()
const segments = pathname.split('/').filter(Boolean)

// Example: journal reading page is a 2-segment route not matching known prefixes
const isJournalReadingPage = segments.length === 2 && !KNOWN_PREFIXES.has(segments[0])
```

Use the naming convention `is[PageName]Page`.

### Step 2 — Swap the trigger button

Inside the wolf button, conditionally render the WOLF|BOT face instead of the wolf logo:

```tsx
<button className="nav-btn nav-btn--center wolf-btn" onClick={...}>
  {isJournalReadingPage
    ? <WolfBotFaceSVG />   // WOLF|BOT robot face (custom context signal)
    : <WolfLogo size={64} priority />
  }
</button>
```

### Step 3 — Conditionally render arc buttons

Inside `.wolf-panel-icons`, switch between button sets:

```tsx
<div className="wolf-panel-icons">
  {isJournalReadingPage ? (
    <>
      {/* Custom arc buttons — see worked example below */}
    </>
  ) : (
    <>
      {/* Default 5-button arc */}
      <button className="wolf-panel-btn wpb-1" ...>...</button>
      ...
    </>
  )}
</div>
```

### Step 4 — Add discrete bottom buttons (optional)

Discrete bottom buttons sit at the base of the dome, outside the main arc. Add them as absolutely positioned elements inside `.wolf-panel-icons`:

```tsx
{isJournalReadingPage && (
  <>
    <button className="wolf-panel-btn wpb-prev" aria-label="Previous post" onClick={...}>
      <ChevronLeft size={22} />
      <span>prev</span>
    </button>
    <button className="wolf-panel-btn wpb-next" aria-label="Next post" onClick={...}>
      <ChevronRight size={22} />
      <span>next</span>
    </button>
  </>
)}
```

CSS for discrete buttons:
```css
.wpb-prev { left: 22%; top: 62%; }
.wpb-next { left: 78%; top: 62%; }
```

### Step 5 — Add a context wrapper class (optional)

For CSS scoping, add a modifier class to `.wolf-panel`:

```tsx
<div className={`wolf-panel${wolfPanelOpen ? ' is-open' : ''}${isJournalReadingPage ? ' wolf-panel--journal' : ''}`}>
```

Use the naming convention `wolf-panel--[context]`.

### Step 6 — Register the custom state in this document

Add a row to the Registered Custom States table below.

---

## Naming conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Route detection boolean | `is[PageName]Page` | `isJournalReadingPage` |
| Arc button CSS class | `wpb-[N]` (default) or `wpb-[action]` (custom) | `wpb-1`, `wpb-edit`, `wpb-prev` |
| Discrete button CSS class | `wpb-[action]` | `wpb-prev`, `wpb-next` |
| Wolf-panel context modifier | `wolf-panel--[context]` | `wolf-panel--journal` |
| Custom button set component | `[Context]NavButtons` (if extracted) | `JournalNavButtons` |

---

## Registered Custom States

| Route pattern | Context name | Wolf-panel class | Issue | Status |
|---------------|-------------|-----------------|-------|--------|
| `/[username]/[slug]` | journal-reading | `wolf-panel--journal` | #176 | planned |

---

## Worked Example: Journal Reading Page

> Implemented in issue #176. This section will be completed when #176 is built.

**Route:** `/[username]/[slug]`
**Detection:** `segments.length === 2 && !KNOWN_PREFIXES.has(segments[0])`

### Arc buttons (left → right)

| Slot | CSS class | Icon | Label | Action | Angle |
|------|-----------|------|-------|--------|-------|
| 1 | `wpb-edit` | `Pencil` | edit | Navigate to `/edit/[id]` | 160° |
| 2 | `wpb-export` | `Download` | export | Export post as text (see #168) | 125° |
| 3 | `wpb-share` | `Share2` | share | Share this post | 90° |
| 4 | `wpb-profile` | `User` | profile | Navigate to `/[username]` | 55° |
| 5 | `wpb-back` | `ArrowLeft` | feed | Navigate to `/` | 20° |

### Discrete bottom buttons

| Slot | CSS class | Icon | Label | Action |
|------|-----------|------|-------|--------|
| Bottom-left | `wpb-prev` | `ChevronLeft` | prev | Previous post in feed |
| Bottom-right | `wpb-next` | `ChevronRight` | next | Next post in feed |

Prev/next use the adjacent post API: `GET /api/posts/[id]/adjacent` (see #177).
