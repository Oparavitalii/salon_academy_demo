import type { Locale } from '@/i18n/routing';

export type CheckoutInput = {
  courseId: string;
  tierId: string;
  courseSlug: string;
  kind: 'online' | 'offline';
  title: string;
  amountMinor: number;
  currency: string;
  locale: Locale;
  /** Absolute base, e.g. https://example.com/uk */
  base: string;
  /** Test checkout only: the allowlisted payer's e-mail, locked on the Stripe page. */
  customerEmail?: string;
};

/** Fields of a Checkout Session that both «paid» and «failed» carry. */
type SessionFields = {
  eventId: string;
  sessionId: string;
  paymentIntentId: string | null;
  email: string;
  courseId: string;
  tierId: string | null;
  locale: Locale;
  amountMinor: number;
  currency: string;
  /** Stripe `livemode`; false for test-mode and dev-simulation events. */
  livemode?: boolean;
};

export type PaidEvent = { type: 'paid' } & SessionFields;

/** `checkout.session.async_payment_failed` — recorded as «failed», no access. */
export type FailedEvent = { type: 'failed' } & SessionFields;

export type RefundEvent = {
  type: 'refunded';
  eventId: string;
  paymentIntentId: string;
  /** Only a full refund revokes access; a partial one is logged and ignored. */
  full: boolean;
};

/** `charge.dispute.created` — access revoked at once, admin notified. */
export type DisputeEvent = {
  type: 'disputed';
  eventId: string;
  paymentIntentId: string;
};

export type PaymentEvent =
  | PaidEvent
  | FailedEvent
  | RefundEvent
  | DisputeEvent
  | { type: 'ignored'; eventId: string };

/** The one adapter (Decisions 12.10.2026): swapping the operator touches only this. */
export interface PaymentProvider {
  name: 'stripe' | 'dev';
  createCheckout(input: CheckoutInput): Promise<{ url: string }>;
  parseWebhook(request: Request): Promise<PaymentEvent>;
}
