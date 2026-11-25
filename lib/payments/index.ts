import { isDemoMode } from '@/lib/demo/mode';
import { adminInbox, emailConfigured } from '@/lib/email/send';

import { devProvider } from './dev';
import { createStripeProvider } from './stripe';
import type { PaymentProvider } from './types';

/** Production rules apply — not in development and not in the public demo (DEMO_MODE=1). */
const isProd = () => process.env.NODE_ENV === 'production' && !isDemoMode();

/** `STRIPE_SECRET_KEY` starts with `sk_test_` (only the prefix is read, never logged). */
export function isStripeTestKey(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'));
}

/**
 * Stripe when STRIPE_SECRET_KEY is set; the local simulation in development without it;
 * null in production without a key → buy buttons read «Оплата незабаром», nothing is faked.
 */
export function getPaymentProvider(): PaymentProvider | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key) return createStripeProvider(key);
  if (!isProd()) return devProvider;
  return null;
}

/**
 * PUBLIC buy buttons are live only when a provider exists AND, in production:
 * the key is LIVE (a test key on the real domain would hand out real access for free — test
 * checkouts go through the allowlisted `/checkout/test` page instead) and the access letter can
 * really be sent (Resend).
 */
export function paymentsAvailable(): boolean {
  if (getPaymentProvider() === null) return false;
  if (!isProd()) return true;
  return emailConfigured() && !isStripeTestKey();
}

/**
 * The offline intensive also needs the studio's inbox in production: without ADMIN_EMAIL nobody
 * would learn that a buyer is waiting for a date.
 */
export function offlineSalesAvailable(): boolean {
  return !isProd() || adminInbox() !== null;
}

/**
 * Owner's conditional prices (`price_is_placeholder`) are sellable only in a test setting:
 * a Stripe TEST key (prefix only) or the dev simulation. With a live key they are refused and
 * the button reads «Ціну уточнюємо» (Manager, 19.10.2026).
 */
export function placeholderPricesSellable(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key) return key.startsWith('sk_test_');
  return !isProd();
}

/**
 * Who may pay in TEST mode on production: `TEST_CHECKOUT_ALLOWLIST` (comma-separated) plus
 * `ADMIN_EMAIL`. Test checkouts and their letters reach only these addresses.
 */
export function testAllowlist(): Set<string> {
  const list = (process.env.TEST_CHECKOUT_ALLOWLIST ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const admin = adminInbox();
  if (admin) list.push(admin);
  return new Set(list);
}

export function isAllowlistedTester(email: string): boolean {
  return testAllowlist().has(email.trim().toLowerCase());
}

/** `/checkout/test` exists only with a Stripe test key and Resend (a real test letter). */
export function testCheckoutAvailable(): boolean {
  return isStripeTestKey() && (!isProd() || emailConfigured());
}
