import { and, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { setRequestLocale } from 'next-intl/server';

import { AuthShell } from '@/components/AuthShell/AuthShell';
import type { Locale } from '@/i18n/routing';
import { formatPln } from '@/lib/courses/seedPrices';
import { db } from '@/lib/db/client';
import { courses, courseTiers } from '@/lib/db/schema';
import { testCheckoutAvailable } from '@/lib/payments';

import { startTestCheckout } from '../_actions';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ course?: string; tier?: string }>;
};

export const metadata: Metadata = {
  title: 'Тестова оплата',
  robots: { index: false },
};

/**
 * `/checkout/test?course=…&tier=…` — Stripe TEST-mode purchase for the team only
 * (TEST_CHECKOUT_ALLOWLIST + ADMIN_EMAIL; the action checks it, the e-mail is locked on the
 * Stripe page). 404 unless the Stripe key is a test key. Not linked from the site.
 */
export default async function TestCheckoutPage({
  params,
  searchParams,
}: Props) {
  // Render per request: the gate reads runtime secrets. Without this the page is prerendered at
  // build time (no Stripe key in the Docker build) and the 404 is served from cache forever.
  await connection();
  if (!testCheckoutAvailable()) notFound();
  const { locale } = await params;
  const { course, tier } = await searchParams;
  setRequestLocale(locale);
  if (!course || !tier) notFound();

  const [row] = await db
    .select({ course: courses, tier: courseTiers })
    .from(courseTiers)
    .innerJoin(courses, eq(courses.id, courseTiers.courseId))
    .where(and(eq(courses.slug, course), eq(courseTiers.code, tier)));
  if (!row || row.tier.priceMinor === null) notFound();

  return (
    <AuthShell
      locale={locale}
      heading='Тестова оплата'
      sub='Режим тестування Stripe: лише для e-mail зі списку команди. Гроші не списуються.'
      minimal
    >
      <p>
        <b>{row.course.title.uk}</b>
        {row.course.kind === 'online' ? ` — ${row.tier.name}` : ''}
        <br />
        {formatPln(row.tier.priceMinor)}
      </p>
      <form className='app_form' action={startTestCheckout}>
        <input type='hidden' name='locale' value={locale} />
        <input type='hidden' name='course' value={row.course.slug} />
        <input type='hidden' name='tier' value={row.tier.code} />
        <div className='field'>
          <label htmlFor='test-email'>E-mail зі списку тестувальників</label>
          <input
            id='test-email'
            type='email'
            name='email'
            autoComplete='email'
            required
          />
        </div>
        <button type='submit' className='btn hv-btn-glow'>
          Перейти до тестової оплати
        </button>
      </form>
    </AuthShell>
  );
}
