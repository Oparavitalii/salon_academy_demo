import { asc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { AuthShell } from '@/components/AuthShell/AuthShell';
import { BuyButton } from '@/components/BuyButton/BuyButton';
import type { Locale } from '@/i18n/routing';
import { formatPln } from '@/lib/courses/seedPrices';
import { db } from '@/lib/db/client';
import { courses, courseTiers } from '@/lib/db/schema';
import { isDemoMode } from '@/lib/demo/mode';

type Props = { params: Promise<{ locale: Locale }> };

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Demo checkout',
  robots: { index: false },
};

const COPY: Record<Locale, { heading: string; sub: string; buy: string }> = {
  uk: {
    heading: 'Демо-оплата',
    sub: 'Оберіть курс: симуляція Stripe надішле підписану подію «оплачено» на справжній webhook — акаунт, доступ і лист створюються так само, як після реальної оплати.',
    buy: 'Купити',
  },
  pl: {
    heading: 'Płatność demo',
    sub: 'Wybierz kurs: symulacja Stripe wyśle podpisane zdarzenie «opłacone» na prawdziwy webhook — konto, dostęp i e-mail powstają tak samo jak po prawdziwej płatności.',
    buy: 'Kup',
  },
  en: {
    heading: 'Demo checkout',
    sub: 'Pick a course: the Stripe stand-in posts a signed «paid» event to the real webhook route, which creates the account, the access and the letter exactly as after a real payment.',
    buy: 'Buy',
  },
};

/**
 * PUBLIC DEMO only (DEMO_MODE=1). Production sold through the academy's Instagram Direct while the
 * Stripe flow was being switched on; in the demo the «Sign up» buttons land here, so the whole
 * checkout → webhook → fulfilment path can be tried without a Stripe account.
 */
export default async function DemoCheckoutPage({ params }: Props) {
  if (!isDemoMode()) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const c = COPY[locale];

  const rows = await db
    .select({ course: courses, tier: courseTiers })
    .from(courseTiers)
    .innerJoin(courses, eq(courses.id, courseTiers.courseId))
    .where(eq(courses.status, 'available'))
    .orderBy(asc(courses.position), asc(courseTiers.position));
  const sellable = rows.filter((r) => r.tier.priceMinor !== null);

  return (
    <AuthShell locale={locale} heading={c.heading} sub={c.sub}>
      <ul className='demo_checkout'>
        {sellable.map(({ course, tier }) => (
          <li key={tier.id}>
            <p>
              <b>{course.title[locale] ?? course.title.uk}</b>
              {course.kind === 'online' ? ` — ${tier.name}` : ''}
              <br />
              {formatPln(tier.priceMinor!)}
            </p>
            <BuyButton
              locale={locale}
              course={course.slug}
              tier={tier.code}
              priceMinor={tier.priceMinor}
              placeholder={tier.priceIsPlaceholder}
              offline={course.kind === 'offline'}
              label={`${c.buy} — ${formatPln(tier.priceMinor!)}`}
            />
          </li>
        ))}
      </ul>
    </AuthShell>
  );
}
