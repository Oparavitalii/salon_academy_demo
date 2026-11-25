import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthShell, utilityMeta } from '@/components/AuthShell/AuthShell';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { db } from '@/lib/db/client';
import { payments } from '@/lib/db/schema';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ session_id?: string }>;
};

/** Checkout Session ids this site can be returned with (Stripe live/test, dev checkout). */
const SESSION_ID = /^(cs_(test|live)_|dev_cs_)[A-Za-z0-9_-]+$/;

/**
 * The confirmed payment behind a session id, or null. A row exists only after the Stripe
 * webhook, and only `paid` counts — D-14: until then the page must not say «Оплату отримано».
 */
async function confirmedPayment(sessionId: string) {
  if (sessionId.length >= 200) return null;
  const [payment] = await db
    .select({
      email: payments.email,
      kind: payments.kind,
      status: payments.status,
    })
    .from(payments)
    .where(eq(payments.providerSessionId, sessionId));
  return payment?.status === 'paid' ? payment : null;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { session_id: sessionId } = await searchParams;
  // No session to confirm → the page redirects; its title must not claim a payment either.
  if (!sessionId || !SESSION_ID.test(sessionId))
    return { robots: { index: false } };
  const paid = await confirmedPayment(sessionId);
  return utilityMeta(
    (await params).locale,
    paid ? 'checkout' : 'checkoutPending',
  );
}

/**
 * `/checkout/success` — «перевірте пошту» (B-09); no auto-login (the link can be forwarded).
 * Until the webhook lands the page says «обробляється» and refreshes itself every 5 s.
 */
export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  setRequestLocale(locale);
  const tk = await getTranslations('checkout');

  // Phase 12 challenger (19.10): no session id in the shape Stripe (`cs_test_…` / `cs_live_…`) or
  // the dev checkout (`dev_cs_…`) returns → nothing to confirm; never say «Оплату отримано».
  if (!sessionId || !SESSION_ID.test(sessionId)) {
    redirect(`/${locale}/courses`);
  }

  const payment = await confirmedPayment(sessionId);

  if (!payment) {
    return (
      <AuthShell locale={locale} heading={tk('pendingHeading')}>
        {sessionId && <meta httpEquiv='refresh' content='5' />}
        <p className='form_msg' role='status'>
          {tk('pending')}
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell locale={locale} heading={tk('successHeading')}>
      <p>
        {payment.kind === 'offline'
          ? tk('intensiveBody', { email: payment.email })
          : tk('successBody', { email: payment.email })}
      </p>
      {payment.kind === 'online' && (
        <Link className='btn hv-btn-glow' href='/login'>
          {tk('login')}
        </Link>
      )}
    </AuthShell>
  );
}
