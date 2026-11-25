import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { AuthShell } from '@/components/AuthShell/AuthShell';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatPln } from '@/lib/courses/seedPrices';
import { db } from '@/lib/db/client';
import { courses, courseTiers } from '@/lib/db/schema';
import { localSimulationAllowed } from '@/lib/demo/mode';

import { devCompleteCheckout } from '../_actions';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ tier?: string }>;
};

const COPY: Record<
  Locale,
  { heading: string; sub: string; pay: string; cancel: string }
> = {
  uk: {
    heading: 'Тестова оплата',
    sub: 'Симуляція сторінки Stripe: лише в розробці та демо, гроші не списуються.',
    pay: 'Оплатити (симуляція)',
    cancel: 'Скасувати',
  },
  pl: {
    heading: 'Płatność testowa',
    sub: 'Symulacja strony Stripe: tylko w trybie deweloperskim i demo, bez pobierania pieniędzy.',
    pay: 'Zapłać (symulacja)',
    cancel: 'Anuluj',
  },
  en: {
    heading: 'Test payment',
    sub: 'A stand-in for the Stripe page: development and demo only, no money is charged.',
    pay: 'Pay (simulated)',
    cancel: 'Cancel',
  },
};

export const metadata: Metadata = {
  title: 'Test payment (dev)',
  robots: { index: false },
};

/**
 * DEV ONLY — stands in for the Stripe page while STRIPE_SECRET_KEY is empty. 404 in
 * production and as soon as a Stripe key exists.
 */
export default async function DevCheckoutPage({ params, searchParams }: Props) {
  if (!localSimulationAllowed() || process.env.STRIPE_SECRET_KEY) notFound();
  const { locale } = await params;
  const { tier } = await searchParams;
  setRequestLocale(locale);
  if (!tier || !/^[0-9a-f-]{36}$/.test(tier)) notFound();

  const [row] = await db
    .select({ course: courses, tier: courseTiers })
    .from(courseTiers)
    .innerJoin(courses, eq(courses.id, courseTiers.courseId))
    .where(eq(courseTiers.id, tier));
  if (!row || row.tier.priceMinor === null) notFound();

  return (
    <AuthShell
      locale={locale}
      heading={COPY[locale].heading}
      sub={COPY[locale].sub}
      minimal
    >
      <p>
        <b>{row.course.title[locale] ?? row.course.title.uk}</b>
        {row.course.kind === 'online' ? ` — ${row.tier.name}` : ''}
        <br />
        {formatPln(row.tier.priceMinor)}
      </p>
      <form className='app_form' action={devCompleteCheckout}>
        <input type='hidden' name='locale' value={locale} />
        <input type='hidden' name='tier' value={row.tier.id} />
        <div className='field'>
          <label htmlFor='dev-email'>E-mail</label>
          <input
            id='dev-email'
            type='email'
            name='email'
            autoComplete='email'
            required
          />
        </div>
        <button type='submit' className='btn hv-btn-glow'>
          {COPY[locale].pay}
        </button>
      </form>
      <Link
        className='note hv-link'
        href={`/checkout/cancel?course=${row.course.slug}`}
      >
        {COPY[locale].cancel}
      </Link>
    </AuthShell>
  );
}
