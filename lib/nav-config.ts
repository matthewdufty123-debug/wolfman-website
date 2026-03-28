/**
 * nav-config.ts — Navigation slot configuration for all named layouts.
 *
 * This is the TypeScript source of truth that UpperNavBar and LowerNavBar read.
 * The human-readable spec lives in docs/Navigation.md — keep them in sync.
 *
 * Slot numbering:
 *   Lower bar: NBLS1 = index 0 … NBLS6 = index 5
 *   Upper bar: NBUS1 = index 0 … NBUS5 = index 4
 */

// ─── Slot definitions ────────────────────────────────────────────────────────

export type SlotType =
  | { kind: 'empty' }
  | { kind: 'link';    href: string; label: string; icon: NavIcon }
  | { kind: 'action';  action: NavAction; label: string; icon: NavIcon }
  | { kind: 'wolfbot' }           // always NBLS6 — renders WolfBotIcon, links to /wolfbot
  | { kind: 'prev-post' }         // journal-reading upper bar left
  | { kind: 'next-post' }         // journal-reading upper bar right
  | { kind: 'account' }           // smart slot: account link (logged in) or sign-in modal (logged out)
  | { kind: 'write' }             // smart slot: write link (logged in) or hidden (logged out)

// Named icons — maps to Lucide icon names in the components
export type NavIcon =
  | 'Home'
  | 'Sunrise'
  | 'Pencil'
  | 'ShoppingBag'
  | 'User'
  | 'Settings'
  | 'Share2'
  | 'Download'
  | 'ArrowLeft'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'LayoutDashboard'
  | 'BadgeInfo'
  | 'Bot'

// Named actions handled by the nav components
export type NavAction =
  | 'open-settings'   // opens the settings overlay (theme/font)
  | 'share'           // native share / clipboard fallback
  | 'export-txt'      // exports post content as .txt
  | 'go-back'         // router.back()

// ─── Config shape ────────────────────────────────────────────────────────────

export type NavBarConfig = {
  /** Lower bar — 6 slots: index 0 = NBLS1 … index 5 = NBLS6 */
  lower: [SlotType, SlotType, SlotType, SlotType, SlotType, SlotType]
  /** Upper bar — 5 slots: index 0 = NBUS1 … index 4 = NBUS5 */
  upper: [SlotType, SlotType, SlotType, SlotType, SlotType]
  /** If true, both bars fade to 25% opacity after 3s inactivity */
  fadeOnInactivity?: boolean
  /** If true, both bars are hidden entirely (used for auth pages) */
  hideBars?: boolean
}

export type NavConfigKey = 'standard' | 'journal-reading' | 'writing' | 'auth' | 'admin'

// ─── Shared slot shorthands ───────────────────────────────────────────────────

const EMPTY: SlotType = { kind: 'empty' }
const WOLFBOT: SlotType = { kind: 'wolfbot' }
const FEED: SlotType = { kind: 'link', href: '/', label: 'feed', icon: 'Home' }
const RITUALS: SlotType = { kind: 'link', href: '/morning-ritual', label: 'rituals', icon: 'Sunrise' }
const SHOP: SlotType = { kind: 'link', href: '/shop', label: 'shop', icon: 'ShoppingBag' }
const ACCOUNT: SlotType = { kind: 'account' }
const WRITE: SlotType = { kind: 'write' }
const SETTINGS: SlotType = { kind: 'action', action: 'open-settings', label: 'settings', icon: 'Settings' }
const BETA: SlotType = { kind: 'link', href: '/beta', label: 'BETA', icon: 'BadgeInfo' }
const SHARE: SlotType = { kind: 'action', action: 'share', label: 'share', icon: 'Share2' }
const EXPORT: SlotType = { kind: 'action', action: 'export-txt', label: 'export', icon: 'Download' }
const BACK: SlotType = { kind: 'action', action: 'go-back', label: 'back', icon: 'ArrowLeft' }
const PREV_POST: SlotType = { kind: 'prev-post' }
const NEXT_POST: SlotType = { kind: 'next-post' }
const ADMIN: SlotType = { kind: 'link', href: '/admin', label: 'admin', icon: 'LayoutDashboard' }

// ─── Named configurations ────────────────────────────────────────────────────

export const NAV_CONFIGS: Record<NavConfigKey, NavBarConfig> = {

  /**
   * standard
   * Home, profiles, about, features, beta, dev, feedback, terms,
   * morning-ritual, morning-stats, shop, cart, checkout, wolfbot
   */
  standard: {
    lower: [FEED, RITUALS, WRITE, SHOP, ACCOUNT, WOLFBOT],
    //       NBLS1  NBLS2   NBLS3  NBLS4  NBLS5    NBLS6
    upper: [EMPTY, EMPTY, BETA, EMPTY, SETTINGS],
    //       NBUS1  NBUS2  NBUS3  NBUS4  NBUS5
  },

  /**
   * journal-reading
   * /[username]/[slug] and /posts/[slug]
   * Both bars fade to 25% opacity after 3s inactivity.
   */
  'journal-reading': {
    lower: [
      FEED,    // NBLS1 — back to home
      { kind: 'link', href: '', label: 'profile', icon: 'User' }, // NBLS2 — author profile (href set dynamically)
      SHARE,   // NBLS3
      { kind: 'link', href: '', label: 'edit', icon: 'Pencil' },  // NBLS4 — edit (href set dynamically)
      EXPORT,  // NBLS5
      WOLFBOT, // NBLS6
    ],
    upper: [PREV_POST, EMPTY, EMPTY, EMPTY, NEXT_POST],
    fadeOnInactivity: true,
  },

  /**
   * writing
   * /write and /edit/[id]
   */
  writing: {
    lower: [BACK, EMPTY, EMPTY, EMPTY, SETTINGS, WOLFBOT],
    //       NBLS1  NBLS2  NBLS3  NBLS4  NBLS5     NBLS6
    upper: [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  },

  /**
   * auth
   * /login and /register — both bars hidden entirely
   */
  auth: {
    lower: [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    upper: [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    hideBars: true,
  },

  /**
   * admin
   * /admin and /admin/*
   */
  admin: {
    lower: [FEED, ADMIN, EMPTY, EMPTY, ACCOUNT, WOLFBOT],
    //       NBLS1  NBLS2   NBLS3  NBLS4  NBLS5    NBLS6
    upper: [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  },
}

// ─── Route → config resolver ─────────────────────────────────────────────────

/**
 * Returns the config key for a given pathname.
 * Rules are checked in order — first match wins.
 */
export function getNavConfigKey(pathname: string): NavConfigKey {
  if (pathname === '/login' || pathname === '/register') return 'auth'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/write') || pathname.startsWith('/edit/')) return 'writing'
  if (isJournalReadingRoute(pathname)) return 'journal-reading'
  return 'standard'
}

// Known first-path-segments that are NOT journal slugs.
// When a route is /[segment1]/[segment2] and segment1 is NOT in this set,
// it is treated as /[username]/[slug] → journal-reading.
const KNOWN_PREFIXES = new Set([
  'admin', 'edit', 'write', 'account', 'settings', 'shop', 'cart',
  'checkout', 'login', 'register', 'about', 'morning-ritual',
  'morning-stats', 'intentions', 'feedback', 'beta', 'dev',
  'features', 'terms', 'discover', 'api', 'posts', 'wolfbot',
])

function isJournalReadingRoute(pathname: string): boolean {
  if (pathname.startsWith('/posts/')) return true
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 2 && !KNOWN_PREFIXES.has(segments[0])
}
