import { asc, eq } from 'drizzle-orm';

import { catalog, courseDetails } from '@/lib/content/courses';
import { db, hasDb } from '@/lib/db/client';
import { courses, courseTiers } from '@/lib/db/schema';

import { SEED_PRICES } from './seedPrices';

export type PublicTier = {
  code: string;
  priceMinor: number | null;
  placeholder: boolean;
};
export type PublicCourse = {
  slug: string;
  status: 'available' | 'soon';
  /** Site price in whole euros from /admin/prices; null = the price in code. */
  priceEur: number | null;
  tiers: PublicTier[];
};

function fallback(): PublicCourse[] {
  return catalog.map((c) => ({
    slug: c.slug,
    status: c.status === 'coming_soon' ? 'soon' : 'available',
    priceEur: null,
    tiers:
      courseDetails
        .find((d) => d.slug === c.slug)
        ?.tiers.map((t) => ({
          code: t.id,
          priceMinor: SEED_PRICES[c.slug]?.[t.id] ?? null,
          placeholder: true,
        })) ?? [],
  }));
}

/**
 * Status + tier prices for the public catalog and course pages (ISR). Reads the DB set in
 * /admin/courses; if the DB is not configured or unreachable (e.g. the Docker build has no
 * DATABASE_URL), falls back to the static catalog with the seed prices.
 */
export async function getPublicCourses(): Promise<PublicCourse[]> {
  if (!hasDb) return fallback();
  try {
    const rows = await db
      .select({
        slug: courses.slug,
        status: courses.status,
        priceEur: courses.priceEur,
        code: courseTiers.code,
        priceMinor: courseTiers.priceMinor,
        placeholder: courseTiers.priceIsPlaceholder,
      })
      .from(courses)
      .leftJoin(courseTiers, eq(courseTiers.courseId, courses.id))
      .orderBy(asc(courses.position), asc(courseTiers.position));
    if (!rows.length) return fallback();
    const map = new Map<string, PublicCourse>();
    for (const r of rows) {
      const c = map.get(r.slug) ?? {
        slug: r.slug,
        status: r.status,
        priceEur: r.priceEur,
        tiers: [],
      };
      if (r.code)
        c.tiers.push({
          code: r.code,
          priceMinor: r.priceMinor,
          placeholder: r.placeholder ?? false,
        });
      map.set(r.slug, c);
    }
    return [...map.values()];
  } catch {
    console.warn('[courses] DB unreachable — static catalog used');
    return fallback();
  }
}

export function minPrice(c: PublicCourse | undefined): number | null {
  const prices = (c?.tiers ?? [])
    .map((t) => t.priceMinor)
    .filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

/** What the public course lists need: which courses are on, and the admin's euro prices. */
export type CourseView = {
  available: Set<string>;
  priceEur: Map<string, number>;
};

export async function getCourseView(): Promise<CourseView> {
  const pub = await getPublicCourses();
  return {
    available: new Set(
      pub.filter((c) => c.status === 'available').map((c) => c.slug),
    ),
    priceEur: new Map(
      pub
        .filter((c): c is PublicCourse & { priceEur: number } => !!c.priceEur)
        .map((c) => [c.slug, c.priceEur]),
    ),
  };
}
