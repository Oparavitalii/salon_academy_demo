import type { PriceRow } from '@/components/ServicePricing/ServicePricing';
import type { Locale } from '@/i18n/routing';
import { serviceGroups } from '@/lib/content/salon';
import { t } from '@/lib/i18n/t';
import { type DirectionId, directions } from '@/lib/services/directions';
import { getServiceOverrides } from '@/lib/services/public';
import { rowsOf } from '@/lib/services/rows';

export type SheetGroup = {
  id: string;
  name: string;
  description?: string;
  rows: PriceRow[];
};

export type DirectionSheet = {
  id: DirectionId;
  title: string;
  groups: SheetGroup[];
};

/** Every direction's price list (server only: reads the admin prices) for one locale — the data the ServiceSheet dialog shows. */
export async function getDirectionSheets(
  locale: Locale,
): Promise<DirectionSheet[]> {
  const overrides = await getServiceOverrides();
  return directions.map((d) => ({
    id: d.id,
    title: t(d.title, locale),
    groups: d.groups.flatMap((gid) => {
      const g = serviceGroups.find((x) => x.id === gid);
      if (!g) return [];
      return [
        {
          id: g.id,
          name: t(g.name, locale),
          description: g.description ? t(g.description, locale) : undefined,
          rows: g.services.flatMap((s) =>
            rowsOf(s, overrides.get(s.id), locale),
          ),
        },
      ];
    }),
  }));
}
