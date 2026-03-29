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
  | { kind: 'prev-post' }         // journal-reading upper bar left
  | { kind: 'next-post' }         // journal-reading upper bar right
  | { kind: 'account' }           // smart: account link (logged in) or sign-in modal (logged out)
  | { kind: 'write-plus' }        // + icon, no label, hidden when logged out
  | { kind: 'profile-link' }      // UserCircle icon, no label, links to current user's profile
  | { kind: 'more-pages' }        // opens More Pages panel; becomes close button when panel is open
  | { kind: 'feed-logo' }         // circular wolf logo, links to / (home feed)

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
  /** Upper bar — 5 slots: index 0 = NBUS1 … index 4 = NBUS5 */
  upper: [SlotType, SlotType, SlotType, SlotType, SlotType]
  /** If true, both bars fade to 25% opacity after 3s inactivity */
  fadeOnInactivity?: boolean
  /** If true, both bars are hidden entirely (used for auth pages) */
  hideBars?: boolean
}

export type NavConfigKey = 'standard' | 'journal-reading' | 'writing' | 'auth' | 'admin'

// ─── Shared slot shorthands ───────────────────────────────────────────────────

const EMPTY: SlotType         = { kind: 'empty' }
const WOLFBOT: SlotType       = { kind: 'wolfbot' }
const ACCOUNT: SlotType       = { kind: 'account' }
const WRITE_PLUS: SlotType    = { kind: 'write-plus' }
const PROFILE_LINK: SlotType  = { kind: 'profile-link' }
const MORE_PAGES: SlotType    = { kind: 'more-pages' }
const PREV_POST: SlotType     = { kind: 'prev-post' }
const NEXT_POST: SlotType     = { kind: 'next-post' }

const FEED: SlotType      = { kind: 'link', href: '/',               label: 'feed',    icon: 'Rss' }
const FEED_LOGO: SlotType = { kind: 'feed-logo' }
const GUIDE: SlotType     = { kind: 'link', href: '/guide',          label: 'guide',   icon: 'BookOpen' }
const ADMIN: SlotType     = { kind: 'link', href: '/admin',          label: 'admin',   icon: 'LayoutDashboard' }
const BETA_LINK: SlotType = { kind: 'link', href: '/beta',           label: 'beta',    icon: 'Building2',  hideLabel: true }
const SETTINGS: SlotType  = { kind: 'action', action: 'open-settings', label: 'settings', icon: 'Settings', hideLabel: true }
const FEEDBACK_TEXT: SlotType = { kind: 'text-link', href: '/feedback', text: 'SEND FEEDBACK' }
const SHARE: SlotType     = { kind: 'action', action: 'share',      label: 'share',   icon: 'Share2' }
const EXPORT: SlotType    = { kind: 'action', action: 'export-txt', label: 'export',  icon: 'Download' }
const BACK: SlotType      = { kind: 'action', action: 'go-back',    label: 'back',    icon: 'ArrowLeft' }

// ─── Named configurations ────────────────────────────────────────────────────

export const NAV_CONFIGS: Record<NavConfigKey, NavBarConfig> = {

  /**
   * standard
   * Home, profiles, about, features, beta, dev, feedback, terms,
   * morning-ritual, morning-stats, shop, cart, checkout, wolfbot, guide
   */
  standard: {
    upper: [WRITE_PLUS, EMPTY, FEEDBACK_TEXT, BETA_LINK, SETTINGS],
    //       NBUS1        NBUS2         NBUS3           NBUS4      NBUS5
    lower: [WOLFBOT, GUIDE, FEED_LOGO, ACCOUNT, MORE_PAGES],
    //       NBLS1    NBLS2  NBLS3      NBLS4    NBLS5
  },

  /**
   * journal-reading
   * /[username]/[slug] and /posts/[slug]
   * Both bars fade to 25% opacity after 3s inactivity.
   *
   * Upper: NBUS1=prev  NBUS2=write+  NBUS3=feedback  NBUS4=edit  NBUS5=next
   * Lower: NBLS1=share NBLS2=export  NBLS3=feed-logo NBLS4=profile-link NBLS5=more-pages
   */
  'journal-reading': {
    upper: [
      PREV_POST,                                                           // NBUS1
      WRITE_PLUS,                                                          // NBUS2
      FEEDBACK_TEXT,                                                       // NBUS3
      { kind: 'link', href: '', label: 'edit', icon: 'Pencil', hideLabel: true }, // NBUS4 — dynamic href
      NEXT_POST,                                                           // NBUS5
    ],
    lower: [
      SHARE,         // NBLS1
      EXPORT,        // NBLS2
      FEED_LOGO,     // NBLS3 — wolf logo, links to feed
      PROFILE_LINK,  // NBLS4
      MORE_PAGES,    // NBLS5
    ],
    fadeOnInactivity: true,
  },

  /**
   * writing
   * /write and /edit/[id]
   */
  writing: {
    upper: [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    lower: [BACK, EMPTY, EMPTY, SETTINGS, MORE_PAGES],
    //       NBLS1  NBLS2  NBLS3  NBLS4    NBLS5
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
    upper: [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    lower: [FEED, ADMIN, EMPTY, ACCOUNT, MORE_PAGES],
    //       NBLS1  NBLS2  NBLS3  NBLS4    NBLS5
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
  'features', 'terms', 'discover', 'investment', 'rituals', 'achievements', 'api', 'posts', 'wolfbot', 'guide',
])

function isJournalReadingRoute(pathname: string): boolean {
  if (pathname.startsWith('/posts/')) return true
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 2 && !KNOWN_PREFIXES.has(segments[0])
}
