import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'
import { RESERVED_USERNAMES } from './lib/reserved-usernames'

const { auth } = NextAuth(authConfig)

// Journal reading pages (/[username]/[slug]) are statically rendered for
// anonymous readers — the sacred, CDN-cached reading experience. Logged-in
// users need the session-aware version (drafts, private journals, owner
// affordances), so their requests are rewritten to the dynamic /reader
// variant. The URL in the address bar never changes.
export default auth((req) => {
  const { pathname } = req.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  const isLoggedIn = !!req.auth?.user

  // Route protection. The wrapped-middleware form does NOT auto-enforce
  // authConfig's `authorized` callback (only the plain form does), so
  // enforce it here explicitly — same callback, same redirect as before.
  if (!authConfig.callbacks.authorized({ auth: req.auth, request: req })) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = `callbackUrl=${encodeURIComponent(req.nextUrl.href)}`
    return NextResponse.redirect(url)
  }

  // Logged-in reader on a journal page → dynamic variant
  if (
    isLoggedIn &&
    segments.length === 2 &&
    !RESERVED_USERNAMES.has(segments[0])
  ) {
    const url = req.nextUrl.clone()
    url.pathname = `/reader${pathname}`
    return NextResponse.rewrite(url)
  }

  // /reader/* is an internal target, not a public URL — send anonymous
  // visitors (and crawlers) back to the canonical journal URL
  if (!isLoggedIn && segments[0] === 'reader' && segments.length === 3) {
    const url = req.nextUrl.clone()
    url.pathname = `/${segments[1]}/${segments[2]}`
    return NextResponse.redirect(url)
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|posts).*)'],
}
