import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import {
  type Role,
  certificates,
  courses,
  courseTiers,
  enrollments,
  lessonProgress,
  lessons,
} from '@/lib/db/schema';

/** Active (not revoked) enrollments with course, tier and progress. */
export async function getMyCourses(userId: string) {
  const rows = await db
    .select({
      course: courses,
      tierName: courseTiers.name,
      tierCode: courseTiers.code,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .leftJoin(courseTiers, eq(courseTiers.id, enrollments.tierId))
    .where(and(eq(enrollments.userId, userId), isNull(enrollments.revokedAt)))
    .orderBy(asc(courses.position));
  if (!rows.length) return [];

  const ids = rows.map((r) => r.course.id);
  const all = await db
    .select({
      id: lessons.id,
      courseId: lessons.courseId,
      position: lessons.position,
    })
    .from(lessons)
    .where(inArray(lessons.courseId, ids))
    .orderBy(asc(lessons.position));
  const done = new Set(
    (
      await db
        .select({ lessonId: lessonProgress.lessonId })
        .from(lessonProgress)
        .where(eq(lessonProgress.userId, userId))
    ).map((r) => r.lessonId),
  );

  const certified = new Set(
    (
      await db
        .select({ courseId: certificates.courseId })
        .from(certificates)
        .where(
          and(
            eq(certificates.userId, userId),
            inArray(certificates.courseId, ids),
          ),
        )
    ).map((r) => r.courseId),
  );

  return rows.map((r) => {
    const ls = all.filter((l) => l.courseId === r.course.id);
    const next = ls.find((l) => !done.has(l.id));
    return {
      ...r,
      total: ls.length,
      done: ls.filter((l) => done.has(l.id)).length,
      /** The certificate for this course has been issued (sent to her e-mail). */
      certified: certified.has(r.course.id),
      nextPosition: next?.position ?? ls[0]?.position ?? null,
    };
  });
}

/** The course page/lesson guard: null unless the user holds an active enrollment. */
export async function getEnrolledCourse(userId: string, slug: string) {
  const [row] = await db
    .select({ course: courses, tierName: courseTiers.name })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .leftJoin(courseTiers, eq(courseTiers.id, enrollments.tierId))
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(courses.slug, slug),
        isNull(enrollments.revokedAt),
      ),
    );
  if (!row) return null;

  const ls = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, row.course.id))
    .orderBy(asc(lessons.position));
  const done = new Set(
    (
      await db
        .select({ lessonId: lessonProgress.lessonId })
        .from(lessonProgress)
        .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessons.courseId, row.course.id),
          ),
        )
    ).map((r) => r.lessonId),
  );
  return {
    ...row,
    lessons: ls.map((l) => ({ ...l, done: done.has(l.id) })),
  };
}

/**
 * Admin preview: any course by slug with every lesson, no enrollment needed. Nothing is
 * marked as watched — the admin's views never touch a student's progress.
 */
export async function getCourseForAdmin(slug: string) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, slug));
  if (!course) return null;
  const ls = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position));
  return {
    course,
    tierName: null as string | null,
    lessons: ls.map((l) => ({ ...l, done: false })),
  };
}

/** Lesson-page loader: a student sees an enrolled course, the admin sees every course. */
export function getCourseFor(user: { id: string; role: Role }, slug: string) {
  return user.role === 'admin'
    ? getCourseForAdmin(slug)
    : getEnrolledCourse(user.id, slug);
}
