import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { routing, type Locale } from '@/i18n/routing';
import { siteUrl } from '@/lib/appUrl';

type MetaKey =
  | 'home'
  | 'salon'
  | 'courses'
  | 'about'
  | 'contacts'
  | 'privacy'
  | 'terms'
  | 'login'
  | 'cabinet'
  | 'checkout'
  | 'forgotPassword'
  | 'resetPassword';

/** Absolute canonical + hreflang (4 locales + x-default → uk) for one path (B-33). */
export function alternatesFor(
  locale: Locale,
  path: string,
): NonNullable<Metadata['alternates']> {
  const base = siteUrl();
  return {
    canonical: `${base}/${locale}${path}`,
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [l, `${base}/${l}${path}`]),
      ),
      'x-default': `${base}/${routing.defaultLocale}${path}`,
    },
  };
}

/** Pages with their own 1200×630 preview in `public/og/<key>_<locale>.jpg` (scripts/og_images.mjs). */
const OG_KEYS = ['home', 'salon', 'courses', 'about', 'contacts'] as const;
const OG_LOCALE: Record<Locale, string> = {
  uk: 'uk_UA',
  pl: 'pl_PL',
  en: 'en_GB',
};

/**
 * Open Graph + X card for a shared link (owner 28.10; skill Web_Seo_Meta_Header): absolute image
 * URL, 1200×630, the page's own title and description. Pages without their own picture use `home`.
 */
export function socialMeta(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  ogKey: string = 'home',
): Pick<Metadata, 'openGraph' | 'twitter'> {
  const base = siteUrl();
  const key = (OG_KEYS as readonly string[]).includes(ogKey) ? ogKey : 'home';
  const image = {
    url: `${base}/og/${key}_${locale}.jpg`,
    width: 1200,
    height: 630,
    alt: title,
    type: 'image/jpeg',
  };
  return {
    openGraph: {
      type: 'website',
      siteName: 'Studio Demo',
      locale: OG_LOCALE[locale],
      url: `${base}/${locale}${path}`,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}

/** Title + description from `messages/<locale>.json → meta.<key>`, canonical and hreflang per locale. */
export async function pageMeta(
  locale: Locale,
  key: MetaKey,
  path: string,
  extra: Metadata = {},
): Promise<Metadata> {
  const tr = await getTranslations({ locale, namespace: 'meta' });
  const title = tr(`${key}.title`);
  const description = tr(`${key}.description`);
  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    ...socialMeta(locale, path, title, description, key),
    ...extra,
  };
}
