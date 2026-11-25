import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  courses,
  courseTiers,
  enrollments,
  passwordResetTokens,
  payments,
  users,
  webhookEvents,
} from '@/lib/db/schema';
import type { PaidEvent } from '@/lib/payments/types';

import { resetDb, type TestDb } from '../helpers/Test_Db';

/**
 * Payment → access (`lib/payments/fulfil.ts`), against a real Postgres (PGlite) with the app's
 * migrations. The e-mail sender is a spy; everything else — claims, ON CONFLICT, revocation — is
 * the production code and SQL.
 */
vi.mock('@/lib/db/client', async () => {
  const { makeTestDb } = await import('../helpers/Test_Db');
  return { db: await makeTestDb(), hasDb: true };
});
const sendEmail =
  vi.fn<(m: { to: string; template: string }) => Promise<void>>();
vi.mock('@/lib/email/send', () => ({
  sendEmail: (m: { to: string; template: string }) => sendEmail(m),
  adminInbox: () => process.env.ADMIN_EMAIL ?? null,
}));

const { db } = (await import('@/lib/db/client')) as unknown as { db: TestDb };
const { handlePaymentEvent } = await import('@/lib/payments/fulfil');

const BUYER = 'buyer@example.test';
let online: { courseId: string; tierId: string };
let offline: { courseId: string; tierId: string };

async function seedCourse(slug: string, kind: 'online' | 'offline') {
  const [c] = await db
    .insert(courses)
    .values({ slug, kind, title: { uk: slug, pl: slug, en: slug } })
    .returning();
  const [t] = await db
    .insert(courseTiers)
    .values({ courseId: c.id, code: 'base', name: 'Base', priceMinor: 59000 })
    .returning();
  return { courseId: c.id, tierId: t.id };
}

let seq = 0;
function paid(over: Partial<PaidEvent> = {}): PaidEvent {
  seq += 1;
  return {
    type: 'paid',
    eventId: `evt_${seq}`,
    sessionId: `cs_${seq}`,
    paymentIntentId: `pi_${seq}`,
    email: BUYER,
    courseId: online.courseId,
    tierId: online.tierId,
    locale: 'uk',
    amountMinor: 59000,
    currency: 'pln',
    livemode: true,
    ...over,
  };
}

const activeEnrollments = () =>
  db
    .select()
    .from(enrollments)
    .then((r) => r.filter((e) => !e.revokedAt));
const templates = () => sendEmail.mock.calls.map(([m]) => m.template);

beforeEach(async () => {
  await resetDb(db);
  sendEmail.mockReset().mockResolvedValue(undefined);
  vi.stubEnv('ADMIN_EMAIL', 'admin@example.test');
  online = await seedCourse('online-course', 'online');
  offline = await seedCourse('offline-intensive', 'offline');
});
afterEach(() => vi.unstubAllEnvs());

describe('paid — online course', () => {
  it('new e-mail → student account, active enrollment, one welcome letter with a set-password link', async () => {
    expect(await handlePaymentEvent(paid())).toBe('done');

    const [u] = await db.select().from(users).where(eq(users.email, BUYER));
    expect(u.role).toBe('student');
    expect(u.passwordHash).toBeNull();
    const act = await activeEnrollments();
    expect(act).toHaveLength(1);
    expect(act[0]).toMatchObject({
      userId: u.id,
      courseId: online.courseId,
      grantedBy: 'payment',
    });
    expect(templates()).toEqual(['welcome']);
    expect(await db.select().from(passwordResetTokens)).toHaveLength(1);
    const [p] = await db.select().from(payments);
    expect(p.status).toBe('paid');
    expect(p.emailSentAt).not.toBeNull();
  });

  it('the same event delivered twice → «duplicate», still one enrollment and one letter', async () => {
    const e = paid();
    expect(await handlePaymentEvent(e)).toBe('done');
    expect(await handlePaymentEvent(e)).toBe('duplicate');
    expect(await activeEnrollments()).toHaveLength(1);
    expect(await db.select().from(payments)).toHaveLength(1);
    expect(templates()).toEqual(['welcome']);
  });

  it('a second event for the same checkout session → no second payment, no second letter', async () => {
    const first = paid();
    await handlePaymentEvent(first);
    await handlePaymentEvent({ ...first, eventId: 'evt_other' });
    expect(await db.select().from(payments)).toHaveLength(1);
    expect(templates()).toEqual(['welcome']);
  });

  it('an existing student with a password gets «course added», no set-password link', async () => {
    await db
      .insert(users)
      .values({ email: BUYER, role: 'student', passwordHash: 'x' });
    await handlePaymentEvent(paid());
    expect(templates()).toEqual(['courseAdded']);
    expect(await db.select().from(passwordResetTokens)).toHaveLength(0);
    expect(await activeEnrollments()).toHaveLength(1);
  });

  it('the buyer e-mail is the admin → nothing granted, the admin is told', async () => {
    await db
      .insert(users)
      .values({ email: BUYER, role: 'admin', passwordHash: 'x' });
    await handlePaymentEvent(paid());
    expect(await activeEnrollments()).toHaveLength(0);
    expect(templates()).toEqual(['roleConflictAdmin']);
    const [u] = await db.select().from(users).where(eq(users.email, BUYER));
    expect(u.role).toBe('admin');
  });

  it('letter fails → error, claim released, link deleted, «email failed» stamped; Stripe retry then sends once', async () => {
    const e = paid();
    sendEmail.mockRejectedValueOnce(new Error('smtp down'));
    await expect(handlePaymentEvent(e)).rejects.toThrow('smtp down');

    expect(await db.select().from(webhookEvents)).toHaveLength(0);
    expect(await db.select().from(passwordResetTokens)).toHaveLength(0);
    const [p1] = await db.select().from(payments);
    expect(p1.emailSentAt).toBeNull();
    expect(p1.emailFailedAt).not.toBeNull();

    expect(await handlePaymentEvent(e)).toBe('done');
    const [p2] = await db.select().from(payments);
    expect(p2.emailSentAt).not.toBeNull();
    expect(p2.emailFailedAt).toBeNull();
    expect(await activeEnrollments()).toHaveLength(1);
    expect(await db.select().from(passwordResetTokens)).toHaveLength(1);
  });

  it('unknown course → error and the event can be retried (claim released)', async () => {
    const e = paid({ courseId: '00000000-0000-0000-0000-000000000000' });
    await expect(handlePaymentEvent(e)).rejects.toThrow('unknown course');
    expect(await db.select().from(webhookEvents)).toHaveLength(0);
    expect(await activeEnrollments()).toHaveLength(0);
  });
});

describe('paid — production safety', () => {
  it('a test-mode payment on production from a non-allowlisted payer grants nothing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TEST_CHECKOUT_ALLOWLIST', '');
    expect(await handlePaymentEvent(paid({ livemode: false }))).toBe('ignored');
    expect(await activeEnrollments()).toHaveLength(0);
    expect(await db.select().from(users)).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('a live-mode payment on production is fulfilled', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(await handlePaymentEvent(paid({ livemode: true }))).toBe('done');
    expect(await activeEnrollments()).toHaveLength(1);
  });
});

describe('paid — offline intensive', () => {
  it('no account, payment recorded as offline, buyer and admin letters once each', async () => {
    const e = paid({ courseId: offline.courseId, tierId: offline.tierId });
    await handlePaymentEvent(e);
    await handlePaymentEvent({ ...e, eventId: 'evt_again' });
    expect(await db.select().from(users)).toHaveLength(0);
    expect(await db.select().from(enrollments)).toHaveLength(0);
    const [p] = await db.select().from(payments);
    expect(p.kind).toBe('offline');
    expect(templates().sort()).toEqual(['intensivePaid', 'intensivePaidAdmin']);
  });
});

describe('failed, refund, dispute', () => {
  it('failed (BLIK / P24) → payment «failed», no account, no access, no letter', async () => {
    const e = { ...paid(), type: 'failed' as const };
    await handlePaymentEvent(e);
    const [p] = await db.select().from(payments);
    expect(p.status).toBe('failed');
    expect(await db.select().from(users)).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('full refund → access revoked, payment «refunded»', async () => {
    const e = paid();
    await handlePaymentEvent(e);
    await handlePaymentEvent({
      type: 'refunded',
      eventId: 'evt_r',
      paymentIntentId: e.paymentIntentId!,
      full: true,
    });
    expect(await activeEnrollments()).toHaveLength(0);
    const [p] = await db.select().from(payments);
    expect(p.status).toBe('refunded');
  });

  it('partial refund → access kept', async () => {
    const e = paid();
    await handlePaymentEvent(e);
    await handlePaymentEvent({
      type: 'refunded',
      eventId: 'evt_r',
      paymentIntentId: e.paymentIntentId!,
      full: false,
    });
    expect(await activeEnrollments()).toHaveLength(1);
  });

  it('refund delivered before its payment → error (Stripe retries later), nothing left half-done', async () => {
    await expect(
      handlePaymentEvent({
        type: 'refunded',
        eventId: 'evt_early',
        paymentIntentId: 'pi_unknown',
        full: true,
      }),
    ).rejects.toThrow('refund before payment');
    expect(await db.select().from(webhookEvents)).toHaveLength(0);
  });

  it('dispute → access revoked at once and the admin is told', async () => {
    const e = paid();
    await handlePaymentEvent(e);
    sendEmail.mockClear();
    await handlePaymentEvent({
      type: 'disputed',
      eventId: 'evt_d',
      paymentIntentId: e.paymentIntentId!,
    });
    expect(await activeEnrollments()).toHaveLength(0);
    const [p] = await db.select().from(payments);
    expect(p.status).toBe('disputed');
    expect(templates()).toEqual(['disputeAdmin']);
  });

  it('a new purchase after a refund grants access again', async () => {
    const e = paid();
    await handlePaymentEvent(e);
    await handlePaymentEvent({
      type: 'refunded',
      eventId: 'evt_r',
      paymentIntentId: e.paymentIntentId!,
      full: true,
    });
    await handlePaymentEvent(paid());
    expect(await activeEnrollments()).toHaveLength(1);
  });
});
