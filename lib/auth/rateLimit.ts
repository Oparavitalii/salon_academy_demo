import { and, count, eq, gt, inArray, lt } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { authThrottle } from '@/lib/db/schema';

/**
 * DB-backed throttle («Забагато спроб. Спробуйте за хвилину.»), keys separate per IP and per
 * e-mail. ATOMIC by order: every attempt is RECORDED FIRST, then the window is counted — the
 * count always includes this attempt and every concurrent one, so N parallel requests cannot
 * all slip under the limit (they can only be refused together). Survives restarts and works
 * across Fly machines.
 */
const WINDOW_MS = 60_000;
/** Rows older than this are deleted on every attempt (policy §7, B-82). */
const RETENTION_MS = 3_600_000;

export const LIMITS = {
  loginEmail: 5,
  loginIp: 20,
  forgotEmail: 3,
  forgotIp: 10,
} as const;

export type Attempt = { limited: boolean; ids: string[] };

/** Records one attempt per key, then counts: limited when any key is over its maximum. */
export async function attempt(
  checks: { key: string; max: number }[],
): Promise<Attempt> {
  const rows = await db
    .insert(authThrottle)
    .values(checks.map((c) => ({ key: c.key })))
    .returning({ id: authThrottle.id });
  const since = new Date(Date.now() - WINDOW_MS);
  const counts = await Promise.all(
    checks.map(async (c) => {
      const [r] = await db
        .select({ n: count() })
        .from(authThrottle)
        .where(
          and(eq(authThrottle.key, c.key), gt(authThrottle.createdAt, since)),
        );
      return r?.n ?? 0;
    }),
  );
  // B-82 (22.10.2026): privacy policy §7 promises that throttle rows older than one hour are
  // deleted. Deterministic, on every attempt, for EVERY key (login IP + e-mail, password-reset
  // IP + e-mail) — was a 5 % chance before. Counting above only looks back WINDOW_MS (1 min).
  await db
    .delete(authThrottle)
    .where(lt(authThrottle.createdAt, new Date(Date.now() - RETENTION_MS)));
  return {
    limited: counts.some((n, i) => n > checks[i].max),
    ids: rows.map((r) => r.id),
  };
}

/** A successful login: forget this attempt and the e-mail's failures. */
export async function forgive(ids: string[], emailKey: string): Promise<void> {
  if (ids.length)
    await db.delete(authThrottle).where(inArray(authThrottle.id, ids));
  await db.delete(authThrottle).where(eq(authThrottle.key, emailKey));
}
