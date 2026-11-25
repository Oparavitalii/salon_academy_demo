'use server';

import { randomUUID } from 'node:crypto';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { routing, type Locale } from '@/i18n/routing';
import { closeSession, requireActionUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  courses,
  enrollments,
  lessons,
  payments,
  services,
  users,
} from '@/lib/db/schema';
import { localSimulationAllowed } from '@/lib/demo/mode';
import { postDevEvent } from '@/lib/payments/devPost';
import { resendAccessByAdmin, sendAccessLetter } from '@/lib/payments/fulfil';

/**
 * Admin actions (FR-16, Decisions 19.10.2026). Every action re-checks the `admin` role and the
 * active session; inputs go through Zod; the public pages that show the data are revalidated.
 */

const uuid = z.string().uuid();

/** Every per-user admin action targets students only — never the admin account itself. */
async function studentId(value: FormDataEntryValue | null): Promise<string> {
  const id = uuid.parse(value);
  const [u] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id));
  if (u?.role !== 'student') throw new Error('not a student');
  return id;
}

function back(fd: FormData, path: string, msg?: string): never {
  const l = String(fd.get('locale') ?? '');
  const locale: Locale = (routing.locales as readonly string[]).includes(l)
    ? (l as Locale)
    : routing.defaultLocale;
  const q = String(fd.get('q') ?? '');
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (msg) params.set('msg', msg);
  const s = params.toString();
  redirect(`/${locale}${path}${s ? `?${s}` : ''}`);
}

function revalidatePublicCourses() {
  revalidatePath('/[locale]/courses', 'page');
  revalidatePath('/[locale]/courses/[slug]', 'page');
  revalidatePath('/[locale]', 'page'); // home academy block lists the courses (28.10)
}

/* ---------------- students ---------------- */

export async function blockStudent(fd: FormData) {
  await requireActionUser('admin');
  const id = await studentId(fd.get('user'));
  await db
    .update(users)
    .set({ blockedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.role, 'student')));
  await closeSession(id);
  revalidatePath('/[locale]/admin/students', 'page');
  back(fd, '/admin/students', 'blocked');
}

export async function unblockStudent(fd: FormData) {
  await requireActionUser('admin');
  const id = await studentId(fd.get('user'));
  await db.update(users).set({ blockedAt: null }).where(eq(users.id, id));
  revalidatePath('/[locale]/admin/students', 'page');
  back(fd, '/admin/students', 'unblocked');
}

/** B-10: a typo in the e-mail → admin corrects it and the access letter goes again. */
export async function changeStudentEmail(fd: FormData) {
  await requireActionUser('admin');
  const id = await studentId(fd.get('user'));
  const email = z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .safeParse(fd.get('email'));
  if (!email.success) back(fd, '/admin/students', 'bad_email');
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email.data), ne(users.id, id)));
  if (taken) back(fd, '/admin/students', 'email_taken');
  await db.update(users).set({ email: email.data }).where(eq(users.id, id));
  await closeSession(id);
  await resendAccessByAdmin(id);
  back(fd, '/admin/students', 'email_changed');
}

export async function resendAccess(fd: FormData) {
  await requireActionUser('admin');
  const id = await studentId(fd.get('user'));
  await resendAccessByAdmin(id);
  back(fd, '/admin/students', 'resent');
}

/** Cash / manual sale: create the student (or reuse) and open a course. */
export async function createStudent(fd: FormData) {
  await requireActionUser('admin');
  const email = z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .safeParse(fd.get('email'));
  const courseId = uuid.safeParse(fd.get('course'));
  if (!email.success || !courseId.success)
    back(fd, '/admin/students', 'bad_email');
  await db
    .insert(users)
    .values({ email: email.data, role: 'student', mustChangePassword: true })
    .onConflictDoNothing({ target: users.email });
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.data));
  if (user.role !== 'student') back(fd, '/admin/students', 'email_taken');
  await upsertEnrollment(user.id, courseId.data);
  const [course] = await db
    .select({ title: courses.title })
    .from(courses)
    .where(eq(courses.id, courseId.data));
  await sendAccessLetter(user.id, course?.title.uk ?? '');
  back(fd, '/admin/students', 'created');
}

async function upsertEnrollment(userId: string, courseId: string) {
  await db
    .insert(enrollments)
    .values({ userId, courseId, grantedBy: 'admin' })
    .onConflictDoUpdate({
      target: [enrollments.userId, enrollments.courseId],
      // a manual grant stands on its own: no link to an earlier (possibly test) payment
      set: { revokedAt: null, grantedBy: 'admin', paymentId: null },
    });
}

export async function grantCourse(fd: FormData) {
  await requireActionUser('admin');
  const userId = await studentId(fd.get('user'));
  const courseId = uuid.parse(fd.get('course'));
  await upsertEnrollment(userId, courseId);
  back(fd, '/admin/students', 'granted');
}

export async function revokeCourse(fd: FormData) {
  await requireActionUser('admin');
  const userId = await studentId(fd.get('user'));
  const courseId = uuid.parse(fd.get('course'));
  await db
    .update(enrollments)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    );
  back(fd, '/admin/students', 'revoked');
}

/* ---------------- courses ---------------- */

/**
 * One course on the site, one «Зберегти» (owner 31.10.2026 — price and status sat in two places):
 * the price in whole euros («990»; empty → the price in code, `lib/content/courses.ts`) and the
 * status (available / soon). Lives in /admin/courses. Stripe tiers in PLN are not touched (B-93).
 */
export async function updateCourseOnSite(fd: FormData) {
  await requireActionUser('admin');
  const id = uuid.parse(fd.get('course'));
  const status = z.enum(['available', 'soon']).parse(fd.get('status'));
  const raw = String(fd.get('price') ?? '').replace(/[\s€]/g, '');
  let priceEur: number | null = null;
  if (raw) {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0 || n > 100_000)
      back(fd, '/admin/courses', 'bad_price');
    priceEur = n;
  }
  await db
    .update(courses)
    .set({ priceEur, status, updatedAt: new Date() })
    .where(eq(courses.id, id));
  revalidatePublicCourses();
  back(fd, '/admin/courses', 'saved');
}

export async function updateLesson(fd: FormData) {
  await requireActionUser('admin');
  const id = uuid.parse(fd.get('lesson'));
  const input = z
    .object({
      title: z.string().trim().min(1).max(200),
      video: z.string().trim().max(80),
      minutes: z.string().trim().max(4),
    })
    .safeParse({
      title: fd.get('title'),
      video: fd.get('video') ?? '',
      minutes: fd.get('minutes') ?? '',
    });
  if (!input.success) back(fd, '/admin/courses', 'bad_lesson');
  const [row] = await db.select().from(lessons).where(eq(lessons.id, id));
  if (!row) back(fd, '/admin/courses');
  // Only Ukrainian exists (Q-17): locales still equal to the old Ukrainian follow the edit.
  const title = Object.fromEntries(
    Object.entries(row.title).map(([k, v]) => [
      k,
      k === 'uk' || v === row.title.uk ? input.data.title : v,
    ]),
  ) as typeof row.title;
  const minutes = Number(input.data.minutes);
  await db
    .update(lessons)
    .set({
      title,
      bunnyVideoId: input.data.video || null,
      durationMin:
        input.data.minutes && Number.isInteger(minutes) && minutes > 0
          ? minutes
          : null,
    })
    .where(eq(lessons.id, id));
  back(fd, '/admin/courses', 'saved');
}

/* ---------------- services ---------------- */

/**
 * A whole salon group in one save (owner 31.10.2026 — 68 «Зберегти» buttons were too many):
 * `service` repeats once per row; each row sends `master:<id>`, `top:<id>`, `duration:<id>`.
 * Ids that are not in the DB change nothing.
 */
export async function updateServiceGroup(fd: FormData) {
  await requireActionUser('admin');
  const ids = z
    .array(z.string().min(1).max(80))
    .min(1)
    .max(100)
    .parse(fd.getAll('service'));
  const clean = (k: string) => {
    const v = String(fd.get(k) ?? '')
      .trim()
      .slice(0, 60);
    return v || null;
  };
  const now = new Date();
  for (const id of new Set(ids))
    await db
      .update(services)
      .set({
        masterPrice: clean(`master:${id}`),
        topPrice: clean(`top:${id}`),
        duration: clean(`duration:${id}`),
        updatedAt: now,
      })
      .where(eq(services.id, id));
  revalidatePath('/[locale]/salon', 'page');
  back(fd, '/admin/prices', 'saved');
}

/* ---------------- dev only ---------------- */

/** DEV ONLY: simulates Stripe `charge.refunded` (full) for a payment. */
export async function devRefund(fd: FormData) {
  if (!localSimulationAllowed() || process.env.STRIPE_SECRET_KEY)
    throw new Error('dev only');
  await requireActionUser('admin');
  const id = uuid.parse(fd.get('payment'));
  const [p] = await db.select().from(payments).where(eq(payments.id, id));
  if (!p?.providerPaymentIntentId) back(fd, '/admin/payments');
  await postDevEvent({
    type: 'refunded',
    eventId: `dev_evt_${randomUUID()}`,
    paymentIntentId: p.providerPaymentIntentId,
    full: true,
  });
  back(fd, '/admin/payments', 'refunded');
}
