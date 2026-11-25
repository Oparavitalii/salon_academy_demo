/**
 * Idempotent content seed: courses (catalog), tiers with the owner's conditional prices,
 * the 16 lessons of the online course, salon services. Existing rows are never overwritten —
 * admin edits survive a re-run. To update lesson titles in place: db:sync-lessons.
 *   npm run db:seed
 */
import { db } from '@/lib/db/client';
import { seedContent, type SeedDb } from '@/lib/db/seedContent';

async function main() {
  const created = await seedContent(db as unknown as SeedDb);
  console.log(
    `seed: courses +${created.courses}, tiers +${created.tiers}, lessons +${created.lessons}, services +${created.services}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error('seed failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
