import type { Localized } from '@/i18n/routing';

/**
 * A whole-euro course price as shown on the site: «990 €» (uk, ru, pl), «€990» (en) — the same
 * forms as the `coursePrice` strings in `lib/content/courses.ts` and their dict entries.
 */
export function eurPrice(n: number): Localized {
  const v = n.toLocaleString('uk-UA').replace(/\s/g, ' ');
  return { uk: `${v} €`, pl: `${v} €`, en: `€${v}` };
}

/** The site price of a course: the admin's (/admin/prices) when set, else the one in code. */
export function sitePrice(
  fallback: Localized,
  priceEur: number | null | undefined,
): Localized {
  return priceEur ? eurPrice(priceEur) : fallback;
}
