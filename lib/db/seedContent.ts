import { and, eq } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import { catalog, courseDetails, courseKind } from '@/lib/content/courses';
import { serviceDbName, serviceGroups } from '@/lib/content/salon';
import { SEED_PRICES } from '@/lib/courses/seedPrices';

import * as schema from './schema';

const { courses, courseTiers, lessons, services } = schema;

/** Any Drizzle Postgres database with the app schema (Neon, node-postgres or PGlite). */
export type SeedDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Idempotent content seed: courses (catalog), tiers with the owner's conditional prices,
 * the lessons of the online course, salon services. Existing rows are never overwritten —
 * admin edits survive a re-run. Used by `npm run db:seed` and by the demo database.
 */
export async function seedContent(db: SeedDb) {
  const created = { courses: 0, tiers: 0, lessons: 0, services: 0 };

  for (const [i, card] of catalog.entries()) {
    const detail = courseDetails.find((d) => d.slug === card.slug);
    // courseKind, not detail.format: the personal mentoring is offline and has no CourseDetail.
    const kind = courseKind(card.slug);
    const inserted = await db
      .insert(courses)
      .values({
        slug: card.slug,
        kind,
        title: card.title,
        status: card.status === 'coming_soon' ? 'soon' : 'available',
        position: i,
      })
      .onConflictDoNothing({ target: courses.slug })
      .returning({ id: courses.id });
    created.courses += inserted.length;

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.slug, card.slug));
    if (!detail) continue;

    for (const [j, tier] of detail.tiers.entries()) {
      const price = SEED_PRICES[card.slug]?.[tier.id] ?? null;
      const t = await db
        .insert(courseTiers)
        .values({
          courseId: course.id,
          code: tier.id,
          name: tier.name,
          priceMinor: price,
          priceIsPlaceholder: price !== null,
          position: j,
        })
        .onConflictDoNothing()
        .returning({ id: courseTiers.id });
      created.tiers += t.length;
    }

    if (kind === 'online' && detail.programIsLessons) {
      for (const [k, row] of detail.program.entries()) {
        const exists = await db
          .select({ id: lessons.id })
          .from(lessons)
          .where(
            and(eq(lessons.courseId, course.id), eq(lessons.position, k + 1)),
          );
        if (exists.length) continue;
        await db.insert(lessons).values({
          courseId: course.id,
          position: k + 1,
          title: row.title,
        });
        created.lessons += 1;
      }
    }
  }

  let pos = 0;
  for (const g of serviceGroups) {
    for (const s of g.services) {
      const r = await db
        .insert(services)
        .values({
          id: s.id,
          groupId: g.id,
          name: serviceDbName(s),
          masterPrice: s.master,
          topPrice: s.top ?? null,
          duration: s.duration,
          position: pos++,
        })
        .onConflictDoNothing({ target: services.id })
        .returning({ id: services.id });
      created.services += r.length;
    }
  }

  return created;
}
