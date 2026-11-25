import { db, hasDb } from '@/lib/db/client';
import { services } from '@/lib/db/schema';

export type ServiceOverride = {
  masterPrice: string | null;
  topPrice: string | null;
  duration: string | null;
};

/**
 * Salon prices/durations edited in /admin/services, keyed by the service id of
 * `lib/content/salon.ts`. Empty map when the DB is not configured or unreachable —
 * /salon then shows the static Booksy data (19.10.2026).
 */
export async function getServiceOverrides(): Promise<
  Map<string, ServiceOverride>
> {
  if (!hasDb) return new Map();
  try {
    const rows = await db.select().from(services);
    return new Map(
      rows.map((r) => [
        r.id,
        {
          masterPrice: r.masterPrice,
          topPrice: r.topPrice,
          duration: r.duration,
        },
      ]),
    );
  } catch {
    console.warn('[services] DB unreachable — static salon prices used');
    return new Map();
  }
}
