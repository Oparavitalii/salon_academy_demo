import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  AdminShell,
  adminMetadata,
  fmtDate,
} from '@/components/AdminShell/AdminShell';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { formatPln } from '@/lib/courses/seedPrices';
import { db } from '@/lib/db/client';
import { courses, courseTiers, payments } from '@/lib/db/schema';
import { localSimulationAllowed } from '@/lib/demo/mode';

import { devRefund } from '../_actions';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ msg?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return adminMetadata(params, 'payments.title');
}

/** `/admin/payments` — BillingTable: учениця, курс, тариф, сума, статус (FR-16). */
export default async function AdminPayments({ params, searchParams }: Props) {
  const { locale } = await params;
  const { msg } = await searchParams;
  await requireUser(locale, 'admin');
  const ta = await getTranslations({ locale, namespace: 'admin' });
  const dev = localSimulationAllowed() && !process.env.STRIPE_SECRET_KEY;

  const rows = await db
    .select({
      p: payments,
      course: courses.title,
      tier: courseTiers.name,
    })
    .from(payments)
    .innerJoin(courses, eq(courses.id, payments.courseId))
    .leftJoin(courseTiers, eq(courseTiers.id, payments.tierId))
    .orderBy(desc(payments.createdAt))
    .limit(300);

  return (
    <AdminShell
      locale={locale}
      active='/admin/payments'
      tabs='payments'
      title={ta('payments.title')}
      msg={msg}
    >
      <p className='note'>{ta('payments.note')}</p>
      <div
        className='table_wrap'
        role='region'
        aria-label={ta('payments.title')}
        tabIndex={0}
      >
        <table className='data_table data_stack'>
          <thead>
            <tr>
              <th>{ta('payments.th.date')}</th>
              <th>{ta('common.email')}</th>
              <th>{ta('common.course')}</th>
              <th>{ta('payments.th.tier')}</th>
              <th>{ta('payments.th.sum')}</th>
              <th>{ta('payments.th.format')}</th>
              <th>{ta('common.status')}</th>
              {dev && <th>Dev</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={dev ? 8 : 7} className='table_empty'>
                  {ta('payments.empty')}
                </td>
              </tr>
            )}
            {rows.map(({ p, course, tier }) => (
              <tr key={p.id}>
                <td className='cell_num cell_title'>
                  {fmtDate(p.createdAt, locale)}
                </td>
                <td data-label={ta('common.email')} className='cell_wrap'>
                  {p.email}
                </td>
                <td data-label={ta('common.course')}>
                  {course[locale] ?? course.uk}
                </td>
                <td data-label={ta('payments.th.tier')}>{tier ?? '—'}</td>
                <td data-label={ta('payments.th.sum')}>
                  {formatPln(p.amountMinor)}
                </td>
                <td data-label={ta('payments.th.format')}>
                  {p.kind === 'online'
                    ? ta('common.online')
                    : ta('payments.kind.offline')}
                </td>
                <td data-label={ta('common.status')}>
                  <span className='tag_row'>
                    {p.status === 'paid' ? (
                      <span className='tag tag_ok'>
                        {ta('payments.status.paid')}
                      </span>
                    ) : p.status === 'failed' ? (
                      <span className='tag tag_warn'>
                        {ta('payments.status.failed')}
                      </span>
                    ) : p.status === 'disputed' ? (
                      <span className='tag tag_danger'>
                        {ta('payments.status.disputed')}
                      </span>
                    ) : (
                      <span className='tag tag_danger'>
                        {ta('payments.status.refunded')}
                      </span>
                    )}
                    {/* buyer letter not delivered (yet): Stripe retries; check Resend */}
                    {p.status === 'paid' &&
                      !p.emailSentAt &&
                      (p.kind === 'offline' || p.userId) && (
                        <span className='tag tag_warn'>
                          {ta('payments.noEmail')}
                        </span>
                      )}
                    {!p.livemode && (
                      <span className='tag'>{ta('payments.test')}</span>
                    )}
                  </span>
                </td>
                {dev && (
                  <td data-label='Dev'>
                    {p.status === 'paid' && (
                      <form action={devRefund}>
                        <input type='hidden' name='locale' value={locale} />
                        <input type='hidden' name='payment' value={p.id} />
                        <button
                          type='submit'
                          className='btn btn_sm btn_outline'
                        >
                          {ta('payments.devRefund')}
                        </button>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
