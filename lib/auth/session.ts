import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { and, desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { auth } from '@/auth';
import type { Locale } from '@/i18n/routing';
import { db } from '@/lib/db/client';
import { loginEvents, sessions, users, type Role } from '@/lib/db/schema';
import { adminInbox, sendEmail } from '@/lib/email/send';

import { readGeo } from './geo';
import { attempt, forgive, LIMITS } from './rateLimit';

const SUSPICIOUS_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Compared against when the e-mail is unknown (or has no password yet), so a miss costs the
 * same bcrypt time as a wrong password — no account enumeration by timing. Hash of a random
 * throwaway string, computed once per process.
 */
let dummyHash: string | null = null;
function getDummyHash(): string {
  dummyHash ??= bcrypt.hashSync(randomUUID(), 12);
  return dummyHash;
}

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  sid: string;
};

/**
 * Credentials check + one active session (FR-14): a successful login replaces the user's
 * `sessions.sid`, so every older JWT stops matching and its next protected request is sent
 * to /login. Records a `login_events` row; a different country within 24 h of the previous
 * login is flagged and both the student and the admin get an e-mail (Decisions 19.10.2026).
 */
export async function openSession(
  input: { email: string; password: string },
  headers: Headers,
): Promise<SessionUser | 'rate' | null> {
  const geo = readGeo(headers);
  const emailKey = `login:email:${input.email}`;
  const ipKey = `login:ip:${geo.ip ?? 'unknown'}`;
  // Record first, then count (atomic under concurrency).
  const tried = await attempt([
    { key: emailKey, max: LIMITS.loginEmail },
    { key: ipKey, max: LIMITS.loginIp },
  ]);
  if (tried.limited) return 'rate';

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email));
  // Always one bcrypt compare: the real hash, or the dummy one (same cost) for a miss.
  const ok = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? getDummyHash(),
  );
  if (!user?.passwordHash || !ok) return null;
  // A blocked account answers exactly like a wrong password (no account-state oracle);
  // the attempt stays counted.
  if (user.blockedAt) return null;
  await forgive(tried.ids, emailKey);

  const [last] = await db
    .select()
    .from(loginEvents)
    .where(eq(loginEvents.userId, user.id))
    .orderBy(desc(loginEvents.createdAt))
    .limit(1);

  const suspicious =
    user.role === 'student' &&
    last !== undefined &&
    Date.now() - last.createdAt.getTime() < SUSPICIOUS_WINDOW_MS &&
    !!last.country &&
    !!geo.country &&
    last.country !== geo.country;

  const sid = randomUUID();
  await db
    .insert(sessions)
    .values({ userId: user.id, sid })
    .onConflictDoUpdate({
      target: sessions.userId,
      set: { sid, createdAt: new Date() },
    });
  await db.insert(loginEvents).values({
    userId: user.id,
    device: geo.device,
    city: geo.city,
    country: geo.country,
    suspicious,
  });

  if (suspicious && last) {
    const when = new Date().toLocaleString('uk-UA', {
      timeZone: 'Europe/Warsaw',
    });
    const previous = `${last.country}, ${last.createdAt.toLocaleString('uk-UA', { timeZone: 'Europe/Warsaw' })}`;
    const country = geo.country ?? '?';
    try {
      await sendEmail({
        to: user.email,
        template: 'suspiciousLogin',
        vars: { when, country, previous },
      });
      const admin = adminInbox();
      if (admin)
        await sendEmail({
          to: admin,
          template: 'suspiciousLoginAdmin',
          vars: { email: user.email, when, country, previous },
        });
    } catch {
      console.error('[auth] suspicious-login e-mail failed');
    }
  }

  return { id: user.id, email: user.email, role: user.role, sid };
}

export type ValidSession =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
        role: Role;
        name: string | null;
        phone: string | null;
        locale: Locale;
        mustChangePassword: boolean;
      };
    }
  | { ok: false; reason: 'none' | 'ended' | 'blocked' };

/** JWT → `sessions` row → user. Cached per request. */
export const getValidSession = cache(async (): Promise<ValidSession> => {
  const session = await auth();
  if (!session?.user?.id || !session.sid) return { ok: false, reason: 'none' };

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      name: users.name,
      phone: users.phone,
      locale: users.locale,
      mustChangePassword: users.mustChangePassword,
      blockedAt: users.blockedAt,
      sid: sessions.sid,
    })
    .from(users)
    .leftJoin(sessions, eq(sessions.userId, users.id))
    .where(eq(users.id, session.user.id));

  if (!row) return { ok: false, reason: 'none' };
  if (row.blockedAt) return { ok: false, reason: 'blocked' };
  if (row.sid !== session.sid) return { ok: false, reason: 'ended' };

  return {
    ok: true,
    user: {
      id: row.id,
      email: row.email,
      role: row.role,
      name: row.name,
      phone: row.phone,
      locale: row.locale,
      mustChangePassword: row.mustChangePassword,
    },
  };
});

export function homeFor(locale: Locale, role: Role): string {
  return role === 'admin' ? `/${locale}/admin` : `/${locale}/cabinet`;
}

/**
 * Guard for every protected page. Wrong role → the role's own home (a student opening
 * /admin lands on /cabinet). A temporary password → /change-password first. `role` may be a
 * list: the lesson pages also let the admin in (read-only preview of every course).
 */
export async function requireUser(
  locale: Locale,
  role: Role | readonly Role[],
  opts: { allowMustChange?: boolean } = {},
) {
  const s = await getValidSession();
  if (!s.ok) {
    redirect(
      `/${locale}/login${s.reason === 'none' ? '' : `?reason=${s.reason}`}`,
    );
  }
  if (s.user.mustChangePassword && !opts.allowMustChange) {
    redirect(`/${locale}/change-password`);
  }
  const allowed: readonly Role[] = typeof role === 'string' ? [role] : role;
  if (!allowed.includes(s.user.role)) redirect(homeFor(locale, s.user.role));
  return s.user;
}

/**
 * Guard for server actions: throws instead of redirecting to a page. A user still on a
 * temporary password may only change it (`allowMustChange`) or log out (logout does not use
 * this guard).
 */
export async function requireActionUser(
  role?: Role,
  opts: { allowMustChange?: boolean } = {},
) {
  const s = await getValidSession();
  if (!s.ok) throw new Error('unauthorized');
  if (s.user.mustChangePassword && !opts.allowMustChange)
    throw new Error('password change required');
  if (role && s.user.role !== role) throw new Error('forbidden');
  return s.user;
}

/** Ends the active session of a user (logout, block, password reset). */
export async function closeSession(userId: string, sid?: string) {
  await db
    .delete(sessions)
    .where(
      sid
        ? and(eq(sessions.userId, userId), eq(sessions.sid, sid))
        : eq(sessions.userId, userId),
    );
}
