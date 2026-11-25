import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
import NextAuth from 'next-auth';
import createMiddleware from 'next-intl/middleware';

import { authConfig } from '@/auth.config';
import { routing } from '@/i18n/routing';

// Next 16 name for the request proxy (was middleware.ts). Locale prefix is
// always on, so a bare `/` is redirected to `/uk` here.
const intl = createMiddleware(routing);

// JWT-only Auth.js instance (no providers, no DB): cheap role gating before the page renders.
// The `sessions` row (one active session, blocked users) is checked by lib/auth/session.ts
// on every protected page and server action.
const { auth } = NextAuth(authConfig);

const PROTECTED = /^\/(uk|pl|en)\/(cabinet|admin|change-password)(\/|$)/;

const authProxy = auth((req) => {
  const m = req.nextUrl.pathname.match(PROTECTED);
  if (m) {
    const [, locale, area] = m;
    const role = req.auth?.user?.role;
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
    // Failure point (5.1_UserFlow): a student opening /admin lands on /cabinet.
    if (area === 'admin' && role !== 'admin') {
      return NextResponse.redirect(new URL(`/${locale}/cabinet`, req.url));
    }
    // The admin may open course and lesson pages (preview); only the student's own
    // «Мої курси» (/cabinet), certificates, help and settings send the admin back to the admin panel.
    const studentOnly =
      /^\/[a-z]{2}\/cabinet(\/(settings|certificates|help))?\/?$/.test(
        req.nextUrl.pathname,
      );
    if (area === 'cabinet' && role === 'admin' && studentOnly) {
      return NextResponse.redirect(new URL(`/${locale}/admin`, req.url));
    }
  }
  return intl(req);
});

/** D-13: the site lives on the bare domain; `www.` answers 301 to the same path there. */
const WWW = /^www\./i;

export default function proxy(req: NextRequest, ev: NextFetchEvent) {
  const host = (
    req.headers.get('x-forwarded-host') ??
    req.headers.get('host') ??
    ''
  )
    .split(',')[0]
    .trim();
  if (WWW.test(host)) {
    const to = new URL(req.nextUrl.pathname + req.nextUrl.search, 'https://x');
    to.host = host.replace(WWW, '');
    return NextResponse.redirect(to, 301);
  }
  // D-12: Auth.js runs only where a session matters. On public pages it set
  // `authjs.csrf-token` / `callback-url` for every anonymous visitor on cached responses.
  if (PROTECTED.test(req.nextUrl.pathname)) {
    // auth() typed for route handlers too; as a proxy it takes (req, event).
    return (
      authProxy as unknown as (r: NextRequest, e: NextFetchEvent) => Response
    )(req, ev);
  }
  return intl(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
