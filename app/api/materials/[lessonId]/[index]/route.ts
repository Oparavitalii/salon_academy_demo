import { and, eq, isNull } from 'drizzle-orm';

import { getValidSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { enrollments, lessons } from '@/lib/db/schema';

/**
 * Lesson material download, gated: active session (one-session rule, not blocked, password
 * already changed) + a student with an active enrollment in the lesson's course, or the admin
 * (preview of every course). The file is streamed
 * through this route, so the stored source URL never reaches the browser. `no-store`.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string; index: string }> },
) {
  const { lessonId, index } = await params;
  if (!/^[0-9a-f-]{36}$/.test(lessonId) || !/^\d{1,3}$/.test(index))
    return new Response(null, { status: 404 });

  const s = await getValidSession();
  if (!s.ok || s.user.mustChangePassword)
    return new Response(null, { status: 401 });

  const [row] =
    s.user.role === 'admin'
      ? await db
          .select({ materials: lessons.materials })
          .from(lessons)
          .where(eq(lessons.id, lessonId))
      : await db
          .select({ materials: lessons.materials })
          .from(lessons)
          .innerJoin(
            enrollments,
            and(
              eq(enrollments.courseId, lessons.courseId),
              eq(enrollments.userId, s.user.id),
              isNull(enrollments.revokedAt),
            ),
          )
          .where(eq(lessons.id, lessonId));
  const material = row?.materials[Number(index)];
  if (!material || !/^https:\/\//.test(material.url))
    return new Response(null, { status: 404 });

  const upstream = await fetch(material.url, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body)
    return new Response(null, { status: 502 });

  const ext = new URL(material.url).pathname.split('.').pop() ?? '';
  const name = `${material.title.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 80) || 'material'}${ext && ext.length <= 5 ? `.${ext}` : ''}`;
  return new Response(upstream.body, {
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/octet-stream',
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
