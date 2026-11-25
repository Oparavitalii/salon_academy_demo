'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

import { requireActionUser } from '@/lib/auth/session';
import { issueForCourse } from '@/lib/certificate/issue';
import { db } from '@/lib/db/client';
import { enrollments, lessonProgress, lessons } from '@/lib/db/schema';

/**
 * «Позначити переглянутим» — only for a lesson of a course the student holds. The last lesson of a
 * certificate course issues and e-mails the certificate (after the response; never twice).
 */
export async function markLessonDone(fd: FormData) {
  const user = await requireActionUser('student');
  const lessonId = String(fd.get('lesson') ?? '');
  if (!/^[0-9a-f-]{36}$/.test(lessonId)) return;

  const [ok] = await db
    .select({ id: lessons.id, courseId: lessons.courseId })
    .from(lessons)
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.courseId, lessons.courseId),
        eq(enrollments.userId, user.id),
        isNull(enrollments.revokedAt),
      ),
    )
    .where(eq(lessons.id, lessonId));
  if (!ok) return;

  await db
    .insert(lessonProgress)
    .values({ userId: user.id, lessonId })
    .onConflictDoNothing();
  revalidatePath('/[locale]/cabinet', 'layout');
  after(async () => {
    try {
      const r = await issueForCourse(user.id, ok.courseId);
      if (!r.ok && r.reason === 'no_name')
        console.warn('certificate waits: no name in the profile', user.id);
    } catch (e) {
      console.error('auto certificate failed', e);
    }
  });
}
