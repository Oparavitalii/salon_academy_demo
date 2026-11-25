import { createHash } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authThrottle, loginEvents, sessions, users } from '@/lib/db/schema';

import { resetDb, type TestDb } from '../helpers/Test_Db';

/**
 * Login and session rules (FR-13, FR-14, B-82): password tokens, the DB throttle, credentials,
 * blocked accounts, one active session, the suspicious-country letter — real SQL on PGlite.
 */
vi.mock('@/lib/db/client', async () => {
  const { makeTestDb } = await import('../helpers/Test_Db');
  return { db: await makeTestDb(), hasDb: true };
});
let jwt: { user?: { id: string }; sid?: string } | null = null;
vi.mock('@/auth', () => ({ auth: async () => jwt }));
const sendEmail = vi.fn(async (_m: { to: string; template: string }) => {});
vi.mock('@/lib/email/send', () => ({
  sendEmail: (m: { to: string; template: string }) => sendEmail(m),
  adminInbox: () => 'admin@example.test',
}));
let geo = {
  ip: '1.1.1.1',
  country: 'PL' as string | null,
  city: null,
  device: 'test',
};
vi.mock('@/lib/auth/geo', () => ({ readGeo: () => geo }));

const { db } = (await import('@/lib/db/client')) as unknown as { db: TestDb };
const {
  hashToken,
  newPasswordInput,
  newResetToken,
  RESET_TTL_MS,
  SET_PASSWORD_TTL_MS,
} = await import('@/lib/auth/password');
const { attempt, forgive, LIMITS } = await import('@/lib/auth/rateLimit');
const { openSession, getValidSession } = await import('@/lib/auth/session');

const EMAIL = 'anna@example.test';
const PASS = 'correct horse 1';
let anna: string;
const h = new Headers();

beforeEach(async () => {
  await resetDb(db);
  sendEmail.mockClear();
  geo = { ip: '1.1.1.1', country: 'PL', city: null, device: 'test' };
  [{ id: anna }] = await db
    .insert(users)
    .values({
      email: EMAIL,
      role: 'student',
      passwordHash: await bcrypt.hash(PASS, 4),
    })
    .returning({ id: users.id });
});
afterEach(() => vi.useRealTimers());

describe('password tokens and input', () => {
  it('only the SHA-256 of the token is stored; lifetimes 1 h (forgot) and 72 h (set password)', () => {
    const now = Date.now();
    const r = newResetToken();
    expect(r.hash).toBe(createHash('sha256').update(r.token).digest('hex'));
    expect(hashToken(r.token)).toBe(r.hash);
    expect(r.token).not.toBe(r.hash);
    expect(r.expiresAt.getTime() - now).toBeGreaterThanOrEqual(
      RESET_TTL_MS - 50,
    );
    expect(r.expiresAt.getTime() - now).toBeLessThanOrEqual(RESET_TTL_MS + 50);
    const s = newResetToken(SET_PASSWORD_TTL_MS);
    expect(Math.round((s.expiresAt.getTime() - now) / 3_600_000)).toBe(72);
    expect(newResetToken().token).not.toBe(r.token);
  });

  it('new password: at least 8 chars and both fields equal', () => {
    expect(
      newPasswordInput.safeParse({ password: 'short', repeat: 'short' })
        .success,
    ).toBe(false);
    expect(
      newPasswordInput.safeParse({
        password: 'longenough',
        repeat: 'other12345',
      }).success,
    ).toBe(false);
    expect(
      newPasswordInput.safeParse({
        password: 'longenough',
        repeat: 'longenough',
      }).success,
    ).toBe(true);
  });
});

describe('throttle (record first, then count)', () => {
  const key = 'login:email:x@example.test';

  it('the 6th e-mail attempt within a minute is limited; another key is not', async () => {
    for (let i = 0; i < LIMITS.loginEmail; i++)
      expect((await attempt([{ key, max: LIMITS.loginEmail }])).limited).toBe(
        false,
      );
    expect((await attempt([{ key, max: LIMITS.loginEmail }])).limited).toBe(
      true,
    );
    expect(
      (await attempt([{ key: 'login:email:other', max: LIMITS.loginEmail }]))
        .limited,
    ).toBe(false);
  });

  it('attempts older than the 1-minute window do not count; rows older than 1 h are deleted', async () => {
    const old = new Date(Date.now() - 2 * 60_000);
    const ancient = new Date(Date.now() - 2 * 3_600_000);
    await db
      .insert(authThrottle)
      .values([
        ...Array.from({ length: 10 }, () => ({ key, createdAt: old })),
        { key: 'login:ip:9.9.9.9', createdAt: ancient },
      ]);
    expect((await attempt([{ key, max: LIMITS.loginEmail }])).limited).toBe(
      false,
    );
    const left = await db.select().from(authThrottle);
    expect(left.some((r) => r.key === 'login:ip:9.9.9.9')).toBe(false);
  });

  it('parallel attempts cannot all slip under the limit', async () => {
    const res = await Promise.all(
      Array.from({ length: 12 }, () =>
        attempt([{ key, max: LIMITS.loginEmail }]),
      ),
    );
    expect(res.filter((r) => !r.limited).length).toBeLessThanOrEqual(
      LIMITS.loginEmail,
    );
  });

  it('forgive() clears this attempt and the e-mail’s failures', async () => {
    await attempt([{ key, max: 5 }]);
    const a = await attempt([
      { key, max: 5 },
      { key: 'login:ip:1', max: 20 },
    ]);
    await forgive(a.ids, key);
    const left = await db.select().from(authThrottle);
    expect(left.filter((r) => r.key === key)).toHaveLength(0);
  });
});

describe('openSession (login)', () => {
  it('right password → a session row; wrong password or unknown e-mail → null', async () => {
    const ok = await openSession({ email: EMAIL, password: PASS }, h);
    expect(ok).toMatchObject({ id: anna, role: 'student' });
    const [s] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, anna));
    expect(s.sid).toBe((ok as { sid: string }).sid);
    expect(
      await openSession({ email: EMAIL, password: 'wrong-pass' }, h),
    ).toBeNull();
    expect(
      await openSession({ email: 'nobody@example.test', password: PASS }, h),
    ).toBeNull();
  });

  it('an account without a password (bought, link not used yet) cannot log in', async () => {
    await db.update(users).set({ passwordHash: null });
    expect(await openSession({ email: EMAIL, password: PASS }, h)).toBeNull();
  });

  it('a blocked account answers like a wrong password', async () => {
    await db.update(users).set({ blockedAt: new Date() });
    expect(await openSession({ email: EMAIL, password: PASS }, h)).toBeNull();
    expect(await db.select().from(sessions)).toHaveLength(0);
  });

  it('after 5 wrong passwords the 6th try is «rate», even with the right password', async () => {
    for (let i = 0; i < LIMITS.loginEmail; i++)
      await openSession({ email: EMAIL, password: 'wrong-pass' }, h);
    expect(await openSession({ email: EMAIL, password: PASS }, h)).toBe('rate');
  });

  it('a successful login clears the e-mail’s failed attempts', async () => {
    for (let i = 0; i < 3; i++)
      await openSession({ email: EMAIL, password: 'wrong-pass' }, h);
    await openSession({ email: EMAIL, password: PASS }, h);
    const left = await db.select().from(authThrottle);
    expect(left.filter((r) => r.key === `login:email:${EMAIL}`)).toHaveLength(
      0,
    );
  });

  it('a login from another country within 24 h is flagged and both she and the admin are told', async () => {
    await openSession({ email: EMAIL, password: PASS }, h);
    geo = { ...geo, country: 'UA' };
    await openSession({ email: EMAIL, password: PASS }, h);
    const ev = await db
      .select()
      .from(loginEvents)
      .where(eq(loginEvents.userId, anna));
    expect(ev.filter((e) => e.suspicious)).toHaveLength(1);
    expect(sendEmail.mock.calls.map(([m]) => m.template).sort()).toEqual([
      'suspiciousLogin',
      'suspiciousLoginAdmin',
    ]);
  });
});

describe('getValidSession (one active session, FR-14)', () => {
  it('no JWT → none; current sid → ok; an older sid after a new login → ended', async () => {
    jwt = null;
    expect(await getValidSession()).toEqual({ ok: false, reason: 'none' });

    const first = (await openSession({ email: EMAIL, password: PASS }, h)) as {
      sid: string;
    };
    jwt = { user: { id: anna }, sid: first.sid };
    expect((await getValidSession()).ok).toBe(true);

    await openSession({ email: EMAIL, password: PASS }, h);
    jwt = { user: { id: anna }, sid: first.sid };
    expect(await getValidSession()).toEqual({ ok: false, reason: 'ended' });
  });

  it('a block takes effect on the next request', async () => {
    const s = (await openSession({ email: EMAIL, password: PASS }, h)) as {
      sid: string;
    };
    jwt = { user: { id: anna }, sid: s.sid };
    await db.update(users).set({ blockedAt: new Date() });
    expect(await getValidSession()).toEqual({ ok: false, reason: 'blocked' });
  });
});
