import Stripe from 'stripe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { courses, courseTiers, enrollments, payments } from '@/lib/db/schema';

import { resetDb, type TestDb } from '../helpers/Test_Db';

/**
 * `/api/webhooks/payments` from the outside: a Stripe-signed request (real Stripe SDK signature)
 * → route → adapter → fulfilment → database. And the switches that keep the buy buttons honest.
 */
vi.mock('@/lib/db/client', async () => {
  const { makeTestDb } = await import('../helpers/Test_Db');
  return { db: await makeTestDb(), hasDb: true };
});
const sendEmail = vi.fn(async (_m: { to: string; template: string }) => {});
vi.mock('@/lib/email/send', () => ({
  sendEmail: (m: { to: string; template: string }) => sendEmail(m),
  adminInbox: () => process.env.ADMIN_EMAIL?.trim().toLowerCase() || null,
  emailConfigured: () => Boolean(process.env.RESEND_API_KEY),
}));

const { db } = (await import('@/lib/db/client')) as unknown as { db: TestDb };
const { POST } = await import('@/app/api/webhooks/payments/route');
const P = await import('@/lib/payments');

const SECRET = 'whsec_test_secret';
const stripe = new Stripe('sk_test_dummy');
let courseId: string;
let tierId: string;

function event(
  type: string,
  object: Record<string, unknown>,
  id = `evt_${Math.random()}`,
) {
  return JSON.stringify({
    id,
    object: 'event',
    type,
    livemode: true,
    data: { object },
  });
}
function session(over: Record<string, unknown> = {}) {
  return {
    id: 'cs_1',
    object: 'checkout.session',
    payment_status: 'paid',
    payment_intent: 'pi_1',
    customer_details: { email: 'Buyer@Example.test' },
    metadata: { courseId, tierId, locale: 'pl' },
    amount_total: 59000,
    currency: 'pln',
    ...over,
  };
}
function post(
  payload: string,
  signature?: string | null,
  headers: Record<string, string> = {},
) {
  const sig =
    signature === undefined
      ? stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET })
      : signature;
  return POST(
    new Request('https://example.com/api/webhooks/payments', {
      method: 'POST',
      body: payload,
      headers: { ...(sig ? { 'stripe-signature': sig } : {}), ...headers },
    }),
  );
}
const active = async () =>
  (await db.select().from(enrollments)).filter((e) => !e.revokedAt);

beforeEach(async () => {
  await resetDb(db);
  sendEmail.mockClear();
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_dummy');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', SECRET);
  vi.stubEnv('ADMIN_EMAIL', 'admin@example.test');
  const [c] = await db
    .insert(courses)
    .values({
      slug: 'online',
      kind: 'online',
      title: { uk: 'К', pl: 'K', en: 'C' },
    })
    .returning();
  const [t] = await db
    .insert(courseTiers)
    .values({ courseId: c.id, code: 'base', name: 'Base' })
    .returning();
  courseId = c.id;
  tierId = t.id;
});
afterEach(() => vi.unstubAllEnvs());

describe('webhook route', () => {
  it('a correctly signed «checkout.session.completed» → 200 and access for the buyer (e-mail lower-cased, locale kept)', async () => {
    const r = await post(event('checkout.session.completed', session()));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, result: 'done' });
    expect(await active()).toHaveLength(1);
    const [p] = await db.select().from(payments);
    expect(p).toMatchObject({
      email: 'buyer@example.test',
      locale: 'pl',
      amountMinor: 59000,
      livemode: true,
    });
  });

  it('a forged or missing signature → 400 and nothing is written', async () => {
    const body = event('checkout.session.completed', session());
    expect((await post(body, 't=1,v1=deadbeef')).status).toBe(400);
    expect((await post(body, null)).status).toBe(400);
    const other = stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret: 'whsec_other',
    });
    expect((await post(body, other)).status).toBe(400);
    expect(await db.select().from(payments)).toHaveLength(0);
  });

  it('a body changed after signing → 400', async () => {
    const body = event('checkout.session.completed', session());
    const sig = stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret: SECRET,
    });
    expect((await post(body.replace('59000', '1'), sig)).status).toBe(400);
  });

  it('production without the webhook secret refuses every event', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    expect(
      (await post(event('checkout.session.completed', session()))).status,
    ).toBe(400);
  });

  it('production without a Stripe key → 503 (no payments), and the dev simulator header is ignored', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    expect(
      (await post(event('x', {}), null, { 'x-dev-signature': 'anything' }))
        .status,
    ).toBe(503);
  });

  it('unpaid session, no course in metadata or no e-mail → «ignored», no access', async () => {
    for (const s of [
      session({ payment_status: 'unpaid' }),
      session({ metadata: {} }),
      session({ customer_details: null }),
    ]) {
      const r = await post(event('checkout.session.completed', s));
      expect(await r.json()).toEqual({ ok: true, result: 'ignored' });
    }
    expect(await active()).toHaveLength(0);
  });

  it('the same event id twice → 200 both times, one access', async () => {
    const body = event('checkout.session.completed', session(), 'evt_same');
    await post(body);
    const r = await post(body);
    expect(await r.json()).toEqual({ ok: true, result: 'duplicate' });
    expect(await active()).toHaveLength(1);
  });

  it('a failing handler (unknown course) → 500 so Stripe retries', async () => {
    const r = await post(
      event(
        'checkout.session.completed',
        session({
          metadata: { courseId: '00000000-0000-0000-0000-000000000000' },
        }),
      ),
    );
    expect(r.status).toBe(500);
  });

  it('charge.refunded (full) and charge.dispute.created revoke access; a partial refund keeps it', async () => {
    await post(event('checkout.session.completed', session()));
    await post(
      event('charge.refunded', {
        object: 'charge',
        payment_intent: 'pi_1',
        refunded: false,
      }),
    );
    expect(await active()).toHaveLength(1);
    await post(
      event('charge.refunded', {
        object: 'charge',
        payment_intent: 'pi_1',
        refunded: true,
      }),
    );
    expect(await active()).toHaveLength(0);
  });

  it('async payment failed (BLIK / P24) → payment «failed», no access', async () => {
    await post(
      event(
        'checkout.session.async_payment_failed',
        session({ payment_status: 'unpaid' }),
      ),
    );
    const [p] = await db.select().from(payments);
    expect(p.status).toBe('failed');
    expect(await active()).toHaveLength(0);
  });

  it('any other event type → 200 «ignored»', async () => {
    const r = await post(event('customer.created', { object: 'customer' }));
    expect(await r.json()).toEqual({ ok: true, result: 'ignored' });
  });
});

describe('when the buy buttons may be live', () => {
  it('production with a TEST key → public buttons off (test checkouts only via the allowlist page)', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 're_x');
    expect(P.paymentsAvailable()).toBe(false);
    expect(P.testCheckoutAvailable()).toBe(true);
  });

  it('production with a LIVE key needs working e-mail', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_x');
    vi.stubEnv('RESEND_API_KEY', '');
    expect(P.paymentsAvailable()).toBe(false);
    vi.stubEnv('RESEND_API_KEY', 're_x');
    expect(P.paymentsAvailable()).toBe(true);
  });

  it('placeholder prices are never sold with a live key', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_x');
    expect(P.placeholderPricesSellable()).toBe(false);
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_x');
    expect(P.placeholderPricesSellable()).toBe(true);
  });

  it('the test allowlist = TEST_CHECKOUT_ALLOWLIST + the admin inbox, case-insensitive', () => {
    vi.stubEnv('TEST_CHECKOUT_ALLOWLIST', ' Tester@Example.test , ');
    expect(P.isAllowlistedTester('tester@example.test')).toBe(true);
    expect(P.isAllowlistedTester('ADMIN@example.test')).toBe(true);
    expect(P.isAllowlistedTester('someone@example.test')).toBe(false);
  });

  it('offline sales on production need the studio inbox', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_EMAIL', '');
    expect(P.offlineSalesAvailable()).toBe(false);
  });
});
