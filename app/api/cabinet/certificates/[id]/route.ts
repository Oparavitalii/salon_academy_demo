import { and, eq } from 'drizzle-orm';

import { getValidSession } from '@/lib/auth/session';
import { certFileName, certPdf } from '@/lib/certificate/issue';
import { db } from '@/lib/db/client';
import { certificates } from '@/lib/db/schema';

/** The student's own certificate as PDF (/cabinet/certificates). Someone else's id → 404. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });

  const s = await getValidSession();
  if (!s.ok || s.user.mustChangePassword || s.user.role !== 'student')
    return new Response(null, { status: 401 });

  const [c] = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.id, id), eq(certificates.userId, s.user.id)));
  if (!c) return new Response(null, { status: 404 });

  const pdf = await certPdf(c);
  return new Response(Buffer.from(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(certFileName(c))}`,
      'cache-control': 'private, no-store',
    },
  });
}
