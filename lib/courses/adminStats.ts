import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import {
  courses,
  enrollments,
  lessonProgress,
  lessons,
  users,
} from '@/lib/db/schema';

/**
 * «Мої курси» in the admin (owner 28.10: «не бачу статистики проходження … зроби ресерч»). The
 * course report the course platforms show (Teachable / Thinkific / LearnDash): students with access,
 * started, finished, average progress, active lately, the lesson-by-lesson drop-off and a table of
 * students with progress, last lesson and last activity. Online courses only — the intensives have no
 * lessons to track. Revoked access is left out.
 */

export const ACTIVE_DAYS = 7;
export const STALE_DAYS = 14;

export type StudentRow = {
  userId: string;
  name: string | null;
  email: string;
  since: Date;
  done: number;
  pct: number;
  lastLesson: number | null;
  lastAt: Date | null;
  state: 'not_started' | 'learning' | 'stale' | 'finished';
};

export type LessonRow = {
  id: string;
  position: number;
  title: string;
  watched: number;
  pct: number;
};

export type CourseReport = {
  course: typeof courses.$inferSelect;
  lessons: (typeof lessons.$inferSelect)[];
  total: number;
  students: StudentRow[];
  funnel: LessonRow[];
  kpi: {
    enrolled: number;
    started: number;
    finished: number;
    avgPct: number;
    active: number;
    notStarted: number;
  };
  /** The lesson after which most students stop (largest drop vs the previous lesson). */
  biggestDrop: { position: number; lost: number } | null;
};

const DAY = 24 * 60 * 60 * 1000;

export async function getCourseReports(
  now = new Date(),
): Promise<CourseReport[]> {
  const list = await db
    .select()
    .from(courses)
    .where(eq(courses.kind, 'online'))
    .orderBy(asc(courses.position));
  if (!list.length) return [];
  const ids = list.map((c) => c.id);

  const [ls, enr] = await Promise.all([
    db
      .select()
      .from(lessons)
      .where(inArray(lessons.courseId, ids))
      .orderBy(asc(lessons.position)),
    db
      .select({
        courseId: enrollments.courseId,
        since: enrollments.createdAt,
        userId: users.id,
        name: users.name,
        email: users.email,
      })
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.userId))
      .where(
        and(inArray(enrollments.courseId, ids), isNull(enrollments.revokedAt)),
      ),
  ]);

  const lessonIds = ls.map((l) => l.id);
  const userIds = [...new Set(enr.map((e) => e.userId))];
  const prog =
    lessonIds.length && userIds.length
      ? await db
          .select()
          .from(lessonProgress)
          .where(
            and(
              inArray(lessonProgress.lessonId, lessonIds),
              inArray(lessonProgress.userId, userIds),
            ),
          )
      : [];

  return list.map((course) => {
    const cl = ls.filter((l) => l.courseId === course.id);
    const total = cl.length;
    const pos = new Map(cl.map((l) => [l.id, l.position]));
    const ce = enr.filter((e) => e.courseId === course.id);
    const enrolledIds = new Set(ce.map((e) => e.userId));
    const cp = prog.filter(
      (p) => pos.has(p.lessonId) && enrolledIds.has(p.userId),
    );

    const students: StudentRow[] = ce.map((e) => {
      const mine = cp.filter((p) => p.userId === e.userId);
      const last = mine.reduce<(typeof mine)[number] | null>(
        (a, p) => (!a || p.completedAt > a.completedAt ? p : a),
        null,
      );
      const done = mine.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const lastAt = last?.completedAt ?? null;
      const state: StudentRow['state'] =
        total && done >= total
          ? 'finished'
          : done === 0
            ? 'not_started'
            : lastAt && now.getTime() - lastAt.getTime() > STALE_DAYS * DAY
              ? 'stale'
              : 'learning';
      return {
        userId: e.userId,
        name: e.name,
        email: e.email,
        since: e.since,
        done,
        pct,
        lastLesson: last ? (pos.get(last.lessonId) ?? null) : null,
        lastAt,
        state,
      };
    });
    // Most recent activity first; never-started at the end, newest access first.
    students.sort(
      (a, b) =>
        (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0) ||
        b.since.getTime() - a.since.getTime(),
    );

    const n = students.length;
    const funnel: LessonRow[] = cl.map((l) => {
      const watched = cp.filter((p) => p.lessonId === l.id).length;
      return {
        id: l.id,
        position: l.position,
        title: l.title.uk,
        watched,
        pct: n ? Math.round((watched / n) * 100) : 0,
      };
    });
    let biggestDrop: CourseReport['biggestDrop'] = null;
    for (let i = 1; i < funnel.length; i++) {
      const lost = funnel[i - 1].watched - funnel[i].watched;
      if (lost > 0 && (!biggestDrop || lost > biggestDrop.lost))
        biggestDrop = { position: funnel[i - 1].position, lost };
    }

    return {
      course,
      lessons: cl,
      total,
      students,
      funnel,
      biggestDrop,
      kpi: {
        enrolled: n,
        started: students.filter((s) => s.done > 0).length,
        finished: students.filter((s) => s.state === 'finished').length,
        avgPct: n ? Math.round(students.reduce((a, s) => a + s.pct, 0) / n) : 0,
        active: students.filter(
          (s) =>
            s.lastAt && now.getTime() - s.lastAt.getTime() <= ACTIVE_DAYS * DAY,
        ).length,
        notStarted: students.filter((s) => s.state === 'not_started').length,
      },
    };
  });
}
