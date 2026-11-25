/**
 * Liveness probe for Fly (`[[http_service.checks]]` in fly.toml). Never touches the DB, so a slow
 * or sleeping Neon cannot fail it. `/api/*` is outside the proxy.ts matcher — no locale redirect.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
