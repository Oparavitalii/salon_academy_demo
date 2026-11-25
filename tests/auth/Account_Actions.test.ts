import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { newResetToken } from '@/lib/auth/password';
import { passwordResetTokens, sessions, users } from '@/lib/db/schema';

import { resetDb, type TestDb } from '../helpers/Test_Db';

/**
 * Account actions (FR-13): «забули пароль» answers the same for everyone and sends a link only
 * to a real, open account; the reset link is single-use, expires, kills the other links and the
 * old session, and never revives a blocked account; «змінити пароль» needs the current one.
 */
vi.mock('@/lib/db/client', async () => {
  const { makeTestDb } = await import('../helpers/Test_Db');
  return { db: await makeTestDb(), hasDb: true };
});
const signIn = vi.fn(async (..._a: unknown[]) => {});
vi.mock('@/auth', () => ({
  auth: async () => null,
  signIn: (...a: unknown[]) => signIn(...a),
  signOut: async () => {},
}));
vi.mock('next-auth', () => ({
  AuthError: class extends Error {},
  CredentialsSignin: class extends Error {
    code = '';
  },
}));
type Actor = {
  id: string;
  role: 'student' | 'admin';
  mustChangePassword: boolean;
} | null;
let actor: Actor = null;
vi.mock('@/lib/auth/session', async (orig) => {
  const real = await orig<typeof import('@/lib/auth/session')>();
  return {
    ...real,
    requireActionUser: async () => {
      if (!actor) throw new Error('unauthorized');
      return actor;
    },
  };
});
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'fly-client-ip': '2.2.2.2' }),
}));
const later: (() => Promise<void>)[] = [];
vi.mock('next/server', () => ({
  after: (fn: () => Promise<void>) => later.push(fn),
}));
const sendEmail = vi.fn(async (_m: { to: string; template: string }) => {});
vi.mock('@/lib/email/send', () => ({
  sendEmail: (m: { to: string; template: string }) => sendEmail(m),
  adminInbox: () => null,
}));

const { db } = (await import('@/lib/db/client')) as unknown as { db: TestDb };
const { changePassword, requestPasswordReset, resetPassword } =
  await import('@/app/[locale]/_actions/account');

const EMAIL = 'anna@example.test';
let anna: string;
const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ locale: 'uk', ...o })) f.set(k, v);
  return f;
};
async function outcome(p: Promise<unknown>) {
  try {
    return await p;
  } catch (e) {
    const m = (e as Error).message;
    if (m.startsWith('REDIRECT ')) return m;
    throw e;
  }
}
async function link(over: { expiresAt?: Date; usedAt?: Date } = {}) {
  const { token, hash, expiresAt } = newResetToken();
  await db
    .insert(passwordResetTokens)
    .values({ userId: anna, tokenHash: hash, expiresAt, ...over });
  return token;
}
const passwordOf = async () =>
  (await db.select().from(users).where(eq(users.id, anna)))[0];

beforeEach(async () => {
  await resetDb(db);
  sendEmail.mockClear();
  signIn.mockClear();
  later.length = 0;
  actor = null;
  [{ id: anna }] = await db
    .insert(users)
    .values({
      email: EMAIL,
      role: 'student',
      passwordHash: await bcrypt.hash('old-password', 4),
      mustChangePassword: true,
    })
    .returning({ id: users.id });
  await db.insert(sessions).values({ userId: anna, sid: crypto.randomUUID() });
});

describe('«забули пароль»', () => {
  const ask = async (email: string) => {
    const r = await requestPasswordReset(null, form({ email }));
    for (const fn of later.splice(0)) await fn();
    return r;
  };

  it('the same answer for a known, unknown and malformed e-mail; a letter only for the known one', async () => {
    expect(await ask(EMAIL)).toEqual({ sent: true });
    expect(await ask('nobody@example.test')).toEqual({ sent: true });
    expect(await ask('not-an-email')).toEqual({ sent: true });
    expect(sendEmail.mock.calls.map(([m]) => [m.template, m.to])).toEqual([
      ['passwordReset', EMAIL],
    ]);
    expect(await db.select().from(passwordResetTokens)).toHaveLength(1);
  });

  it('a blocked account gets no link', async () => {
    await db.update(users).set({ blockedAt: new Date() });
    await ask(EMAIL);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('the 4th request for one e-mail within a minute sends nothing', async () => {
    for (let i = 0; i < 4; i++) await ask(EMAIL);
    expect(sendEmail).toHaveBeenCalledTimes(3);
  });
});

describe('reset link', () => {
  const reset = (
    token: string,
    password = 'new-password-1',
    repeat = password,
  ) => outcome(resetPassword(null, form({ token, password, repeat })));

  it('valid link → new password, temp flag cleared, old session ended, every other link dead, signed in', async () => {
    const t1 = await link();
    const t2 = await link();
    expect(await reset(t1)).toBe('REDIRECT /uk/cabinet');
    const u = await passwordOf();
    expect(await bcrypt.compare('new-password-1', u.passwordHash!)).toBe(true);
    expect(u.mustChangePassword).toBe(false);
    expect(await db.select().from(sessions)).toHaveLength(0);
    expect(
      (await db.select().from(passwordResetTokens)).every((r) => r.usedAt),
    ).toBe(true);
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(await reset(t2)).toEqual({ error: 'expired' });
  });

  it('a link works once', async () => {
    const t = await link();
    await reset(t);
    expect(await reset(t, 'another-pass-2')).toEqual({ error: 'expired' });
    expect(
      await bcrypt.compare(
        'new-password-1',
        (await passwordOf()).passwordHash!,
      ),
    ).toBe(true);
  });

  it('an expired, used or made-up link → «expired», password unchanged', async () => {
    const old = await link({ expiresAt: new Date(Date.now() - 1000) });
    const used = await link({ usedAt: new Date() });
    for (const t of [old, used, 'made-up-token'])
      expect(await reset(t)).toEqual({ error: 'expired' });
    expect(
      await bcrypt.compare('old-password', (await passwordOf()).passwordHash!),
    ).toBe(true);
  });

  it('a blocked account cannot come back through a link', async () => {
    const t = await link();
    await db.update(users).set({ blockedAt: new Date() });
    expect(await reset(t)).toEqual({ error: 'blocked' });
  });

  it('short or mismatched passwords are refused before the link is spent', async () => {
    const t = await link();
    expect(await reset(t, 'short')).toEqual({ error: 'tooShort' });
    expect(await reset(t, 'long-enough-1', 'long-enough-2')).toEqual({
      error: 'mismatch',
    });
    expect((await db.select().from(passwordResetTokens))[0].usedAt).toBeNull();
  });
});

describe('«змінити пароль»', () => {
  const change = (o: Record<string, string>) =>
    outcome(changePassword(null, form(o)));

  it('needs a session', async () => {
    await expect(
      change({ password: 'new-password-1', repeat: 'new-password-1' }),
    ).rejects.toThrow('unauthorized');
  });

  it('settings: the current password is required and checked', async () => {
    actor = { id: anna, role: 'student', mustChangePassword: false };
    expect(
      await change({
        current: 'wrong',
        password: 'new-password-1',
        repeat: 'new-password-1',
      }),
    ).toEqual({ error: 'wrongCurrent' });
    expect(
      await change({
        current: 'old-password',
        password: 'new-password-1',
        repeat: 'new-password-1',
      }),
    ).toEqual({ ok: true });
    expect(
      await bcrypt.compare(
        'new-password-1',
        (await passwordOf()).passwordHash!,
      ),
    ).toBe(true);
  });

  it('forced change after a temporary password → no current needed, flag cleared, sent home', async () => {
    actor = { id: anna, role: 'student', mustChangePassword: true };
    expect(
      await change({
        mode: 'forced',
        password: 'new-password-1',
        repeat: 'new-password-1',
      }),
    ).toBe('REDIRECT /uk/cabinet');
    expect((await passwordOf()).mustChangePassword).toBe(false);
  });

  it('«forced» from a session that has no temporary password still needs the current one', async () => {
    actor = { id: anna, role: 'student', mustChangePassword: false };
    expect(
      await change({
        mode: 'forced',
        password: 'new-password-1',
        repeat: 'new-password-1',
      }),
    ).toEqual({ error: 'wrongCurrent' });
  });
});
