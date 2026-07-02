// Edge-safe — imported by middleware.ts, so this module must never import
// the database or any Node-only dependency.
//
// Two jobs:
// 1. Usernames that can never be registered (they'd shadow a route).
// 2. Middleware routing: a two-segment path whose first segment is NOT in
//    this set is treated as a journal reading page (/[username]/[slug]).
//    Every top-level route segment in app/ must therefore be listed here —
//    add new top-level routes to this set when you create them.
export const RESERVED_USERNAMES = new Set([
  // routes
  'account', 'achievements', 'admin', 'api', 'beta', 'car', 'career',
  'cart', 'checkout', 'data-policy', 'dev', 'discover', 'edit',
  'features', 'feed', 'feedback', 'intentions', 'journal', 'journaling',
  'login', 'morning-ritual', 'morning-stats', 'onboarding', 'posts',
  'reader', 'register', 'rituals', 'scores', 'settings', 'shop',
  'subscriptions', 'terms', 'today', 'wolfbot', 'write',
  // reserved words and future routes
  'about', 'help', 'null', 'privacy', 'profile', 'stats', 'support',
  'undefined', 'wolfman',
])
