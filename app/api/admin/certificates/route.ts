import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { routing, type Locale } from '@/i18n/routing';
import { getValidSession } from '@/lib/auth/session';
import {
  CERT_COURSES,
  certFileName,
  certNumber,
  certPdf,
  issueForCourse,
  nextSeq,
  seqTaken,
  sendCertificate,
} from '@/lib/certificate/issue';
import { db } from '@/lib/db/client';
import { certificates, courses, users } from '@/lib/db/schema';

/**
 * The /admin/certificates form (plain HTML POST, no JS needed):
 *   intent=preview → the PDF opens in a new tab, nothing is saved;
 *   intent=send    → row saved, PDF e-mailed, back to the list with a status;
 *   intent=resend  → the saved certificate is rebuilt and e-mailed again;
 *   intent=issue   → «Видати» for a student who finished a course (name from her profile).
 * The student is picked from the list — her e-mail comes from the account (owner 30.10.2026).
 * Admin only, same-origin only (a cross-site form post is refused).
 */

const Form = z.object({
  user: z.string().uuid(),
  /** Name on the certificate; empty = «Ім'я для сертифіката» from her profile. */
  name: z.string().trim().max(80),
  course: z.string(),
  line1: z.string().trim().max(80),
  line2: z.string().trim().max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seq: z
    .string()
    .trim()
    .regex(/^\d{0,5}$/),
});

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host)
    return new Response(null, { status: 403 });

  const s = await getValidSession();
  if (!s.ok || s.user.mustChangePassword || s.user.role !== 'admin')
    return new Response(null, { status: 401 });

  const fd = await req.formData();
  const l = String(fd.get('locale') ?? '');
  const locale: Locale = (routing.locales as readonly string[]).includes(l)
    ? (l as Locale)
    : routing.defaultLocale;
  const back = (msg: string) =>
    new Response(null, {
      status: 303,
      headers: { location: `/${locale}/admin/certificates?msg=${msg}` },
    });

  const intent = String(fd.get('intent') ?? '');

  if (intent === 'resend') {
    const id = z.string().uuid().safeParse(fd.get('id'));
    if (!id.success) return back('bad_cert');
    const [c] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, id.data));
    if (!c) return back('bad_cert');
    try {
      await sendCertificate(c);
    } catch (e) {
      console.error('certificate resend failed', e);
      return back('cert_not_sent');
    }
    return back('cert_sent');
  }

  if (intent === 'issue') {
    const ids = z
      .object({ user: z.string().uuid(), course: z.string().uuid() })
      .safeParse(Object.fromEntries(fd));
    if (!ids.success) return back('bad_cert');
    try {
      const r = await issueForCourse(ids.data.user, ids.data.course, {
        force: true,
      });
      if (r.ok) return back(r.sent ? 'cert_sent' : 'cert_not_sent');
      return back(r.reason === 'no_name' ? 'cert_no_name' : 'bad_cert');
    } catch (e) {
      console.error('certificate issue failed', e);
      return back('cert_not_sent');
    }
  }

  const f = Form.safeParse(Object.fromEntries(fd));
  if (!f.success) return back('bad_cert');
  const v = f.data;
  const preset = CERT_COURSES.find((c) => c.slug === v.course);
  const line1 = v.line1 || preset?.line1 || '';
  const line2 = v.line1 ? v.line2 : (preset?.line2 ?? v.line2);
  if (!line1) return back('bad_cert');
  const year = Number(v.date.slice(0, 4));
  if (year < 2020 || year > 2100) return back('bad_cert');

  const [u] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, v.user));
  if (!u) return back('bad_cert');
  const name = (v.name || u.name || '').trim().replace(/\s+/g, ' ');
  if (!name) return back('cert_no_name');
  const seq = v.seq ? Number(v.seq) : await nextSeq(year);
  if (seq < 1) return back('bad_cert');
  const row = {
    name,
    email: u.email,
    courseLine1: line1,
    courseLine2: line2 || null,
    issuedOn: v.date,
    number: certNumber(year, seq),
    year,
    seq,
  };

  if (intent === 'preview') {
    const pdf = await certPdf(row);
    return new Response(Buffer.from(pdf), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(certFileName(row))}`,
        'cache-control': 'private, no-store',
      },
    });
  }
  if (intent !== 'send') return back('bad_cert');

  if (await seqTaken(year, seq)) return back('cert_number_taken');
  // a preset course is linked to the student once — the automatic certificate then never repeats
  // it; a second manual one for the same course stays unlinked
  let courseId: string | null = null;
  if (preset) {
    const [c] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.slug, preset.slug));
    const [had] = c
      ? await db
          .select({ id: certificates.id })
          .from(certificates)
          .where(
            and(eq(certificates.userId, u.id), eq(certificates.courseId, c.id)),
          )
      : [];
    courseId = c && !had ? c.id : null;
  }
  const [saved] = await db
    .insert(certificates)
    .values({ ...row, userId: u.id, courseId })
    .onConflictDoNothing()
    .returning();
  if (!saved) return back('cert_number_taken');
  try {
    await sendCertificate(saved);
  } catch (e) {
    console.error('certificate send failed', e);
    return back('cert_not_sent');
  }
  return back('cert_sent');
}
