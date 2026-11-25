import type { PriceRow } from '@/components/ServicePricing/ServicePricing';
import type { Locale } from '@/i18n/routing';
import {
  type PriceNote,
  priceWords as W,
  type Service,
} from '@/lib/content/salon';
import { t } from '@/lib/i18n/t';
import { localizeUnits } from '@/lib/i18n/units';
import type { ServiceOverride } from '@/lib/services/public';

/** A price that already says «from» in any locale (an admin may type «від 400 zł» or «od 400 zł»). */
const SAYS_FROM = /^(від|от|od|from)\s/i;

/**
 * Dana 16.11.2026 «Все цены нужно указать от»: every salon price reads «від …», once before the
 * whole range («від 400 / 500 / 600 / 700 zł»). Applied here, at render, because on production the
 * row comes from the DB (/admin/prices, seeded with the old strings without «від»); a value that
 * already says «від» is not doubled, and one without a digit (free text) is left alone.
 */
export function fromPrice<T extends string | null | undefined>(v: T): T {
  if (!v) return v;
  const p = v.trim();
  return (/\d/.test(p) && !SAYS_FROM.test(p) ? `від ${p}` : p) as T;
}

/** Rows of one service: «майстер» (or Base) and, when Booksy has one, «TOP mistrz» (9_Text.md). */
export function rowsOf(
  s: Service,
  o: ServiceOverride | undefined,
  locale: Locale,
): PriceRow[] {
  const u = (v: string | null | undefined) =>
    v ? localizeUnits(v, locale) : null;
  const notes = (n?: PriceNote[]) =>
    (n ?? []).map((x) => {
      const label = typeof x.label === 'string' ? x.label : t(x.label, locale);
      // «перший візит від 990 zł» → «от / od / from» (16.11: the note values carry «від» now)
      return x.value ? `${label} ${localizeUnits(x.value, locale)}` : label;
    });
  const consult = t(W.onConsultation, locale);
  const duration = o?.duration ?? s.duration;
  const master = fromPrice(o ? o.masterPrice : s.master);
  const top = fromPrice(o ? o.topPrice : (s.top ?? null));
  const name = t(s.name, locale);
  const level = s.level === 'base' ? W.levelBase : t(W.levelMaster, locale);
  const rows: PriceRow[] = [
    {
      key: s.id,
      name,
      meta: [level, u(duration), ...notes(s.notes)].filter(Boolean).join(' · '),
      price: s.hidePrice ? consult : u(master),
      priceIsNote: s.hidePrice,
    },
  ];
  if (top || s.topDuration || (s.hidePrice && s.top)) {
    rows.push({
      key: `${s.id}-top`,
      name,
      meta: [W.levelTop, u(s.topDuration ?? duration), ...notes(s.topNotes)]
        .filter(Boolean)
        .join(' · '),
      price: s.hidePrice ? consult : u(top),
      priceIsNote: s.hidePrice,
    });
  }
  return rows;
}
