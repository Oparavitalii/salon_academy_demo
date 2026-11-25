'use server';

import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { routing, type Locale } from '@/i18n/routing';
import { appUrl } from '@/lib/appUrl';
import { db } from '@/lib/db/client';
import { courses, courseTiers } from '@/lib/db/schema';
import { localSimulationAllowed } from '@/lib/demo/mode';
import {
  getPaymentProvider,
  isAllowlistedTester,
  offlineSalesAvailable,
  paymentsAvailable,
  placeholderPricesSellable,
  testCheckoutAvailable,
} from '@/lib/payments';
import { postDevEvent } from '@/lib/payments/devPost';
import type { PaidEvent } from '@/lib/payments/types';

const startInput = z.object({
  locale: z.enum(routing.locales),
  course: z.string().min(1).max(80),
  tier: z.string().min(1).max(40),
});

/**
 * Creates the Stripe Checkout Session with the price from the DB (never from the form) and
 * redirects to it; any refusal → `/checkout/cancel`, nothing created.
 */
async function openCheckout(
  locale: Locale,
  slug: string,
  code: string,
  test: { email: string } | null,
) {
  const [row] = await db
    .select({ course: courses, tier: courseTiers })
    .from(courseTiers)
    .innerJoin(courses, eq(courses.id, courseTiers.courseId))
    .where(and(eq(courses.slug, slug), eq(courseTiers.code, code)));

  const provider = getPaymentProvider();
  const cancel = `/${locale}/checkout/cancel?course=${encodeURIComponent(slug)}`;
  if (
    !row ||
    !provider ||
    row.course.status !== 'available' ||
    row.tier.priceMinor === null ||
    (row.course.kind === 'offline' && !offlineSalesAvailable())
  )
    redirect(cancel);
  if (test) {
    // Test mode: Stripe test key + allowlisted payer only (conditional prices allowed).
    if (!testCheckoutAvailable() || !isAllowlistedTester(test.email))
      redirect(cancel);
  } else if (
    !paymentsAvailable() ||
    (row.tier.priceIsPlaceholder && !placeholderPricesSellable())
  ) {
    redirect(cancel);
  }

  const title =
    row.course.kind === 'online'
      ? `${row.course.title.uk} — ${row.tier.name}`
      : row.course.title.uk;

  let url: string;
  try {
    ({ url } = await provider.createCheckout({
      courseId: row.course.id,
      tierId: row.tier.id,
      courseSlug: slug,
      kind: row.course.kind,
      title,
      amountMinor: row.tier.priceMinor,
      currency: row.tier.currency,
      locale,
      base: `${appUrl()}/${locale}`,
      customerEmail: test?.email,
    }));
  } catch (e) {
    console.error(
      '[checkout] create failed:',
      e instanceof Error ? e.message : 'unknown',
    );
    redirect(cancel);
  }
  redirect(url);
}

/**
 * «Купити» (catalog, `#tiers`, intensive). Refused when: no price, no provider, production
 * without Resend, production with a Stripe TEST key (test checkouts only via `/checkout/test`
 * for allowlisted e-mails), the intensive in production without ADMIN_EMAIL, or a conditional
 * price (`price_is_placeholder`) with a live key.
 */
export async function startCheckout(fd: FormData) {
  const parsed = startInput.safeParse({
    locale: fd.get('locale'),
    course: fd.get('course'),
    tier: fd.get('tier'),
  });
  if (!parsed.success) redirect(`/${routing.defaultLocale}/courses`);
  const { locale, course, tier } = parsed.data;
  await openCheckout(locale, course, tier, null);
}

/**
 * `/checkout/test` — Stripe TEST key only, payer e-mail must be on TEST_CHECKOUT_ALLOWLIST or
 * be ADMIN_EMAIL; the e-mail is locked on the Stripe page (`customer_email`), so the letter
 * can only reach an allowlisted address.
 */
export async function startTestCheckout(fd: FormData) {
  const parsed = startInput
    .extend({ email: z.string().trim().toLowerCase().email() })
    .safeParse({
      locale: fd.get('locale'),
      course: fd.get('course'),
      tier: fd.get('tier'),
      email: fd.get('email'),
    });
  if (!parsed.success) redirect(`/${routing.defaultLocale}/courses`);
  const { locale, course, tier, email } = parsed.data;
  await openCheckout(locale, course, tier, { email });
}

const devInput = z.object({
  locale: z.enum(routing.locales),
  tier: z.string().uuid(),
  email: z.string().trim().toLowerCase().email(),
});

/**
 * DEV ONLY — the simulated «paid» webhook. Posts a signed event to the real webhook route
 * of this same server, then returns to /checkout/success like Stripe would.
 */
export async function devCompleteCheckout(fd: FormData) {
  if (!localSimulationAllowed() || process.env.STRIPE_SECRET_KEY)
    throw new Error('dev checkout is disabled');
  const parsed = devInput.safeParse({
    locale: fd.get('locale'),
    tier: fd.get('tier'),
    email: fd.get('email'),
  });
  if (!parsed.success) throw new Error('invalid input');
  const { locale, tier: tierId, email } = parsed.data;

  const [row] = await db
    .select({ course: courses, tier: courseTiers })
    .from(courseTiers)
    .innerJoin(courses, eq(courses.id, courseTiers.courseId))
    .where(eq(courseTiers.id, tierId));
  if (!row || row.tier.priceMinor === null) throw new Error('unknown tier');

  const id = randomUUID();
  const event: PaidEvent = {
    type: 'paid',
    eventId: `dev_evt_${id}`,
    sessionId: `dev_cs_${id}`,
    paymentIntentId: `dev_pi_${id}`,
    email,
    courseId: row.course.id,
    tierId: row.tier.id,
    locale: locale as Locale,
    amountMinor: row.tier.priceMinor,
    currency: row.tier.currency,
    livemode: false,
  };
  await postDevEvent(event);
  redirect(`/${locale}/checkout/success?session_id=${event.sessionId}`);
}
