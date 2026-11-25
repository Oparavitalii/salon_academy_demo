import { createHash } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  certificates,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  users,
} from '@/lib/db/schema';

import { resetDb, type TestDb } from '../helpers/Test_Db';

/**
 * Who may see a course, a lesson, a material and a video (FR-14, FR-20): the cabinet loaders,
 * the material download route and the signed Bunny URL — real SQL on PGlite, session faked.
 */
vi.mock('@/lib/db/client', async () => {
  const { makeTestDb } = await import('../helpers/Test_Db');
  return { db: await makeTestDb(), hasDb: true };
});
type Fake =
  | { ok: false; reason: 'none' }
  | {
      ok: true;
      user: {
        id: string;
        role: 'student' | 'admin';
        mustChangePassword: boolean;
      };
    };
let session: Fake = { ok: false, reason: 'none' };
vi.mock('@/lib/auth/session', () => ({ getValidSession: async () => session }));

const { db } = (await import('@/lib/db/client')) as unknown as { db: TestDb };
const { getCourseFor, getEnrolledCourse, getMyCourses } =
  await import('@/lib/courses/cabinet');
const { GET } = await import('@/app/api/materials/[lessonId]/[index]/route');
const { signedEmbedUrl } = await import('@/lib/video/embed');

const t = (s: string) => ({ uk: s, pl: s, en: s });
let anna: string;
let olha: string;
let admin: string;
let courseA: string;
let courseB: string;
let lessonA1: string;
let lessonB1: string;

beforeEach(async () => {
  await resetDb(db);
  [{ id: anna }, { id: olha }, { id: admin }] = await db
    .insert(users)
    .values([
      { email: 'anna@example.test', role: 'student' },
      { email: 'olha@example.test', role: 'student' },
      { email: 'admin@example.test', role: 'admin' },
    ])
    .returning({ id: users.id });
  [{ id: courseA }, { id: courseB }] = await db
    .insert(courses)
    .values([
      { slug: 'course-a', kind: 'online', title: t('A'), position: 1 },
      { slug: 'course-b', kind: 'online', title: t('B'), position: 2 },
    ])
    .returning({ id: courses.id });
  const ls = await db
    .insert(lessons)
    .values([
      {
        courseId: courseA,
        position: 1,
        title: t('A1'),
        bunnyVideoId: 'vid-a1',
        materials: [
          { title: 'Чекліст', url: 'https://cdn.example.test/a1.pdf' },
          { title: 'Bad', url: 'http://insecure.example.test/x.pdf' },
        ],
      },
      { courseId: courseA, position: 2, title: t('A2') },
      {
        courseId: courseB,
        position: 1,
        title: t('B1'),
        materials: [{ title: 'B', url: 'https://cdn.example.test/b1.pdf' }],
      },
    ])
    .returning({ id: lessons.id });
  [lessonA1, , lessonB1] = ls.map((l) => l.id);
  await db
    .insert(enrollments)
    .values({ userId: anna, courseId: courseA, grantedBy: 'admin' });
  session = { ok: false, reason: 'none' };
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response('PDF', { headers: { 'content-type': 'application/pdf' } }),
    ),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const as = (
  id: string,
  role: 'student' | 'admin' = 'student',
  mustChangePassword = false,
) => {
  session = { ok: true, user: { id, role, mustChangePassword } };
};
const download = (lessonId: string, index = '0') =>
  GET(new Request('https://x.test'), {
    params: Promise.resolve({ lessonId, index }),
  });

describe('cabinet loaders', () => {
  it('an enrolled student gets her course with every lesson', async () => {
    const c = await getEnrolledCourse(anna, 'course-a');
    expect(c?.course.id).toBe(courseA);
    expect(c?.lessons.map((l) => l.position)).toEqual([1, 2]);
  });

  it('another student, or a course she did not buy → null', async () => {
    expect(await getEnrolledCourse(olha, 'course-a')).toBeNull();
    expect(await getEnrolledCourse(anna, 'course-b')).toBeNull();
    expect(await getEnrolledCourse(anna, 'no-such-course')).toBeNull();
  });

  it('a revoked enrollment (refund / dispute / admin) closes the course', async () => {
    await db.update(enrollments).set({ revokedAt: new Date() });
    expect(await getEnrolledCourse(anna, 'course-a')).toBeNull();
    expect(await getMyCourses(anna)).toEqual([]);
  });

  it('the admin previews any course; a student only hers', async () => {
    expect(
      (await getCourseFor({ id: admin, role: 'admin' }, 'course-b'))?.course.id,
    ).toBe(courseB);
    expect(
      await getCourseFor({ id: anna, role: 'student' }, 'course-b'),
    ).toBeNull();
  });

  it('progress and the certificate flag are her own, not another student’s', async () => {
    await db
      .insert(lessonProgress)
      .values({ userId: anna, lessonId: lessonA1 });
    await db
      .insert(enrollments)
      .values({ userId: olha, courseId: courseA, grantedBy: 'admin' });
    const [mine] = await getMyCourses(anna);
    expect(mine).toMatchObject({
      total: 2,
      done: 1,
      nextPosition: 2,
      certified: false,
    });
    const [hers] = await getMyCourses(olha);
    expect(hers).toMatchObject({ done: 0, nextPosition: 1 });

    await db.insert(certificates).values({
      number: '1/2026',
      year: 2026,
      seq: 1,
      name: 'Anna',
      email: 'anna@example.test',
      userId: anna,
      courseId: courseA,
      courseLine1: 'A',
      issuedOn: '30.10.2026',
    });
    expect((await getMyCourses(anna))[0].certified).toBe(true);
  });
});

describe('material download route', () => {
  it('bad ids → 404 before any lookup', async () => {
    as(anna);
    expect((await download('not-a-uuid')).status).toBe(404);
    expect((await download(lessonA1, 'x')).status).toBe(404);
  });

  it('no session → 401; a session that must change its password → 401', async () => {
    expect((await download(lessonA1)).status).toBe(401);
    as(anna, 'student', true);
    expect((await download(lessonA1)).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('enrolled student → the file streamed as an attachment, never cached, source URL hidden', async () => {
    as(anna);
    const r = await download(lessonA1);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-disposition')).toMatch(
      /^attachment; filename\*=UTF-8''/,
    );
    expect(r.headers.get('cache-control')).toBe('private, no-store');
    expect(r.headers.get('location')).toBeNull();
    expect(await r.text()).toBe('PDF');
  });

  it('a student without that course → 404 and the source is never fetched', async () => {
    as(olha);
    expect((await download(lessonA1)).status).toBe(404);
    as(anna);
    expect((await download(lessonB1)).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('revoked enrollment → 404', async () => {
    await db.update(enrollments).set({ revokedAt: new Date() });
    as(anna);
    expect((await download(lessonA1)).status).toBe(404);
  });

  it('the admin downloads any lesson’s material (preview)', async () => {
    as(admin, 'admin');
    expect((await download(lessonB1)).status).toBe(200);
  });

  it('missing index or a non-https source → 404; upstream down → 502', async () => {
    as(anna);
    expect((await download(lessonA1, '7')).status).toBe(404);
    expect((await download(lessonA1, '1')).status).toBe(404);
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }));
    expect((await download(lessonA1)).status).toBe(502);
  });
});

describe('signed Bunny embed URL', () => {
  it('null without a video id or without the library / key', () => {
    vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', '123');
    vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', 'k');
    expect(signedEmbedUrl(null)).toBeNull();
    vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', '');
    expect(signedEmbedUrl('vid')).toBeNull();
  });

  it('token = SHA-256(key + video id + expires), expires in 1 hour, key never in the URL', () => {
    vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', '100001');
    vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', 'secret-key');
    const now = Math.floor(Date.now() / 1000);
    const u = new URL(signedEmbedUrl('vid-a1')!);
    const expires = Number(u.searchParams.get('expires'));
    expect(expires - now).toBeGreaterThanOrEqual(3599);
    expect(expires - now).toBeLessThanOrEqual(3601);
    expect(u.searchParams.get('token')).toBe(
      createHash('sha256').update(`secret-keyvid-a1${expires}`).digest('hex'),
    );
    expect(u.pathname).toBe('/embed/100001/vid-a1');
    expect(u.toString()).not.toContain('secret-key');
  });

  it('a token for one lesson does not fit another lesson', () => {
    vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', '1');
    vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', 'k');
    const a = new URL(signedEmbedUrl('vid-a')!);
    const b = new URL(signedEmbedUrl('vid-b')!);
    expect(a.searchParams.get('token')).not.toBe(b.searchParams.get('token'));
  });
});
