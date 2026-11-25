import { eq } from 'drizzle-orm';

import { getValidSession } from '@/lib/auth/session';
import { certFileName, certPdf } from '@/lib/certificate/issue';
import { db } from '@/lib/db/client';
import { certificates } from '@/lib/db/schema';

/** An issued certificate as PDF, rebuilt from its row (/admin/certificates list). Admin only. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });

  const s = await getValidSession();
  if (!s.ok || s.user.mustChangePassword || s.user.role !== 'admin')
    return new Response(null, { status: 401 });

  const [c] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, id));
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
