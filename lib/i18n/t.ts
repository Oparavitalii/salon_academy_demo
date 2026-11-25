import type { Locale, Localized } from '@/i18n/routing';

import en from './dict/en.json';
import pl from './dict/pl.json';

/** Read a localized string; falls back to Ukrainian (the project language). */
export function t(value: Localized, locale: Locale): string {
  return value[locale] ?? value.uk;
}

const DICT: Record<'pl' | 'en', Record<string, string>> = { pl, en };

/**
 * One Ukrainian string → all three locales. PL / EN come from `lib/i18n/dict/<locale>.json`,
 * keyed by the Ukrainian text (draft translations 20.10.2026, native check pending — Release
 * floor F2). A missing key falls back to Ukrainian, which the release-floor probe reports.
 * `scripts/i18n_extract.ts` lists every key in `dict/_source_uk.json`.
 */
export function uk4(s: string): Localized {
  (globalThis as { __uk4Collect?: Set<string> }).__uk4Collect?.add(s);
  return {
    uk: s,
    pl: DICT.pl[s] ?? s,
    en: DICT.en[s] ?? s,
  };
}
