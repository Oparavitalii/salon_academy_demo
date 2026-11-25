import { asc, eq } from 'drizzle-orm';

import { hashPassword } from '@/lib/auth/password';
import { COURSE_SLUG, INTENSIVE_SLUG } from '@/lib/content/site';
import {
  certificates,
  courses,
  courseTiers,
  enrollments,
  lessonProgress,
  lessons,
  loginEvents,
  payments,
  users,
} from '@/lib/db/schema';
import { seedContent, type SeedDb } from '@/lib/db/seedContent';

/** Shared password of every demo account (documented in the README). */
export const DEMO_PASSWORD = 'demo-studio-2026';

export const DEMO_ACCOUNTS = {
  admin: 'admin@studio-demo.example',
  student: 'student@studio-demo.example',
  graduate: 'graduate@studio-demo.example',
  newcomer: 'newcomer@studio-demo.example',
} as const;

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

/**
 * Fictional data for the public demo: the course catalog and salon prices from the content files,
 * one admin, three students in different states (in progress, finished with a certificate, just
 * bought), their payments, lesson progress and login history. Every name and address is invented.
 */
export async function seedDemo(db: SeedDb) {
  await seedContent(db);

  const hash = await hashPassword(DEMO_PASSWORD);
  const [admin, student, graduate, newcomer] = await db
    .insert(users)
    .values([
      {
        email: DEMO_ACCOUNTS.admin,
        passwordHash: hash,
        role: 'admin' as const,
        name: 'Demo Admin',
        locale: 'en' as const,
        createdAt: daysAgo(60),
      },
      {
        email: DEMO_ACCOUNTS.student,
        passwordHash: hash,
        role: 'student' as const,
        name: 'Anna Example',
        phone: '+48 555 000 101',
        locale: 'en' as const,
        createdAt: daysAgo(21),
      },
      {
        email: DEMO_ACCOUNTS.graduate,
        passwordHash: hash,
        role: 'student' as const,
        name: 'Maria Sample',
        phone: '+48 555 000 102',
        locale: 'pl' as const,
        createdAt: daysAgo(45),
      },
      {
        email: DEMO_ACCOUNTS.newcomer,
        passwordHash: hash,
        role: 'student' as const,
        name: 'Olha Testova',
        locale: 'uk' as const,
        createdAt: daysAgo(2),
      },
    ])
    .returning({ id: users.id, email: users.email });

  const [online] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, COURSE_SLUG));
  const [intensive] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, INTENSIVE_SLUG));
  const tiers = await db
    .select()
    .from(courseTiers)
    .where(eq(courseTiers.courseId, online.id))
    .orderBy(asc(courseTiers.position));
  const tier = (code: string) => tiers.find((t) => t.code === code) ?? tiers[0];
  const [intensiveTier] = await db
    .select()
    .from(courseTiers)
    .where(eq(courseTiers.courseId, intensive.id));

  /** A paid online purchase → enrollment, like the webhook fulfilment leaves it. */
  async function buy(
    userId: string,
    email: string,
    code: string,
    n: number,
    when: Date,
  ) {
    const t = tier(code);
    const [p] = await db
      .insert(payments)
      .values({
        providerSessionId: `dev_cs_demo_${n}`,
        providerPaymentIntentId: `dev_pi_demo_${n}`,
        email,
        userId,
        courseId: online.id,
        tierId: t.id,
        kind: 'online',
        amountMinor: t.priceMinor ?? 0,
        currency: t.currency,
        status: 'paid',
        locale: 'en',
        emailSentAt: when,
        createdAt: when,
      })
      .returning({ id: payments.id });
    await db.insert(enrollments).values({
      userId,
      courseId: online.id,
      tierId: t.id,
      grantedBy: 'payment',
      paymentId: p.id,
      createdAt: when,
    });
  }

  await buy(student.id, student.email, 'middle', 1, daysAgo(20));
  await buy(graduate.id, graduate.email, 'basic', 2, daysAgo(44));
  await buy(newcomer.id, newcomer.email, 'mentoring', 3, daysAgo(2));

  // An offline intensive bought without an account (the studio agrees the date by e-mail).
  if (intensiveTier) {
    await db.insert(payments).values({
      providerSessionId: 'dev_cs_demo_4',
      providerPaymentIntentId: 'dev_pi_demo_4',
      email: 'walk-in@studio-demo.example',
      courseId: intensive.id,
      tierId: intensiveTier.id,
      kind: 'offline',
      amountMinor: intensiveTier.priceMinor ?? 0,
      currency: intensiveTier.currency,
      status: 'paid',
      locale: 'pl',
      emailSentAt: daysAgo(9),
      adminEmailSentAt: daysAgo(9),
      createdAt: daysAgo(9),
    });
  }

  const courseLessons = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.courseId, online.id))
    .orderBy(asc(lessons.position));
  const done = (userId: string, count: number, from: number) =>
    courseLessons.slice(0, count).map((l, i) => ({
      userId,
      lessonId: l.id,
      completedAt: daysAgo(from - i),
    }));
  const progress = [
    ...done(student.id, 6, 18),
    ...done(graduate.id, courseLessons.length, 40),
  ];
  if (progress.length) await db.insert(lessonProgress).values(progress);

  // Same text as `CERT_COURSES` / `certNumber` in lib/certificate/issue.ts (not imported: that module
  // reads the database client, which is being created while this seed runs).
  const year = new Date().getFullYear();
  await db.insert(certificates).values({
    number: `DEMO/IPHM/${year}/001`,
    year,
    seq: 1,
    name: 'Maria Sample',
    email: graduate.email,
    userId: graduate.id,
    courseId: online.id,
    courseLine1: 'Microcapsule Hair Extensions',
    courseLine2: 'Professional Technique',
    issuedOn: daysAgo(10).toISOString().slice(0, 10),
    sentAt: daysAgo(10),
  });

  await db.insert(loginEvents).values([
    {
      userId: student.id,
      device: 'Chrome · Windows',
      city: 'Warszawa',
      country: 'PL',
      createdAt: daysAgo(3),
    },
    {
      userId: student.id,
      device: 'Safari · iPhone',
      city: 'Warszawa',
      country: 'PL',
      createdAt: daysAgo(1),
    },
    {
      userId: graduate.id,
      device: 'Chrome · Android',
      city: 'Kraków',
      country: 'PL',
      createdAt: daysAgo(12),
    },
    {
      userId: graduate.id,
      device: 'Firefox · macOS',
      city: 'Lisbon',
      country: 'PT',
      suspicious: true,
      createdAt: daysAgo(11),
    },
    {
      userId: admin.id,
      device: 'Chrome · macOS',
      city: 'Warszawa',
      country: 'PL',
      createdAt: daysAgo(1),
    },
  ]);
}
