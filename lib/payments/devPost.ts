import { headers } from 'next/headers';

import { localSimulationAllowed } from '@/lib/demo/mode';

import { signDevBody } from './dev';

/** Same-origin POST to /api/webhooks/payments with the dev HMAC signature. */
export async function postDevEvent(event: object) {
  if (!localSimulationAllowed()) throw new Error('dev only');
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
  const body = JSON.stringify(event);
  const res = await fetch(`${origin}/api/webhooks/payments`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-dev-signature': signDevBody(body),
    },
    body,
  });
  if (!res.ok) throw new Error(`dev webhook answered ${res.status}`);
}
