import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';

import { appUrl } from '@/lib/appUrl';
import { newResetToken, SET_PASSWORD_TTL_MS } from '@/lib/auth/password';
import { formatPln } from '@/lib/courses/seedPrices';
import { db } from '@/lib/db/client';
import {
  courses,
  courseTiers,
  enrollments,
  passwordResetTokens,
  payments,
  users,
  webhookEvents,
  type PaymentStatus,
} from '@/lib/db/schema';
import { isDemoMode } from '@/lib/demo/mode';
import { adminInbox, sendEmail } from '@/lib/email/send';

import type {
  DisputeEvent,
  FailedEvent,
  PaidEvent,
  PaymentEvent,
  RefundEvent,
} from './types';

import { isAllowlistedTester } from './index';

/**
 * Webhook → account → e-mail (4.2_Architecture). Atomic idempotency:
 * 1. The event id is CLAIMED first: `INSERT … state='processing'`, or — on conflict — take over
 *    only a `processing` claim older than 5 min (a crashed worker); `done` and fresh claims →
 *    «duplicate». Success marks it `done`; a failure releases it so Stripe's retry runs again.
 * 2. Every write is keyed (session id, user e-mail, user+course).
 * 3. Each letter has its own claim on the payment row (buyer: `email_claimed_at`, admin:
 *    `admin_email_claimed_at`; re-takeable after 5 min). `email_sent_at` is written only AFTER a
 *    successful send; a failure clears the claim and stamps `email_failed_at`
 *    («оплата без листа» in /admin/payments).
 * 4. No password travels by e-mail: an account without one gets a single-use 72 h
 *    «встановіть пароль» link; a purchase never touches an existing password.
 */
export async function handlePaymentEvent(
  event: PaymentEvent,
): Promise<'done' | 'duplicate' | 'ignored'> {
  const claimed = await db
    .insert(webhookEvents)
    .values({ id: event.eventId, type: event.type, state: 'processing' })
    .onConflictDoUpdate({
      target: webhookEvents.id,
      set: { state: 'processing', claimedAt: new Date() },
      setWhere: and(
        eq(webhookEvents.state, 'processing'),
        lt(webhookEvents.claimedAt, sql`now() - interval '5 minutes'`),
      ),
    })
    .returning({ id: webhookEvents.id });
  if (!claimed.length) return 'duplicate';

  let result: 'done' | 'ignored' =
    event.type === 'ignored' ? 'ignored' : 'done';
  try {
    if (event.type === 'paid') {
      // Production: a TEST-mode payment grants nothing unless the payer is allowlisted
      // (a test key on the real domain must not hand out real access).
      if (
        process.env.NODE_ENV === 'production' &&
        !isDemoMode() &&
        event.livemode !== true &&
        !isAllowlistedTester(event.email)
      ) {
        console.warn(
          '[payments] test-mode payment from a non-allowlisted payer — ignored',
        );
        result = 'ignored';
      } else {
        await fulfilPaid(event);
      }
    }
    if (event.type === 'failed') await recordFailed(event);
    if (event.type === 'refunded') await applyRefund(event);
    if (event.type === 'disputed') await applyDispute(event);
  } catch (e) {
    await db.delete(webhookEvents).where(eq(webhookEvents.id, event.eventId));
    throw e;
  }
  await db
    .update(webhookEvents)
    .set({ state: 'done' })
    .where(eq(webhookEvents.id, event.eventId));
  return result;
}

async function recordPayment(
  e: PaidEvent | FailedEvent,
  kind: 'online' | 'offline',
  userId: string | null,
  status: PaymentStatus,
) {
  const [tier] = e.tierId
    ? await db
        .select({ id: courseTiers.id })
        .from(courseTiers)
        .where(eq(courseTiers.id, e.tierId))
    : [];
  await db
    .insert(payments)
    .values({
      providerSessionId: e.sessionId,
      providerPaymentIntentId: e.paymentIntentId,
      email: e.email,
      userId,
      courseId: e.courseId,
      tierId: tier?.id ?? null,
      kind,
      amountMinor: e.amountMinor,
      currency: e.currency,
      status,
      locale: e.locale,
      livemode: e.livemode === true,
    })
    .onConflictDoNothing({ target: payments.providerSessionId });
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerSessionId, e.sessionId));
  return payment;
}

const STALE = sql`now() - interval '5 minutes'`;

/**
 * Runs `send` only if this caller claims that letter of the payment. `buyer` and `admin` are
 * separate claims, so an admin-letter failure never re-sends the buyer's. The «sent» stamp is
 * written only after success; a failure clears the claim (and, for the buyer, stamps
 * `email_failed_at`) and rethrows → webhook 500 → Stripe retries.
 */
async function sendOnce(
  paymentId: string,
  which: 'buyer' | 'admin',
  send: () => Promise<void>,
) {
  const sent =
    which === 'buyer' ? payments.emailSentAt : payments.adminEmailSentAt;
  const claim =
    which === 'buyer' ? payments.emailClaimedAt : payments.adminEmailClaimedAt;
  const [won] = await db
    .update(payments)
    .set(
      which === 'buyer'
        ? { emailClaimedAt: new Date() }
        : { adminEmailClaimedAt: new Date() },
    )
    .where(
      and(
        eq(payments.id, paymentId),
        isNull(sent),
        or(isNull(claim), lt(claim, STALE)),
      ),
    )
    .returning({ id: payments.id });
  if (!won) return;
  try {
    await send();
  } catch (err) {
    await db
      .update(payments)
      .set(
        which === 'buyer'
          ? { emailClaimedAt: null, emailFailedAt: new Date() }
          : { adminEmailClaimedAt: null },
      )
      .where(eq(payments.id, paymentId));
    throw err;
  }
  await db
    .update(payments)
    .set(
      which === 'buyer'
        ? { emailSentAt: new Date(), emailFailedAt: null }
        : { adminEmailSentAt: new Date() },
    )
    .where(eq(payments.id, paymentId));
}

async function fulfilPaid(e: PaidEvent) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, e.courseId));
  if (!course) throw new Error('fulfil: unknown course');
  const title = course.title.uk;
  const amount = formatPln(e.amountMinor);

  if (course.kind === 'offline') {
    // FR-22 / Q-03: no account; the studio contacts the buyer about the date.
    const payment = await recordPayment(e, 'offline', null, 'paid');
    await sendOnce(payment.id, 'buyer', () =>
      sendEmail({
        to: e.email,
        template: 'intensivePaid',
        vars: { course: title, amount },
      }),
    );
    const admin = adminInbox();
    if (admin)
      await sendOnce(payment.id, 'admin', () =>
        sendEmail({
          to: admin,
          template: 'intensivePaidAdmin',
          vars: { email: e.email, course: title, amount },
        }),
      );
    return;
  }

  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, e.email));

  // The e-mail belongs to a non-student account (the admin): grant nothing, tell the admin.
  if (existing && existing.role !== 'student') {
    const payment = await recordPayment(e, 'online', null, 'paid');
    const admin = adminInbox();
    if (admin)
      await sendOnce(payment.id, 'admin', () =>
        sendEmail({
          to: admin,
          template: 'roleConflictAdmin',
          vars: { email: e.email, course: title, amount },
        }),
      );
    return;
  }

  if (!existing) {
    await db
      .insert(users)
      .values({
        email: e.email,
        role: 'student',
        locale: e.locale,
        mustChangePassword: true,
      })
      .onConflictDoNothing({ target: users.email });
  }
  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, e.email));
  if (user.role !== 'student') throw new Error('fulfil: role changed');

  const payment = await recordPayment(e, 'online', user.id, 'paid');
  await db
    .insert(enrollments)
    .values({
      userId: user.id,
      courseId: course.id,
      tierId: payment.tierId,
      grantedBy: 'payment',
      paymentId: payment.id,
    })
    .onConflictDoUpdate({
      target: [enrollments.userId, enrollments.courseId],
      set: {
        tierId: payment.tierId,
        grantedBy: 'payment',
        paymentId: payment.id,
        revokedAt: null,
      },
    });

  await sendOnce(payment.id, 'buyer', () => sendAccessLetter(user.id, title));
}

/**
 * Creates a 72 h single-use «встановіть пароль» link (only its SHA-256 is stored) and runs
 * `send` with it. If the letter fails, the token is deleted and the error rethrown, so a link
 * that never reached anyone cannot be used later.
 */
async function withSetPasswordLink(
  user: { id: string; locale: string },
  send: (link: string) => Promise<void>,
) {
  const { token, hash, expiresAt } = newResetToken(SET_PASSWORD_TTL_MS);
  const [row] = await db
    .insert(passwordResetTokens)
    .values({ userId: user.id, tokenHash: hash, expiresAt })
    .returning({ id: passwordResetTokens.id });
  try {
    await send(`${appUrl()}/${user.locale}/reset-password/${token}`);
  } catch (err) {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, row.id));
    throw err;
  }
}

/**
 * Access letter after a purchase or a manual grant (B-09, B-10). An account without a password
 * gets a «встановіть пароль» link (72 h, single use) — no password ever travels by e-mail; an
 * account that already has a password gets «курс додано». Runs under the payment's `sendOnce`
 * claim, so one payment = one letter.
 */
export async function sendAccessLetter(userId: string, course: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return;
  const loginUrl = `${appUrl()}/${user.locale}/login`;

  if (user.passwordHash) {
    await sendEmail({
      to: user.email,
      template: 'courseAdded',
      vars: { course, loginUrl },
    });
    return;
  }
  await withSetPasswordLink(user, (link) =>
    sendEmail({
      to: user.email,
      template: 'welcome',
      vars: { login: user.email, link, loginUrl, course },
    }),
  );
}

/**
 * Admin «Надіслати доступ повторно» / after an e-mail correction (B-10). Every open link of the
 * student dies first (after a typo fix the old ones went to a wrong address), then a fresh
 * 72 h link is sent. The current password is NOT touched — it keeps working until the student
 * sets a new one through the link. Students only.
 */
export async function resendAccessByAdmin(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || user.role !== 'student') return;
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ),
    );
  await withSetPasswordLink(user, (link) =>
    sendEmail({
      to: user.email,
      template: 'accessResent',
      vars: {
        login: user.email,
        link,
        loginUrl: `${appUrl()}/${user.locale}/login`,
      },
    }),
  );
}

/** BLIK / P24 that finally failed: recorded as «failed», nothing granted, no letter. */
async function recordFailed(e: FailedEvent) {
  const [course] = await db
    .select({ kind: courses.kind })
    .from(courses)
    .where(eq(courses.id, e.courseId));
  if (!course) return;
  await recordPayment(e, course.kind, null, 'failed');
}

async function revokeByIntent(paymentIntentId: string, status: PaymentStatus) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerPaymentIntentId, paymentIntentId));
  if (!payment) return null;
  const now = new Date();
  await db
    .update(payments)
    .set({ status, refundedAt: now })
    .where(eq(payments.id, payment.id));
  await db
    .update(enrollments)
    .set({ revokedAt: now })
    .where(eq(enrollments.paymentId, payment.id));
  return payment;
}

async function applyRefund(e: RefundEvent) {
  if (!e.full) {
    console.log('[payments] partial refund — access kept');
    return;
  }
  const p = await revokeByIntent(e.paymentIntentId, 'refunded');
  // Refund ahead of its «paid» event (out-of-order delivery): fail → 500 → Stripe retries
  // later, when the payment exists — so access granted afterwards is still revoked.
  if (!p) throw new Error('refund before payment — retry later');
}

/** Chargeback opened: access off at once (no sharing a disputed course), admin told. */
async function applyDispute(e: DisputeEvent) {
  const p = await revokeByIntent(e.paymentIntentId, 'disputed');
  if (!p) throw new Error('dispute before payment — retry later');
  const admin = adminInbox();
  if (admin)
    await sendEmail({
      to: admin,
      template: 'disputeAdmin',
      vars: { email: p.email, amount: formatPln(p.amountMinor) },
    });
}
