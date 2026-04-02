/**
 * nav-config.ts — Navigation slot configuration for all named layouts.
 *
 * This is the TypeScript source of truth that UpperNavBar and LowerNavBar read.
 * The human-readable spec lives in docs/Navigation.md — keep them in sync.
 *
 * Slot numbering:
 *   Lower bar: NBLS1 = index 0 … NBLS5 = index 4
 *   Upper bar: NBUS1 = index 0 … NBUS5 = index 4
 */

// ─── Slot definitions ────────────────────────────────────────────────────────

export type SlotType =
  | { kind: 'empty' }
  | { kind: 'link';         href: string; label: string; icon: NavIcon; hideLabel?: boolean }
  | { kind: 'action';       action: NavAction; label: string; icon: NavIcon; hideLabel?: boolean }
  | { kind: 'text-link';    href: string; text: string }   // text only, no icon (e.g. SEND FEEDBACK)
  | { kind: 'wolfbot' }           // renders WolfBotIcon, links to /wolfbot
  | { kind: 'account' }           // smart: account link (logged in) or sign-in modal (logged out)
  | { kind: 'write-plus' }        // + icon, no label, hidden when logged out
  | { kind: 'profile-link' }      // UserCircle icon, no label, links to current user's profile
  | { kind: 'more-pages' }        // opens More Pages panel; becomes close button when panel is open
  | { kind: 'feed-logo' }         // circular wolf logo, links to / (home feed)
  | { kind: 'wolfman-logo' }      // Wolfman wordmark image, links to / (persists across all screens)

// Named icons — maps to Lucide icon names in the components
export type NavIcon =
  | 'Home'
  | 'Sunrise'
  | 'Pencil'
  | 'ShoppingBag'
  | 'User'
  | 'UserCircle2'
  | 'Settings'
  | 'Share2'
  | 'Download'
  | 'ArrowLeft'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'LayoutDashboard'
  | 'BadgeInfo'
  | 'Bot'
  | 'Plus'
  | 'Building2'
  | 'Rss'
  | 'BookOpen'
  | 'Menu'
  | 'X'
  | 'Search'

// Named actions handled by the nav components
export type NavAction =
  | 'open-settings'   // opens the settings overlay (theme/font)
  | 'share'           // native share / clipboard fallback
  | 'export-txt'      // exports post content as .txt
  | 'go-back'         // router.back()

// ─── Config shape ────────────────────────────────────────────────────────────

export type NavBarConfig = {
  /** Lower bar — 5 slots: index 0 = NBLS1 … index 4 = NBLS5 */
  lower: [SlotType, SlotType, SlotType, SlotType, SlotType]
  /** Upper bar — 5 slots: 30% logo | 40% feedback | 10% | 10% | 10% */
  upper: [SlotType, SlotType, SlotType, SlotType, SlotType]
  /** If true, both bars fade to 0% opacity after 2s inactivity */
  fadeOnInactivity?: boolean
  /** If true, both bars are hidden entirely (used for auth pages) */
  hideBars?: boolean
}

export type NavConfigKey = 'standard' | 'journal-reading' | 'writing' | 'auth' | 'admin'

// ─── Shared slot shorthands ───────────────────────────────────────────────────

const EMPTY: SlotType         = { kind: 'empty' }
const WOLFBOT: SlotType       = { kind: 'link', href: '/wolfbot', label: 'search', icon: 'Search', hideLabel: true }
const ACCOUNT: SlotType       = { kind: 'account' }
const WRITE_PLUS: SlotType    = { kind: 'write-plus' }
const PROFILE_LINK: SlotType  = { kind: 'profile-link' }
const MORE_PAGES: SlotType    = { kind: 'more-pages' }
const WOLFMAN_LOGO: SlotType  = { kind: 'wolfman-logo' }

const FEED: SlotType      = { kind: 'link', href: '/',               label: 'feed',    icon: 'Rss' }
const FEED_LOGO: SlotType = { kind: 'feed-logo' }
const ABOUT: SlotType     = { kind: 'link', href: '/about',          label: 'about',   icon: 'BadgeInfo', hideLabel: true }
const DISCOVER: SlotType  = { kind: 'link', href: '/discover',       label: 'discover', icon: 'BadgeInfo', hideLabel: true }
const ADMIN: SlotType     = { kind: 'link', href: '/admin',          label: 'admin',   icon: 'LayoutDashboard' }
const BETA_LINK: SlotType = { kind: 'link', href: '/beta',           label: 'beta',    icon: 'Building2',  hideLabel: true }
const SETTINGS: SlotType  = { kind: 'action', action: 'open-settings', label: 'settings', icon: 'Settings', hideLabel: true }
const FEEDBACK_TEXT: SlotType = { kind: 'text-link', href: '/feedback', text: 'SEND FEEDBACK' }
const SHARE: SlotType     = { kind: 'action', action: 'share',      label: 'share',   icon: 'Share2' }
const EXPORT: SlotType    = { kind: 'action', action: 'export-txt', label: 'export',  icon: 'Download' }
const BACK: SlotType      = { kind: 'action', action: 'go-back',    label: 'back',    icon: 'ArrowLeft' }
const SHOP: SlotType      = { kind: 'link',   href: '/shop',        label: 'shop',    icon: 'ShoppingBag', hideLabel: true }

// ─── Named configurations ────────────────────────────────────────────────────

export const NAV_CONFIGS: Record<NavConfigKey, NavBarConfig> = {

  /**
   * standard
   * Home, profiles, discover, features, beta, dev, feedback, terms,
   * morning-ritual, morning-stats, shop, cart, checkout, wolfbot
   *
   * Upper: logo(30%) | feedback(40%) | new-post(10%) | experience(10%) | shop(10%)
   * Lower: wolfbot(30%) | discover(40%) | wolf-logo(10%) | profile(10%) | menu(10%)
   */
  standard: {
    upper: [WOLFMAN_LOGO, FEEDBACK_TEXT, WRITE_PLUS, SETTINGS, SHOP],
    lower: [WOLFBOT, DISCOVER, FEED_LOGO, ACCOUNT, MORE_PAGES],
  },

  /**
   * journal-reading
   * /[username]/[slug] and /posts/[slug]
   * Both bars fade to 0% opacity after 2s inactivity.
   *
   * Upper: logo(30%) | feedback(40%) | edit(10%) | experience(10%) | share(10%)
   * Lower: wolfbot(30%) | download(40%) | wolf-logo(10%) | profile(10%) | menu(10%)
   */
  'journal-reading': {
    upper: [
      WOLFMAN_LOGO,                                                               // 30%
      FEEDBACK_TEXT,                                                              // 40%
      { kind: 'link', href: '', label: 'edit', icon: 'Pencil', hideLabel: true }, // 10% — dynamic href
      SETTINGS,                                                                   // 10%
      SHARE,                                                                      // 10%
    ],
    lower: [
      WOLFBOT,       // NBLS1 — 30%
      EXPORT,        // NBLS2 — 40% — download data
      FEED_LOGO,     // NBLS3 — 10% — wolf logo, links to feed
      ACCOUNT,       // NBLS4 — 10%
      MORE_PAGES,    // NBLS5 — 10%
    ],
    fadeOnInactivity: true,
  },

  /**
   * writing
   * /write and /edit/[id]
   *
   * Upper: logo(30%) | feedback(40%) | empty | empty | empty
   * Lower: back(30%) | empty | empty | empty | empty
   */
  writing: {
    upper: [WOLFMAN_LOGO, FEEDBACK_TEXT, EMPTY, EMPTY, EMPTY],
    lower: [BACK, EMPTY, EMPTY, EMPTY, EMPTY],
  },

  /**
   * auth
   * /login and /register — both bars hidden entirely
   */
  auth: {
    upper: [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    lower: [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    hideBars: true,
  },

  /**
   * admin
   * /admin and /admin/*
   */
  admin: {
    upper: [WOLFMAN_LOGO, FEEDBACK_TEXT, WRITE_PLUS, SETTINGS, SHOP],
    lower: [WOLFBOT, DISCOVER, FEED_LOGO, PROFILE_LINK, MORE_PAGES],
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

// Known first-path-segments that are NOT [username]/[slug] journal routes.
const KNOWN_PREFIXES = new Set([
  'admin', 'edit', 'write', 'account', 'settings', 'shop', 'cart',
  'checkout', 'login', 'register', 'about', 'morning-ritual',
  'morning-stats', 'intentions', 'feedback', 'beta', 'dev',
  'features', 'terms', 'discover', 'investment', 'rituals', 'achievements', 'api', 'posts', 'wolfbot',
  'journaling', 'scores',
])

function isJournalReadingRoute(pathname: string): boolean {
  if (pathname.startsWith('/posts/')) return true
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 2 && !KNOWN_PREFIXES.has(segments[0])
}
