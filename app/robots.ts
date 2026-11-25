import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/appUrl';

/** Private paths under every locale prefix — never crawled (B-33). */
const PRIVATE = [
  'login',
  'cabinet',
  'admin',
  'checkout',
  'change-password',
  'forgot-password',
  'reset-password',
];

/** `/robots.txt` (B-33): public pages allowed, private areas and `/api/` closed, sitemap linked. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        ...routing.locales.flatMap((l) => PRIVATE.map((p) => `/${l}/${p}`)),
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
