import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['uk', 'pl', 'en'],
  defaultLocale: 'uk',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
export type Localized = Record<Locale, string>;
