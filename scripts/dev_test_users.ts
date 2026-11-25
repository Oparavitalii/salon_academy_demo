/**
 * DEV ONLY — Phase 12 (B-94): one test admin + one test student enrolled in the online course,
 * in the database of `.env.local` (Neon dev branch). Passwords are random; credentials are written
 * ONLY to `.dev_test_credentials.json` at the project root (git-ignored: `/.dev_test_credentials*`).
 * Nothing secret is printed. Re-running rotates both passwords and re-opens the enrollment.
 *   npx tsx --env-file=.env.local scripts/dev_test_users.ts
 * Refuses to run with NODE_ENV=production or on a Fly machine (FLY_APP_NAME set).
 */
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { and, eq } from 'drizzle-orm';

import { hashPassword } from '@/lib/auth/password';
import { db } from '@/lib/db/client';
import {
  courses,
  courseTiers,
  enrollments,
  sessions,
  users,
} from '@/lib/db/schema';

const ADMIN_EMAIL = 'phase12.admin@studio-demo.test';
const STUDENT_EMAIL = 'phase12.student@studio-demo.test';
const COURSE_SLUG = 'microcapsule-extension';

function refuse(why: string): never {
  console.error(`dev_test_users: refused — ${why}`);
  process.exit(2);
}

async function upsertUser(
  email: string,
  role: 'admin' | 'student',
  name: string,
) {
  const password = randomBytes(18).toString('base64url');
  const passwordHash = await hashPassword(password);
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  let id: string;
  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        role,
        name,
        mustChangePassword: false,
        blockedAt: null,
      })
      .where(eq(users.id, existing.id));
    id = existing.id;
  } else {
    const [row] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role,
        name,
        locale: 'uk',
        mustChangePassword: false,
      })
      .returning({ id: users.id });
    id = row.id;
  }
  // A stale session row from an earlier run would end the next login check — drop it.
  await db.delete(sessions).where(eq(sessions.userId, id));
  return { id, password, created: !existing };
}

async function main() {
  if (process.env.NODE_ENV === 'production') refuse('NODE_ENV=production');
  if (process.env.FLY_APP_NAME) refuse('FLY_APP_NAME is set (Fly machine)');
  if (!process.env.DATABASE_URL)
    refuse('DATABASE_URL is not set (run with --env-file=.env.local)');

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, COURSE_SLUG));
  if (!course)
    refuse(`course «${COURSE_SLUG}» not found — run npm run db:seed first`);
  const [tier] = await db
    .select({ id: courseTiers.id })
    .from(courseTiers)
    .where(eq(courseTiers.courseId, course.id))
    .orderBy(courseTiers.position)
    .limit(1);

  const admin = await upsertUser(ADMIN_EMAIL, 'admin', 'Phase 12 Admin');
  const student = await upsertUser(
    STUDENT_EMAIL,
    'student',
    'Phase 12 Student',
  );

  const [enr] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, student.id),
        eq(enrollments.courseId, course.id),
      ),
    );
  if (enr) {
    await db
      .update(enrollments)
      .set({ revokedAt: null, grantedBy: 'admin', tierId: tier?.id ?? null })
      .where(eq(enrollments.id, enr.id));
  } else {
    await db.insert(enrollments).values({
      userId: student.id,
      courseId: course.id,
      tierId: tier?.id ?? null,
      grantedBy: 'admin',
    });
  }

  const file = resolve(process.cwd(), '.dev_test_credentials.json');
  writeFileSync(
    file,
    JSON.stringify(
      {
        note: 'DEV ONLY · Neon dev branch · Phase 12 B-94 · git-ignored, never commit',
        createdAt: new Date().toISOString(),
        admin: { email: ADMIN_EMAIL, password: admin.password },
        student: {
          email: STUDENT_EMAIL,
          password: student.password,
          course: COURSE_SLUG,
        },
      },
      null,
      2,
    ) + '\n',
    { mode: 0o600 },
  );
  console.log(
    `dev_test_users: admin ${admin.created ? 'created' : 'updated'}, student ${student.created ? 'created' : 'updated'}, enrollment ${enr ? 're-opened' : 'created'} (${COURSE_SLUG}); credentials → .dev_test_credentials.json`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error('dev_test_users failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
