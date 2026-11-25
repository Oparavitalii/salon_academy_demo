import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/appUrl';
import { coursePageSlugs } from '@/lib/content/courses';

/**
 * `/sitemap.xml` (B-33): public, indexable pages × 4 locales, each with its hreflang alternates.
 * Private areas (login, cabinet, admin, checkout, password pages) are left out, and so is
 * `/privacy` while it is `noindex` (lawyer markers, 9.0_Legal.md).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = [
    '',
    '/salon',
    '/courses',
    // every course page, the personal mentoring (16.11) included
    ...coursePageSlugs.map((slug) => `/courses/${slug}`),
    '/about',
    '/contacts',
  ];
  return paths.flatMap((path) => {
    const languages = {
      ...Object.fromEntries(
        routing.locales.map((l) => [l, `${base}/${l}${path}`]),
      ),
      'x-default': `${base}/${routing.defaultLocale}${path}`,
    };
    return routing.locales.map((l) => ({
      url: `${base}/${l}${path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
      alternates: { languages },
    }));
  });
}
