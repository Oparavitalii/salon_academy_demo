import { localSimulationAllowed } from '@/lib/demo/mode';
import { getPaymentProvider } from '@/lib/payments';
import { devProvider } from '@/lib/payments/dev';
import { handlePaymentEvent } from '@/lib/payments/fulfil';

/**
 * Payment webhook (Stripe → `/api/webhooks/payments`). 400 on a bad signature, 500 when the
 * work failed (Stripe retries), 200 otherwise — duplicates included.
 */
export async function POST(request: Request) {
  const provider =
    request.headers.has('x-dev-signature') && localSimulationAllowed()
      ? devProvider
      : getPaymentProvider();
  if (!provider) return new Response(null, { status: 503 });

  let event;
  try {
    event = await provider.parseWebhook(request);
  } catch {
    return new Response(null, { status: 400 });
  }

  try {
    const result = await handlePaymentEvent(event);
    return Response.json({ ok: true, result });
  } catch (e) {
    console.error(
      '[webhook] failed:',
      e instanceof Error ? e.message : 'unknown error',
    );
    return new Response(null, { status: 500 });
  }
}
