import type { Locale } from '@/i18n/routing';

// Price and duration strings come from Booksy / the admin in Ukrainian form («від 400 zł»,
// «2 год 30 хв»). They are data, not dictionary copy, so the units are swapped at render time
// (Release floor F2, 20.10.2026). JS `\b` does not see Cyrillic letters, hence the lookarounds.
const NOT_LETTER = '(?![а-яіїєґА-ЯІЇЄҐ])';
const rules = (from: string, h: string, min: string): [RegExp, string][] => [
  [new RegExp(`(^|\\s)від(?=\\s)`, 'g'), `$1${from}`],
  [new RegExp(`(\\d)\\s*год${NOT_LETTER}`, 'g'), `$1 ${h}`],
  [new RegExp(`(\\d)\\s*хв${NOT_LETTER}`, 'g'), `$1 ${min}`],
];

const UNITS: Record<Exclude<Locale, 'uk'>, [RegExp, string][]> = {
  pl: rules('od', 'godz.', 'min'),
  en: rules('from', 'h', 'min'),
};

/** «від 1 350 zł» → «from 1 350 zł» · «2 год 30 хв» → «2 h 30 min». Ukrainian stays as is. */
export function localizeUnits<T extends string | null>(
  s: T,
  locale: Locale,
): T {
  if (s === null || locale === 'uk') return s;
  return UNITS[locale].reduce<string>(
    (acc, [re, to]) => acc.replace(re, to),
    s,
  ) as T;
}
