import { and, countDistinct, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  AdminShell,
  adminMetadata,
  fmtDate,
} from '@/components/AdminShell/AdminShell';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { finishedWithoutCertificate } from '@/lib/certificate/issue';
import { formatPln } from '@/lib/courses/seedPrices';
import { db } from '@/lib/db/client';
import {
  courses,
  enrollments,
  loginEvents,
  payments,
  users,
} from '@/lib/db/schema';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return adminMetadata(params, 'today.title');
}

const DAY = 24 * 60 * 60 * 1000;

/** The moment N days back (outside the component: the React compiler lint bans Date.now() in render). */
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

/**
 * `/admin` «Сьогодні» (owner 31.10.2026): the admin's start page. What needs a hand now — students
 * who finished a course without a certificate, suspicious logins of the last 7 days, paid orders
 * whose letter did not go out — each with a link straight to the place to act; then four numbers
 * and the latest payments and students. Was a redirect to /admin/payments.
 */
export default async function AdminToday({ params }: Props) {
  const { locale } = await params;
  await requireUser(locale, 'admin');
  const ta = await getTranslations({ locale, namespace: 'admin' });
  const since = daysAgo(7);

  const [pending, [sus], [noEmail], [paid], [enrolled], [active]] =
    await Promise.all([
      finishedWithoutCertificate(),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(loginEvents)
        .where(
          and(
            eq(loginEvents.suspicious, true),
            gte(loginEvents.createdAt, since),
          ),
        ),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(payments)
        .where(
          and(
            eq(payments.status, 'paid'),
            isNull(payments.emailSentAt),
            sql`(${payments.kind} = 'offline' or ${payments.userId} is not null)`,
          ),
        ),
      db
        .select({
          n: sql<number>`count(*)::int`,
          sum: sql<number>`coalesce(sum(${payments.amountMinor}), 0)::int`,
        })
        .from(payments)
        .where(
          and(eq(payments.status, 'paid'), gte(payments.createdAt, since)),
        ),
      db
        .select({ n: countDistinct(enrollments.userId) })
        .from(enrollments)
        .where(isNull(enrollments.revokedAt)),
      db
        .select({ n: countDistinct(loginEvents.userId) })
        .from(loginEvents)
        .innerJoin(users, eq(users.id, loginEvents.userId))
        .where(
          and(eq(users.role, 'student'), gte(loginEvents.createdAt, since)),
        ),
    ]);

  const recent = await db
    .select({ p: payments, course: courses.title })
    .from(payments)
    .innerJoin(courses, eq(courses.id, payments.courseId))
    .orderBy(desc(payments.createdAt))
    .limit(5);
  const fresh = await db
    .select({ email: users.email, name: users.name, at: users.createdAt })
    .from(users)
    .where(eq(users.role, 'student'))
    .orderBy(desc(users.createdAt))
    .limit(5);

  const todo = [
    [
      pending.length,
      ta('today.certs', { n: pending.length }),
      '/admin/certificates',
    ],
    [sus.n, ta('today.suspicious', { n: sus.n }), '/admin/logins?sus=1'],
    [noEmail.n, ta('today.noEmail', { n: noEmail.n }), '/admin/payments'],
  ].filter(([n]) => Number(n) > 0) as [number, string, string][];

  return (
    <AdminShell locale={locale} active='/admin' title={ta('today.title')}>
      <section className='card app_section'>
        <h2>{ta('today.todo')}</h2>
        {todo.length === 0 ? (
          <p className='note'>{ta('today.none')}</p>
        ) : (
          <ul className='todo_list'>
            {todo.map(([, text, href]) => (
              <li key={href}>
                <span>{text}</span>
                <Link className='btn btn_sm' href={href}>
                  {ta('today.go')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <dl className='kpi_grid'>
        <div className='kpi'>
          <dt>{ta('today.paid7')}</dt>
          <dd>{paid.n}</dd>
        </div>
        <div className='kpi'>
          <dt>{ta('today.sum7')}</dt>
          <dd>{formatPln(paid.sum)}</dd>
        </div>
        <div className='kpi'>
          <dt>{ta('today.enrolled')}</dt>
          <dd>{enrolled.n}</dd>
        </div>
        <div className='kpi'>
          <dt>{ta('today.active7')}</dt>
          <dd>{active.n}</dd>
        </div>
      </dl>

      <section className='card app_section'>
        <h2>{ta('today.recentPayments')}</h2>
        {recent.length === 0 ? (
          <p className='note'>{ta('today.none2')}</p>
        ) : (
          <ul className='feed'>
            {recent.map(({ p, course }) => (
              <li key={p.id}>
                <span className='feed_time'>
                  {fmtDate(p.createdAt, locale)}
                </span>
                <span>
                  {p.email} · {course[locale] ?? course.uk} ·{' '}
                  {formatPln(p.amountMinor)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link className='link_accent' href='/admin/payments'>
            {ta('today.allPayments')}
          </Link>
        </p>
      </section>

      <section className='card app_section'>
        <h2>{ta('today.newStudents')}</h2>
        {fresh.length === 0 ? (
          <p className='note'>{ta('today.none2')}</p>
        ) : (
          <ul className='feed'>
            {fresh.map((u) => (
              <li key={u.email}>
                <span className='feed_time'>{fmtDate(u.at, locale)}</span>
                <Link href={`/admin/students?q=${encodeURIComponent(u.email)}`}>
                  {u.name ? `${u.name} · ${u.email}` : u.email}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link className='link_accent' href='/admin/students'>
            {ta('today.allStudents')}
          </Link>
        </p>
      </section>
    </AdminShell>
  );
}
