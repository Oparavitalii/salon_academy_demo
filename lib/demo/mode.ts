/**
 * PUBLIC DEMO switch. `DEMO_MODE=1` runs the whole app with zero external accounts:
 * - no `DATABASE_URL` → an embedded Postgres (PGlite, in-process) built from the real migrations in
 *   `drizzle/` and seeded with fictional data (`lib/demo/seed.ts`);
 * - no `STRIPE_SECRET_KEY` → the local checkout simulation (`lib/payments/dev.ts`) posts a signed
 *   «paid» event to the real webhook route, so fulfilment runs exactly as with Stripe;
 * - no `RESEND_API_KEY` → letters are logged and written to the git-ignored `.dev_outbox/`;
 * - no Bunny keys → lesson pages show the «video not uploaded yet» state.
 * Real keys still win when they are set. Never set DEMO_MODE on a real deployment.
 */
export function isDemoMode(): boolean {
  const v = process.env.DEMO_MODE;
  return v === '1' || v === 'true';
}

/** The local simulations (dev checkout, e-mail outbox) may run: development, or the public demo. */
export function localSimulationAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || isDemoMode();
}
