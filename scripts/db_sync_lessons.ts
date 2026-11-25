/**
 * Sync the online course's lessons with `onlineProgram` (lib/content/courses.ts).
 * Unlike db:seed it DOES overwrite: lesson titles, minutes and — once a lesson is uploaded —
 * the Bunny video id from `Apps/Video_Upload/Lessons/Built/Lesson_NN.mp4.bunny.json`.
 * Rows past the program length are reported, never deleted.
 *   npm run db:sync-lessons            (dry run: prints what would change)
 *   npm run db:sync-lessons -- --apply (writes)
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { and, eq } from 'drizzle-orm';

import { courseDetails } from '@/lib/content/courses';
import { COURSE_SLUG } from '@/lib/content/site';
import { db } from '@/lib/db/client';
import { courses, lessons } from '@/lib/db/schema';

/** Minutes per lesson, rounded up from the recorded video lengths (20.10.2026). */
const MINUTES = [13, 9, 6, 5, 9, 10, 5, 5, 6, 10, 13, 4, 2, 3, 5, 4];
const BUILT = join(process.cwd(), 'Apps', 'Video_Upload', 'Lessons', 'Built');

function videoId(position: number): string | null {
  const f = join(
    BUILT,
    `Lesson_${String(position).padStart(2, '0')}.mp4.bunny.json`,
  );
  if (!existsSync(f)) return null;
  const r = JSON.parse(readFileSync(f, 'utf8')) as {
    videoId?: string;
    uploaded?: boolean;
  };
  return r.uploaded && r.videoId ? r.videoId : null;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const detail = courseDetails.find((d) => d.slug === COURSE_SLUG);
  if (!detail) throw new Error(`no course detail for ${COURSE_SLUG}`);
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, COURSE_SLUG));
  if (!course)
    throw new Error(
      `course ${COURSE_SLUG} is not in the DB — run npm run db:seed first`,
    );

  const rows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course.id));
  let changes = 0;

  for (const [k, row] of detail.program.entries()) {
    const position = k + 1;
    const next = {
      title: row.title,
      durationMin: MINUTES[k] ?? null,
      ...(videoId(position) ? { bunnyVideoId: videoId(position) } : {}),
    };
    const cur = rows.find((r) => r.position === position);
    if (!cur) {
      console.log(`+ ${position}: ${row.title.uk}`);
      changes += 1;
      if (apply)
        await db
          .insert(lessons)
          .values({ courseId: course.id, position, ...next });
      continue;
    }
    // jsonb stores keys in its own order, so compare locale by locale, not as strings.
    const titleChanged = (
      Object.keys(next.title) as (keyof typeof next.title)[]
    ).some((l) => cur.title[l] !== next.title[l]);
    const diff =
      titleChanged ||
      cur.durationMin !== next.durationMin ||
      ('bunnyVideoId' in next && cur.bunnyVideoId !== next.bunnyVideoId);
    if (!diff) continue;
    console.log(`~ ${position}: ${cur.title.uk} → ${row.title.uk}`);
    changes += 1;
    if (apply) {
      await db
        .update(lessons)
        .set(next)
        .where(
          and(eq(lessons.courseId, course.id), eq(lessons.position, position)),
        );
    }
  }

  for (const r of rows.filter((r) => r.position > detail.program.length)) {
    console.log(
      `! ${r.position}: ${r.title.uk} — not in the program, left as is`,
    );
  }
  console.log(
    `${changes} change(s) ${apply ? 'written' : 'found (dry run, add --apply to write)'}`,
  );
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
