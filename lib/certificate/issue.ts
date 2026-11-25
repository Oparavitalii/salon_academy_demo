import { and, count, desc, eq } from 'drizzle-orm';

import { COURSE_SLUG, RECON_COURSE_SLUG } from '@/lib/content/site';
import { db } from '@/lib/db/client';
import {
  certificates,
  courses,
  lessonProgress,
  lessons,
  users,
} from '@/lib/db/schema';
import { sendEmail } from '@/lib/email/send';

import { buildCertificatePdf } from './pdf';

/** Course title on the certificate (English, as on the studio's template), by online course. */
export const CERT_COURSES: { slug: string; line1: string; line2: string }[] = [
  {
    slug: COURSE_SLUG,
    line1: 'Microcapsule Hair Extensions',
    line2: 'Professional Technique',
  },
  {
    slug: RECON_COURSE_SLUG,
    line1: 'Hair Reconstruction',
    line2: 'and Restoration',
  },
];

/** The studio's paper certificates reached 2026/027 (template, 30.10.2026) — the site goes on from 028. */
const FIRST_SEQ: Record<number, number> = { 2026: 28 };

export const certNumber = (year: number, seq: number) =>
  `DEMO/IPHM/${year}/${String(seq).padStart(3, '0')}`;

/** `2026-10-30` → `30.10.2026`. */
export const fmtIssued = (iso: string) => iso.split('-').reverse().join('.');

/** Today in Warsaw, `YYYY-MM-DD`. */
export const todayWarsaw = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(
    new Date(),
  );

export async function nextSeq(year: number): Promise<number> {
  const [last] = await db
    .select({ seq: certificates.seq })
    .from(certificates)
    .where(eq(certificates.year, year))
    .orderBy(desc(certificates.seq))
    .limit(1);
  return last ? last.seq + 1 : (FIRST_SEQ[year] ?? 1);
}

export async function seqTaken(year: number, seq: number) {
  const [row] = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(and(eq(certificates.year, year), eq(certificates.seq, seq)));
  return Boolean(row);
}

type CertRow = typeof certificates.$inferSelect;

export const certPdf = (
  c: Pick<
    CertRow,
    'name' | 'courseLine1' | 'courseLine2' | 'issuedOn' | 'number'
  >,
) =>
  buildCertificatePdf({
    name: c.name,
    courseLine1: c.courseLine1,
    courseLine2: c.courseLine2,
    date: fmtIssued(c.issuedOn),
    number: c.number,
  });

export const certFileName = (c: Pick<CertRow, 'name' | 'number'>) =>
  `Certificate_${c.number.split('/').slice(-2).join('_')}_${
    c.name
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_|_$/g, '') || 'DEMO'
  }.pdf`;

/** Builds the PDF and e-mails it; marks `sent_at` only after the letter really went out. */
export async function sendCertificate(c: CertRow): Promise<void> {
  const pdf = await certPdf(c);
  await sendEmail({
    to: c.email,
    template: 'certificate',
    vars: {
      name: c.name,
      course: [c.courseLine1, c.courseLine2].filter(Boolean).join(' '),
      number: c.number,
    },
    attachments: [{ filename: certFileName(c), content: pdf }],
  });
  await db
    .update(certificates)
    .set({ sentAt: new Date() })
    .where(eq(certificates.id, c.id));
}

export type IssueResult =
  | { ok: true; sent: boolean }
  | {
      ok: false;
      reason: 'not_cert_course' | 'not_finished' | 'no_name' | 'exists';
    };

/**
 * The certificate a student earned by watching every lesson of an online course (owner
 * 30.10.2026: «коли 100% курсу пройшло — автоматично вислати»). Name and e-mail come from her
 * account (name = «Ім'я для сертифіката» in the cabinet settings), date = today in Warsaw, number =
 * the next one. One per student and course (unique index) — a second call returns `exists`.
 * `force` skips the 100 % check (the admin's «Видати» button).
 */
export async function issueForCourse(
  userId: string,
  courseId: string,
  opts: { force?: boolean } = {},
): Promise<IssueResult> {
  const [course] = await db
    .select({ slug: courses.slug })
    .from(courses)
    .where(eq(courses.id, courseId));
  const preset = CERT_COURSES.find((c) => c.slug === course?.slug);
  if (!preset) return { ok: false, reason: 'not_cert_course' };

  if (!opts.force) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));
    const [{ done }] = await db
      .select({ done: count() })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
      .where(
        and(eq(lessonProgress.userId, userId), eq(lessons.courseId, courseId)),
      );
    if (!total || done < total) return { ok: false, reason: 'not_finished' };
  }

  const [had] = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(
      and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)),
    );
  if (had) return { ok: false, reason: 'exists' };

  const [u] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  const name = u?.name?.trim().replace(/\s+/g, ' ');
  if (!u || !name) return { ok: false, reason: 'no_name' };

  const issuedOn = todayWarsaw();
  const year = Number(issuedOn.slice(0, 4));
  // two certificates at the same moment may race for one number → take the next and retry
  for (let i = 0; i < 5; i++) {
    const seq = await nextSeq(year);
    const [saved] = await db
      .insert(certificates)
      .values({
        number: certNumber(year, seq),
        year,
        seq,
        name,
        email: u.email,
        userId,
        courseId,
        courseLine1: preset.line1,
        courseLine2: preset.line2,
        issuedOn,
      })
      .onConflictDoNothing()
      .returning();
    if (saved) {
      try {
        await sendCertificate(saved);
        return { ok: true, sent: true };
      } catch (e) {
        console.error('certificate send failed', e);
        return { ok: true, sent: false };
      }
    }
    const [now] = await db
      .select({ id: certificates.id })
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, userId),
          eq(certificates.courseId, courseId),
        ),
      );
    if (now) return { ok: false, reason: 'exists' };
  }
  throw new Error('certificate number: no free number after 5 tries');
}

/** Students who watched every lesson of a certificate course but have no certificate for it. */
export async function finishedWithoutCertificate() {
  const slugs = CERT_COURSES.map((c) => c.slug);
  const cs = (await db.select().from(courses)).filter((c) =>
    slugs.includes(c.slug),
  );
  const out: {
    userId: string;
    email: string;
    name: string | null;
    courseId: string;
    courseSlug: string;
  }[] = [];
  for (const c of cs) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(lessons)
      .where(eq(lessons.courseId, c.id));
    if (!total) continue;
    const rows = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        done: count(),
      })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
      .innerJoin(users, eq(users.id, lessonProgress.userId))
      .where(eq(lessons.courseId, c.id))
      .groupBy(users.id, users.email, users.name);
    const issued = new Set(
      (
        await db
          .select({ userId: certificates.userId })
          .from(certificates)
          .where(eq(certificates.courseId, c.id))
      ).map((r) => r.userId),
    );
    for (const r of rows)
      if (r.done >= total && !issued.has(r.userId))
        out.push({
          userId: r.userId,
          email: r.email,
          name: r.name,
          courseId: c.id,
          courseSlug: c.slug,
        });
  }
  return out;
}
