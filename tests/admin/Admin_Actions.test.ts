import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  certificates,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  passwordResetTokens,
  services,
  sessions,
  users,
} from '@/lib/db/schema';

import { resetDb, type TestDb } from '../helpers/Test_Db';

/**
 * Admin server actions (FR-16) and the cabinet «переглянуто» action: every action refuses a
 * student, an anonymous visitor and a temporary-password session; each one does its job; bad
 * input is rejected. Real SQL on PGlite; the session, redirect and e-mail are faked.
 */
vi.mock('@/lib/db/client', async () => {
  const { makeTestDb } = await import('../helpers/Test_Db');
  return { db: await makeTestDb(), hasDb: true };
});
type Actor = {
  id: string;
  role: 'student' | 'admin';
  mustChangePassword: boolean;
} | null;
let actor: Actor = null;
vi.mock('@/lib/auth/session', async (orig) => {
  const real = await orig<typeof import('@/lib/auth/session')>();
  return {
    ...real,
    requireActionUser: async (role?: string) => {
      if (!actor) throw new Error('unauthorized');
      if (actor.mustChangePassword) throw new Error('password change required');
      if (role && actor.role !== role) throw new Error('forbidden');
      return actor;
    },
  };
});
vi.mock('@/auth', () => ({ auth: async () => null }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
const later: (() => Promise<void>)[] = [];
vi.mock('next/server', () => ({
  after: (fn: () => Promise<void>) => later.push(fn),
}));
const sendEmail = vi.fn(async (_m: { to: string; template: string }) => {});
vi.mock('@/lib/email/send', () => ({
  sendEmail: (m: { to: string; template: string }) => sendEmail(m),
  adminInbox: () => 'admin@example.test',
}));

const { db } = (await import('@/lib/db/client')) as unknown as { db: TestDb };
const A = await import('@/app/[locale]/admin/_actions');
const { markLessonDone } = await import('@/app/[locale]/cabinet/_actions');

const t = (s: string) => ({ uk: s, pl: s, en: s });
let admin: string;
let anna: string;
let course: string;
let lessonIds: string[];

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ locale: 'uk', ...o })) f.set(k, v);
  return f;
};
/** Runs an action and returns where it redirected (every admin action ends in a redirect). */
async function run(
  fn: (fd: FormData) => Promise<unknown>,
  o: Record<string, string>,
) {
  try {
    await fn(form(o));
    return 'no redirect';
  } catch (e) {
    const m = (e as Error).message;
    if (m.startsWith('REDIRECT ')) return m.slice(9);
    throw e;
  }
}
const asAdmin = () =>
  (actor = { id: admin, role: 'admin', mustChangePassword: false });
const enr = () => db.select().from(enrollments);

beforeEach(async () => {
  await resetDb(db);
  sendEmail.mockClear();
  later.length = 0;
  [{ id: admin }, { id: anna }] = await db
    .insert(users)
    .values([
      { email: 'admin@example.test', role: 'admin', passwordHash: 'x' },
      {
        email: 'anna@example.test',
        role: 'student',
        passwordHash: 'x',
        name: 'Anna Kowalska',
      },
    ])
    .returning({ id: users.id });
  [{ id: course }] = await db
    .insert(courses)
    .values({
      slug: 'microcapsule-extension',
      kind: 'online',
      title: t('Курс'),
    })
    .returning({ id: courses.id });
  lessonIds = (
    await db
      .insert(lessons)
      .values(
        [1, 2].map((position) => ({
          courseId: course,
          position,
          title: t(`L${position}`),
        })),
      )
      .returning({ id: lessons.id })
  ).map((l) => l.id);
  await db.insert(sessions).values({ userId: anna, sid: crypto.randomUUID() });
  actor = null;
});
afterEach(() => vi.unstubAllEnvs());

describe('role guard on every admin action', () => {
  const calls: [string, (fd: FormData) => Promise<unknown>][] = [
    ['blockStudent', A.blockStudent],
    ['unblockStudent', A.unblockStudent],
    ['changeStudentEmail', A.changeStudentEmail],
    ['resendAccess', A.resendAccess],
    ['createStudent', A.createStudent],
    ['grantCourse', A.grantCourse],
    ['revokeCourse', A.revokeCourse],
    ['updateCourseOnSite', A.updateCourseOnSite],
    ['updateLesson', A.updateLesson],
    ['updateServiceGroup', A.updateServiceGroup],
  ];
  const input = () => ({
    user: anna,
    course,
    email: 'new@example.test',
    price: '1',
    status: 'soon',
    lesson: lessonIds[0],
    title: 'X',
    service: 's',
  });

  it.each(calls)(
    '%s: anonymous → unauthorized, student → forbidden, temp password → refused; nothing changes',
    async (_n, fn) => {
      const before = JSON.stringify([
        await db.select().from(users),
        await enr(),
        await db.select().from(courses),
      ]);
      actor = null;
      await expect(run(fn, input())).rejects.toThrow('unauthorized');
      actor = { id: anna, role: 'student', mustChangePassword: false };
      await expect(run(fn, input())).rejects.toThrow('forbidden');
      actor = { id: admin, role: 'admin', mustChangePassword: true };
      await expect(run(fn, input())).rejects.toThrow(
        'password change required',
      );
      expect(
        JSON.stringify([
          await db.select().from(users),
          await enr(),
          await db.select().from(courses),
        ]),
      ).toBe(before);
      expect(sendEmail).not.toHaveBeenCalled();
    },
  );
});

describe('students', () => {
  it('block → blocked and her session ended; unblock → open again', async () => {
    asAdmin();
    expect(await run(A.blockStudent, { user: anna })).toBe(
      '/uk/admin/students?msg=blocked',
    );
    const [u] = await db.select().from(users).where(eq(users.id, anna));
    expect(u.blockedAt).not.toBeNull();
    expect(await db.select().from(sessions)).toHaveLength(0);
    await run(A.unblockStudent, { user: anna });
    expect(
      (await db.select().from(users).where(eq(users.id, anna)))[0].blockedAt,
    ).toBeNull();
  });

  it('per-student actions never touch the admin account', async () => {
    asAdmin();
    await expect(run(A.blockStudent, { user: admin })).rejects.toThrow(
      'not a student',
    );
    await expect(run(A.grantCourse, { user: admin, course })).rejects.toThrow(
      'not a student',
    );
    expect(
      (await db.select().from(users).where(eq(users.id, admin)))[0].blockedAt,
    ).toBeNull();
  });

  it('a malformed id is rejected', async () => {
    asAdmin();
    await expect(run(A.blockStudent, { user: 'not-a-uuid' })).rejects.toThrow();
  });

  it('grant → active; revoke → closed; grant again after a payment-linked revoke → active, unlinked', async () => {
    asAdmin();
    await run(A.grantCourse, { user: anna, course });
    expect((await enr())[0]).toMatchObject({
      grantedBy: 'admin',
      revokedAt: null,
    });
    await run(A.revokeCourse, { user: anna, course });
    expect((await enr())[0].revokedAt).not.toBeNull();
    await run(A.grantCourse, { user: anna, course });
    const [e] = await enr();
    expect(e).toMatchObject({
      revokedAt: null,
      paymentId: null,
      grantedBy: 'admin',
    });
    expect(await enr()).toHaveLength(1);
  });

  it('create student (cash sale) → account, course open, welcome letter with a set-password link', async () => {
    asAdmin();
    expect(
      await run(A.createStudent, { email: ' New@Example.test ', course }),
    ).toBe('/uk/admin/students?msg=created');
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'new@example.test'));
    expect(u).toMatchObject({ role: 'student', mustChangePassword: true });
    expect((await enr()).filter((e) => e.userId === u.id)).toHaveLength(1);
    expect(sendEmail.mock.calls.map(([m]) => m.template)).toEqual(['welcome']);
    expect(await db.select().from(passwordResetTokens)).toHaveLength(1);
  });

  it('create student with the admin e-mail → refused, no course opened; bad e-mail → refused', async () => {
    asAdmin();
    expect(
      await run(A.createStudent, { email: 'admin@example.test', course }),
    ).toBe('/uk/admin/students?msg=email_taken');
    expect(await enr()).toHaveLength(0);
    expect(await run(A.createStudent, { email: 'nope', course })).toBe(
      '/uk/admin/students?msg=bad_email',
    );
  });

  it('change e-mail: taken → refused; ok → changed, session ended, old links dead, new letter', async () => {
    asAdmin();
    const old = await db
      .insert(passwordResetTokens)
      .values({
        userId: anna,
        tokenHash: 'old',
        expiresAt: new Date(Date.now() + 3_600_000),
      })
      .returning();
    expect(
      await run(A.changeStudentEmail, {
        user: anna,
        email: 'admin@example.test',
      }),
    ).toBe('/uk/admin/students?msg=email_taken');
    expect(await run(A.changeStudentEmail, { user: anna, email: 'bad' })).toBe(
      '/uk/admin/students?msg=bad_email',
    );
    expect(
      await run(A.changeStudentEmail, {
        user: anna,
        email: 'anna2@example.test',
      }),
    ).toBe('/uk/admin/students?msg=email_changed');
    expect(
      (await db.select().from(users).where(eq(users.id, anna)))[0].email,
    ).toBe('anna2@example.test');
    expect(await db.select().from(sessions)).toHaveLength(0);
    const [o] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.id, old[0].id));
    expect(o.usedAt).not.toBeNull();
    expect(sendEmail.mock.calls.map(([m]) => [m.template, m.to])).toEqual([
      ['accessResent', 'anna2@example.test'],
    ]);
  });
});

describe('courses and lessons', () => {
  it('price + status in one save: «990 €» → 990; empty → back to the code price; 0, text or > 100 000 → refused', async () => {
    asAdmin();
    expect(
      await run(A.updateCourseOnSite, {
        course,
        price: '990 €',
        status: 'available',
      }),
    ).toBe('/uk/admin/courses?msg=saved');
    expect((await db.select().from(courses))[0].priceEur).toBe(990);
    for (const bad of ['0', 'abc', '100001', '9.5'])
      expect(
        await run(A.updateCourseOnSite, {
          course,
          price: bad,
          status: 'soon',
        }),
      ).toBe('/uk/admin/courses?msg=bad_price');
    // a refused price changes nothing — not the status either
    expect((await db.select().from(courses))[0]).toMatchObject({
      priceEur: 990,
      status: 'available',
    });
    await run(A.updateCourseOnSite, { course, price: '', status: 'soon' });
    expect((await db.select().from(courses))[0]).toMatchObject({
      priceEur: null,
      status: 'soon',
    });
  });

  it('status: available / soon only', async () => {
    asAdmin();
    await expect(
      run(A.updateCourseOnSite, { course, price: '', status: 'deleted' }),
    ).rejects.toThrow();
    expect((await db.select().from(courses))[0].status).not.toBe('deleted');
  });

  it('lesson: title, video id, minutes; an empty title is refused; non-numeric minutes → none', async () => {
    asAdmin();
    await run(A.updateLesson, {
      lesson: lessonIds[0],
      title: 'Новий',
      video: 'vid-1',
      minutes: '12',
    });
    let [l] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonIds[0]));
    expect(l).toMatchObject({ bunnyVideoId: 'vid-1', durationMin: 12 });
    expect(l.title.uk).toBe('Новий');
    expect(
      await run(A.updateLesson, {
        lesson: lessonIds[0],
        title: '  ',
        video: '',
        minutes: '',
      }),
    ).toBe('/uk/admin/courses?msg=bad_lesson');
    await run(A.updateLesson, {
      lesson: lessonIds[0],
      title: 'Новий',
      video: '',
      minutes: 'abc',
    });
    [l] = await db.select().from(lessons).where(eq(lessons.id, lessonIds[0]));
    expect(l).toMatchObject({ bunnyVideoId: null, durationMin: null });
  });

  it('dev refund is impossible on production', async () => {
    asAdmin();
    vi.stubEnv('NODE_ENV', 'production');
    await expect(
      run(A.devRefund, { payment: crypto.randomUUID() }),
    ).rejects.toThrow('dev only');
  });
});

describe('cabinet «переглянуто» and the automatic certificate', () => {
  const watch = async (lesson: string) => {
    await markLessonDone(form({ lesson }));
    for (const fn of later.splice(0)) await fn();
  };

  it('a lesson of a course she does not hold is not recorded', async () => {
    actor = { id: anna, role: 'student', mustChangePassword: false };
    await watch(lessonIds[0]);
    expect(await db.select().from(lessonProgress)).toHaveLength(0);
  });

  it('the admin cannot mark lessons (students only)', async () => {
    asAdmin();
    await expect(
      markLessonDone(form({ lesson: lessonIds[0] })),
    ).rejects.toThrow('forbidden');
  });

  it('the last lesson issues one certificate with her name and e-mails it once', async () => {
    await db
      .insert(enrollments)
      .values({ userId: anna, courseId: course, grantedBy: 'admin' });
    actor = { id: anna, role: 'student', mustChangePassword: false };
    await watch(lessonIds[0]);
    expect(await db.select().from(certificates)).toHaveLength(0);
    await watch(lessonIds[1]);
    await watch(lessonIds[1]);
    const certs = await db.select().from(certificates);
    expect(certs).toHaveLength(1);
    expect(certs[0]).toMatchObject({
      name: 'Anna Kowalska',
      email: 'anna@example.test',
      courseLine1: 'Microcapsule Hair Extensions',
    });
    expect(certs[0].number).toMatch(/^DEMO\/IPHM\/\d{4}\/\d{3}$/);
    expect(certs[0].sentAt).not.toBeNull();
    expect(sendEmail.mock.calls.map(([m]) => m.template)).toEqual([
      'certificate',
    ]);
  });

  it('no name in the profile → no certificate yet', async () => {
    await db.update(users).set({ name: null }).where(eq(users.id, anna));
    await db
      .insert(enrollments)
      .values({ userId: anna, courseId: course, grantedBy: 'admin' });
    actor = { id: anna, role: 'student', mustChangePassword: false };
    await watch(lessonIds[0]);
    await watch(lessonIds[1]);
    expect(await db.select().from(certificates)).toHaveLength(0);
  });
});

describe('salon prices — one save per group', () => {
  const groupForm = (rows: Record<string, [string, string, string]>) => {
    const f = new FormData();
    f.set('locale', 'uk');
    for (const [id, [m, t, d]] of Object.entries(rows)) {
      f.append('service', id);
      f.set(`master:${id}`, m);
      f.set(`top:${id}`, t);
      f.set(`duration:${id}`, d);
    }
    return f;
  };
  const save = async (f: FormData) => {
    try {
      await A.updateServiceGroup(f);
      return 'no redirect';
    } catch (e) {
      return (e as Error).message.replace('REDIRECT ', '');
    }
  };

  it('saves every row of the group at once; empty → null; unknown ids change nothing', async () => {
    asAdmin();
    await db.insert(services).values([
      { id: 'cut', groupId: 'g', name: 'Стрижка', masterPrice: '100 zł' },
      { id: 'wash', groupId: 'g', name: 'Миття', duration: '1 год' },
      { id: 'other', groupId: 'h', name: 'Інше', masterPrice: '5 zł' },
    ]);
    expect(
      await save(
        groupForm({
          cut: [' 120 zł ', '150 zł', '1 год'],
          wash: ['', '', ''],
          ghost: ['1', '2', '3'],
        }),
      ),
    ).toBe('/uk/admin/prices?msg=saved');
    const all = await db.select().from(services);
    const by = (id: string) => all.find((r) => r.id === id);
    expect(by('cut')).toMatchObject({
      masterPrice: '120 zł',
      topPrice: '150 zł',
      duration: '1 год',
    });
    expect(by('wash')).toMatchObject({
      masterPrice: null,
      topPrice: null,
      duration: null,
    });
    expect(by('other')?.masterPrice).toBe('5 zł');
    expect(all).toHaveLength(3);
  });

  it('a form without rows is refused', async () => {
    asAdmin();
    const f = new FormData();
    f.set('locale', 'uk');
    await expect(A.updateServiceGroup(f)).rejects.toThrow();
  });
});
