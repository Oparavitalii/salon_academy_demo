'use server';

import bcrypt from 'bcryptjs';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { AuthError, CredentialsSignin } from 'next-auth';
import { z } from 'zod';

import { signIn, signOut } from '@/auth';
import { routing, type Locale } from '@/i18n/routing';
import { appUrl } from '@/lib/appUrl';
import {
  hashPassword,
  hashToken,
  MIN_PASSWORD,
  newResetToken,
} from '@/lib/auth/password';
import { attempt, LIMITS } from '@/lib/auth/rateLimit';
import {
  closeSession,
  getValidSession,
  homeFor,
  requireActionUser,
} from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { passwordResetTokens, users } from '@/lib/db/schema';
import { sendEmail } from '@/lib/email/send';

function localeOf(fd: FormData): Locale {
  const l = String(fd.get('locale') ?? '');
  return (routing.locales as readonly string[]).includes(l)
    ? (l as Locale)
    : routing.defaultLocale;
}

export type LoginState = { error?: 'invalid' | 'rate' | 'blocked' } | null;

/** One login for both roles → role redirect (Decisions 19.10.2026 «Один вхід…»). */
export async function login(
  _prev: LoginState,
  fd: FormData,
): Promise<LoginState> {
  const locale = localeOf(fd);
  const email = String(fd.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (!email || !password) return { error: 'invalid' };

  try {
    await signIn('credentials', { email, password, redirect: false });
  } catch (e) {
    if (e instanceof CredentialsSignin) {
      if (e.code === 'blocked') return { error: 'blocked' };
      if (e.code === 'rate') return { error: 'rate' };
      return { error: 'invalid' };
    }
    if (e instanceof AuthError) return { error: 'invalid' };
    throw e;
  }

  const [u] = await db
    .select({ role: users.role, must: users.mustChangePassword })
    .from(users)
    .where(eq(users.email, email));
  redirect(u?.must ? `/${locale}/change-password` : homeFor(locale, u.role));
}

export async function logout(fd: FormData) {
  const locale = localeOf(fd);
  const s = await getValidSession();
  if (s.ok) await closeSession(s.user.id);
  await signOut({ redirectTo: `/${locale}/login` });
}

export type PasswordState = {
  error?: 'tooShort' | 'mismatch' | 'wrongCurrent' | 'expired' | 'blocked';
  ok?: boolean;
} | null;

const pwInput = z.object({
  password: z.string().min(MIN_PASSWORD).max(200),
  repeat: z.string(),
});

/**
 * Settings «Змінити пароль» (asks for the current one) and the forced change after a
 * temporary password (`mode=forced`: the user has just typed the temporary password).
 */
export async function changePassword(
  _prev: PasswordState,
  fd: FormData,
): Promise<PasswordState> {
  const locale = localeOf(fd);
  const user = await requireActionUser(undefined, { allowMustChange: true });
  const forced = fd.get('mode') === 'forced' && user.mustChangePassword;

  const parsed = pwInput.safeParse({
    password: fd.get('password'),
    repeat: fd.get('repeat'),
  });
  if (!parsed.success) return { error: 'tooShort' };
  if (parsed.data.password !== parsed.data.repeat) return { error: 'mismatch' };

  if (!forced) {
    const [row] = await db
      .select({ hash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id));
    const current = String(fd.get('current') ?? '');
    if (!row?.hash || !(await bcrypt.compare(current, row.hash)))
      return { error: 'wrongCurrent' };
  }

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: false,
    })
    .where(eq(users.id, user.id));

  if (forced) redirect(homeFor(locale, user.role));
  return { ok: true };
}

export type ForgotState = { sent?: boolean } | null;

/**
 * Always answers «Якщо такий e-mail є, лист уже в дорозі.» at once: throttling, the lookup,
 * the token and the letter all run in `after()`, once the response is sent — the answer and its
 * timing are the same for a known, unknown, blocked or throttled e-mail.
 */
export async function requestPasswordReset(
  _prev: ForgotState,
  fd: FormData,
): Promise<ForgotState> {
  const locale = localeOf(fd);
  const email = String(fd.get('email') ?? '')
    .trim()
    .toLowerCase();
  const h = await headers();
  const ip =
    h.get('fly-client-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  if (!z.string().email().safeParse(email).success) return { sent: true };

  after(async () => {
    try {
      const emailKey = `forgot:email:${email}`;
      const ipKey = `forgot:ip:${ip}`;
      const { limited } = await attempt([
        { key: emailKey, max: LIMITS.forgotEmail },
        { key: ipKey, max: LIMITS.forgotIp },
      ]);
      if (limited) return;

      const [user] = await db
        .select({ id: users.id, blockedAt: users.blockedAt })
        .from(users)
        .where(eq(users.email, email));
      if (!user || user.blockedAt) return;
      const { token, hash, expiresAt } = newResetToken();
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: hash,
        expiresAt,
      });
      await sendEmail({
        to: email,
        template: 'passwordReset',
        vars: { link: `${appUrl()}/${locale}/reset-password/${token}` },
      });
    } catch {
      console.error('[auth] password-reset letter failed');
    }
  });
  return { sent: true };
}

/** Single-use, 1 h token → new password → signed in → role home. */
export async function resetPassword(
  _prev: PasswordState,
  fd: FormData,
): Promise<PasswordState> {
  const locale = localeOf(fd);
  const token = String(fd.get('token') ?? '');
  const parsed = pwInput.safeParse({
    password: fd.get('password'),
    repeat: fd.get('repeat'),
  });
  if (!parsed.success) return { error: 'tooShort' };
  if (parsed.data.password !== parsed.data.repeat) return { error: 'mismatch' };

  const [row] = await db
    .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    );
  if (!row) return { error: 'expired' };

  // A blocked account cannot get back in through a reset link.
  const [owner] = await db
    .select({ blockedAt: users.blockedAt })
    .from(users)
    .where(eq(users.id, row.userId));
  if (!owner || owner.blockedAt) return { error: 'blocked' };

  const claimed = await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.id, row.id),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .returning({ id: passwordResetTokens.id });
  if (!claimed.length) return { error: 'expired' };
  // Every other open link of this user dies with this one.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, row.userId),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  const [user] = await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: false,
    })
    .where(eq(users.id, row.userId))
    .returning({ email: users.email, role: users.role });
  await closeSession(row.userId);

  try {
    await signIn('credentials', {
      email: user.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    redirect(`/${locale}/login`);
  }
  redirect(homeFor(locale, user.role));
}

/** Profile «Ім'я» + «Телефон» — the student's /cabinet/settings and the admin's /admin/settings. */
export async function saveProfile(
  _prev: { ok?: boolean } | null,
  fd: FormData,
): Promise<{ ok?: boolean } | null> {
  const user = await requireActionUser();
  const name = String(fd.get('name') ?? '')
    .trim()
    .slice(0, 120);
  const phone = String(fd.get('phone') ?? '')
    .trim()
    .slice(0, 40);
  await db
    .update(users)
    .set({ name: name || null, phone: phone || null })
    .where(eq(users.id, user.id));
  return { ok: true };
}
