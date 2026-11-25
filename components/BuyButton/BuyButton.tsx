import { startCheckout } from '@/app/[locale]/checkout/_actions';
import type { Locale } from '@/i18n/routing';
import { academyDirectUrl, enrolCopy } from '@/lib/content/floor';
import { t } from '@/lib/i18n/t';
import {
  offlineSalesAvailable,
  paymentsAvailable,
  placeholderPricesSellable,
} from '@/lib/payments';

/**
 * «Купити» → server action → Stripe Checkout (FR-11, FR-12, FR-22). A plain `<form>`: works
 * without JS and keeps the page static (ISR). No price, or a conditional price while the Stripe
 * key is live, or production without a Stripe key / Resend → a working «Записатися на курс» link
 * to the academy's Instagram Direct (Release floor F3, owner 20.10.2026 — never a disabled
 * button). Nothing is ever faked: no checkout is offered that cannot run. The server action
 * re-checks all of it.
 */
export function BuyButton({
  locale,
  course,
  tier,
  priceMinor,
  placeholder = false,
  offline = false,
  label,
  className = 'btn hv-btn-lift',
}: {
  locale: Locale;
  course: string;
  tier: string;
  priceMinor: number | null;
  /** `course_tiers.price_is_placeholder` */
  placeholder?: boolean;
  /** Offline intensive: also needs ADMIN_EMAIL in production. */
  offline?: boolean;
  label: string;
  /** Kept for callers; no longer rendered — the fallback is the enrol link (F3). */
  priceSoon?: string;
  paySoon?: string;
  className?: string;
}) {
  const noPrice =
    priceMinor === null || (placeholder && !placeholderPricesSellable());
  const checkoutWorks =
    paymentsAvailable() && (!offline || offlineSalesAvailable());
  if (noPrice || !checkoutWorks) {
    return (
      <a
        className={className}
        href={academyDirectUrl}
        target='_blank'
        rel='noopener'
      >
        {t(enrolCopy.cta, locale)}
      </a>
    );
  }
  return (
    <form action={startCheckout} className='buy_form'>
      <input type='hidden' name='locale' value={locale} />
      <input type='hidden' name='course' value={course} />
      <input type='hidden' name='tier' value={tier} />
      <button type='submit' className={className}>
        {label}
      </button>
    </form>
  );
}
