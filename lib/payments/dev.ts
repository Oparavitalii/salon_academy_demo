import { createHmac, timingSafeEqual } from 'node:crypto';

import { localSimulationAllowed } from '@/lib/demo/mode';

import type { PaymentEvent, PaymentProvider } from './types';

/**
 * Local test checkout — ONLY when there is no STRIPE_SECRET_KEY and NODE_ENV !== 'production'
 * (or DEMO_MODE=1, the public demo).
 * «Купити» opens `/checkout/dev`, which posts a signed «paid» event to the real webhook route,
 * so account → enrollment → e-mail run exactly as with Stripe. Never active in production.
 */
const secret = () => process.env.AUTH_SECRET ?? 'dev-only';

export function signDevBody(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('hex');
}

export const devProvider: PaymentProvider = {
  name: 'dev',

  async createCheckout(input) {
    const q = new URLSearchParams({ tier: input.tierId });
    return { url: `${input.base}/checkout/dev?${q}` };
  },

  async parseWebhook(request) {
    if (!localSimulationAllowed()) throw new Error('dev: disabled');
    const body = await request.text();
    const sig = request.headers.get('x-dev-signature') ?? '';
    const expected = signDevBody(body);
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      throw new Error('dev: bad signature');
    }
    return JSON.parse(body) as PaymentEvent;
  },
};
