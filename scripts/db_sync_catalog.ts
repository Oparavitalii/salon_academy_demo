/**
 * Brings DB names in line with `lib/content` (D-40, D-22). Dry run by default; `--apply` writes.
 *   - courses.title ← catalog card title (per slug; status, prices untouched); a catalog course
 *     missing in the DB is inserted (slug, kind, title, status, position — 16.11)
 *   - services.name / group_id / position ← serviceGroups (prices and duration untouched — the
 *     admin edits those in /admin/prices); services missing in the DB are inserted with the
 *     content's prices.
 * Never deletes: DB rows unknown to the content are only listed.
 *   npm run db:sync-catalog [-- --apply]
 */
import { eq } from 'drizzle-orm';

import { catalog, courseKind } from '@/lib/content/courses';
import { serviceDbName, serviceGroups } from '@/lib/content/salon';
import { db } from '@/lib/db/client';
import { courses, services } from '@/lib/db/schema';

const apply = process.argv.includes('--apply');

async function main() {
  const changes: string[] = [];

  const dbCourses = await db.select().from(courses);
  for (const [i, card] of catalog.entries()) {
    const row = dbCourses.find((c) => c.slug === card.slug);
    if (!row) {
      // 16.11 (personal mentoring): a new catalog course is inserted here, as db:seed would — the public
      // catalog and the first-screen tiles show only courses that are «available» in the DB.
      changes.push(
        `course ${card.slug}: insert «${card.title.uk}» (${courseKind(card.slug)}, available, position ${i})`,
      );
      if (apply)
        await db
          .insert(courses)
          .values({
            slug: card.slug,
            kind: courseKind(card.slug),
            title: card.title,
            status: card.status === 'coming_soon' ? 'soon' : 'available',
            position: i,
          })
          .onConflictDoNothing({ target: courses.slug });
      continue;
    }
    // jsonb keeps its own key order — compare per locale, not as a string.
    const differ = (
      Object.keys(card.title) as (keyof typeof card.title)[]
    ).filter((l) => row.title?.[l] !== card.title[l]);
    if (!differ.length) continue;
    changes.push(
      `course ${card.slug}: title ${differ.join('/')} — uk «${row.title?.uk}» → «${card.title.uk}»`,
    );
    if (apply)
      await db
        .update(courses)
        .set({ title: card.title, updatedAt: new Date() })
        .where(eq(courses.id, row.id));
  }

  const dbServices = await db.select().from(services);
  const known = new Set<string>();
  let pos = 0;
  for (const g of serviceGroups) {
    for (const s of g.services) {
      known.add(s.id);
      const position = pos++;
      const row = dbServices.find((r) => r.id === s.id);
      if (!row) {
        changes.push(`service ${s.id}: insert «${serviceDbName(s)}» (${g.id})`);
        if (apply)
          await db.insert(services).values({
            id: s.id,
            groupId: g.id,
            name: serviceDbName(s),
            masterPrice: s.master,
            topPrice: s.top ?? null,
            duration: s.duration,
            position,
          });
        continue;
      }
      if (
        row.name === serviceDbName(s) &&
        row.groupId === g.id &&
        row.position === position
      )
        continue;
      changes.push(
        `service ${s.id}: «${row.name}» → «${serviceDbName(s)}»` +
          (row.groupId !== g.id ? `, group ${row.groupId} → ${g.id}` : '') +
          (row.position !== position
            ? `, position ${row.position} → ${position}`
            : ''),
      );
      if (apply)
        await db
          .update(services)
          .set({
            name: serviceDbName(s),
            groupId: g.id,
            position,
            updatedAt: new Date(),
          })
          .where(eq(services.id, s.id));
    }
  }
  for (const r of dbServices)
    if (!known.has(r.id))
      changes.push(
        `service ${r.id}: in DB only («${r.name}», ${r.groupId}) — left as is`,
      );

  console.log(changes.length ? changes.join('\n') : 'no changes');
  console.log(`${apply ? 'applied' : 'dry run'}: ${changes.length} line(s)`);
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error('sync failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
