import Stripe from 'stripe';

import { routing, type Locale } from '@/i18n/routing';

import type { PaymentEvent, PaymentProvider } from './types';

const asLocale = (v: unknown): Locale =>
  (routing.locales as readonly string[]).includes(String(v))
    ? (v as Locale)
    : routing.defaultLocale;

/**
 * Stripe hosted Checkout (4.4_Payments): one-time payment in PLN; Stripe shows BLIK,
 * Przelewy24, cards, Apple Pay and Google Pay from the dashboard's payment-method settings
 * (no `payment_method_types` → dynamic methods). The buyer types only the e-mail.
 */
export function createStripeProvider(secretKey: string): PaymentProvider {
  const stripe = new Stripe(secretKey);

  return {
    name: 'stripe',

    async createCheckout(input) {
      const meta = {
        courseId: input.courseId,
        tierId: input.tierId,
        kind: input.kind,
        locale: input.locale,
      };
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency,
              unit_amount: input.amountMinor,
              product_data: { name: input.title },
            },
          },
        ],
        metadata: meta,
        payment_intent_data: { metadata: meta },
        ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
        locale: 'auto',
        success_url: `${input.base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.base}/checkout/cancel?course=${encodeURIComponent(input.courseSlug)}`,
      });
      if (!session.url) throw new Error('stripe: no checkout url');
      return { url: session.url };
    },

    async parseWebhook(request) {
      const body = await request.text();
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      let event: Stripe.Event;
      if (secret) {
        event = stripe.webhooks.constructEvent(
          body,
          request.headers.get('stripe-signature') ?? '',
          secret,
        );
      } else if (process.env.NODE_ENV !== 'production') {
        // Local `stripe trigger` without a signing secret — development only.
        event = JSON.parse(body) as Stripe.Event;
      } else {
        throw new Error('stripe: STRIPE_WEBHOOK_SECRET is not set');
      }
      return toPaymentEvent(event);
    },
  };
}

function toPaymentEvent(event: Stripe.Event): PaymentEvent {
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const s = event.data.object;
    if (s.payment_status !== 'paid' || !s.metadata?.courseId) {
      return { type: 'ignored', eventId: event.id };
    }
    const email = s.customer_details?.email ?? s.customer_email;
    if (!email) return { type: 'ignored', eventId: event.id };
    return {
      type: 'paid',
      eventId: event.id,
      sessionId: s.id,
      paymentIntentId:
        typeof s.payment_intent === 'string'
          ? s.payment_intent
          : (s.payment_intent?.id ?? null),
      email: email.toLowerCase(),
      courseId: s.metadata.courseId,
      tierId: s.metadata.tierId || null,
      locale: asLocale(s.metadata.locale),
      amountMinor: s.amount_total ?? 0,
      currency: s.currency ?? 'pln',
      livemode: event.livemode,
    };
  }
  if (event.type === 'checkout.session.async_payment_failed') {
    const s = event.data.object;
    if (!s.metadata?.courseId) return { type: 'ignored', eventId: event.id };
    return {
      type: 'failed',
      eventId: event.id,
      sessionId: s.id,
      paymentIntentId:
        typeof s.payment_intent === 'string'
          ? s.payment_intent
          : (s.payment_intent?.id ?? null),
      email: (
        s.customer_details?.email ??
        s.customer_email ??
        ''
      ).toLowerCase(),
      courseId: s.metadata.courseId,
      tierId: s.metadata.tierId || null,
      locale: asLocale(s.metadata.locale),
      amountMinor: s.amount_total ?? 0,
      currency: s.currency ?? 'pln',
      livemode: event.livemode,
    };
  }
  if (event.type === 'charge.dispute.created') {
    const d = event.data.object;
    const pi =
      typeof d.payment_intent === 'string'
        ? d.payment_intent
        : d.payment_intent?.id;
    if (!pi) return { type: 'ignored', eventId: event.id };
    return { type: 'disputed', eventId: event.id, paymentIntentId: pi };
  }
  if (event.type === 'charge.refunded') {
    const c = event.data.object;
    const pi =
      typeof c.payment_intent === 'string'
        ? c.payment_intent
        : c.payment_intent?.id;
    if (!pi) return { type: 'ignored', eventId: event.id };
    return {
      type: 'refunded',
      eventId: event.id,
      paymentIntentId: pi,
      full: c.refunded === true,
    };
  }
  return { type: 'ignored', eventId: event.id };
}
