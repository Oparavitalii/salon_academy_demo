import { and, desc, eq, ilike, type SQL } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  AdminShell,
  adminMetadata,
  fmtDate,
} from '@/components/AdminShell/AdminShell';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { shortDevice } from '@/lib/auth/device';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { loginEvents, users } from '@/lib/db/schema';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string; u?: string; sus?: string; p?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return adminMetadata(params, 'logins.title');
}

const UUID = /^[0-9a-f-]{36}$/i;
const PAGE = 50;

/**
 * `/admin/logins` — every recorded login of every account (students and admin): when, which
 * device, from which country/city, suspicious or not. Filters: `?q=` e-mail/name, `?u=` one
 * user (linked from /admin/students), `?sus=1` suspicious only. Newest first, 50 a page (`?p=`,
 * owner 31.10.2026 — one endless list was 13 700 px tall). A tab of «Учениці».
 */
export default async function AdminLogins({ searchParams, params }: Props) {
  const { locale } = await params;
  const { q = '', u, sus, p = '1' } = await searchParams;
  await requireUser(locale, 'admin');
  const ta = await getTranslations({ locale, namespace: 'admin' });
  const query = q.trim().slice(0, 100);
  const userId = u && UUID.test(u) ? u : undefined;
  const onlySus = sus === '1';
  const page = Math.min(Math.max(Number.parseInt(p, 10) || 1, 1), 1000);

  const where: SQL[] = [];
  if (userId) where.push(eq(loginEvents.userId, userId));
  if (query) where.push(ilike(users.email, `%${query}%`));
  if (onlySus) where.push(eq(loginEvents.suspicious, true));

  const fetched = await db
    .select({
      e: loginEvents,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(loginEvents)
    .innerJoin(users, eq(users.id, loginEvents.userId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(loginEvents.createdAt))
    .limit(PAGE + 1)
    .offset((page - 1) * PAGE);
  const hasOlder = fetched.length > PAGE;
  const rows = fetched.slice(0, PAGE);
  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    if (query) sp.set('q', query);
    if (userId) sp.set('u', userId);
    if (onlySus) sp.set('sus', '1');
    if (n > 1) sp.set('p', String(n));
    const qs = sp.toString();
    return `/admin/logins${qs ? `?${qs}` : ''}`;
  };

  const who = userId ? rows[0] : undefined;
  const countries = new Set(rows.map((r) => r.e.country ?? '?'));

  return (
    <AdminShell
      locale={locale}
      active='/admin/logins'
      tabs='students'
      title={ta('logins.title')}
    >
      <form className='inline_form filter_bar' method='get' role='search'>
        <label className='visually_hidden' htmlFor='q'>
          {ta('common.search')}
        </label>
        <input
          id='q'
          name='q'
          defaultValue={query}
          placeholder={ta('logins.placeholder')}
        />
        <label className='inline_check'>
          <input
            type='checkbox'
            name='sus'
            value='1'
            defaultChecked={onlySus}
          />{' '}
          {ta('logins.onlySuspicious')}
        </label>
        <button type='submit' className='btn btn_sm'>
          {ta('logins.show')}
        </button>
        {(query || userId || onlySus) && (
          <Link href='/admin/logins' className='btn btn_sm btn_outline'>
            {ta('logins.reset')}
          </Link>
        )}
      </form>

      <p className='note'>
        {userId
          ? who
            ? ta('logins.userCount', {
                who: `${who.email}${who.name ? ` (${who.name})` : ''}`,
                n: rows.length,
              })
            : ta('logins.userNone')
          : ta('logins.summary', {
              page,
              n: rows.length,
              countries: countries.size,
            })}{' '}
        {ta('logins.geoNote')}{' '}
        <a href='https://db-ip.com' rel='noopener noreferrer' target='_blank'>
          DB-IP
        </a>{' '}
        (CC BY 4.0).
      </p>

      {rows.length > 0 && (
        <div
          className='table_wrap'
          role='region'
          aria-label={ta('logins.title')}
          tabIndex={0}
        >
          <table className='data_table data_stack data_stack_feed'>
            <thead>
              <tr>
                <th>{ta('logins.th.when')}</th>
                <th>{ta('logins.th.who')}</th>
                <th>{ta('logins.th.device')}</th>
                <th>{ta('logins.th.from')}</th>
                <th>{ta('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, email, name, role }) => (
                <tr key={e.id}>
                  <td className='cell_num cell_when'>
                    {fmtDate(e.createdAt, locale)}
                  </td>
                  <td className='cell_who'>
                    <Link href={`/admin/logins?u=${e.userId}`}>{email}</Link>
                    {name && (
                      <>
                        <br />
                        <span className='note'>{name}</span>
                      </>
                    )}
                    {role === 'admin' && (
                      <>
                        <br />
                        <span className='tag'>{ta('logins.admin')}</span>
                      </>
                    )}
                  </td>
                  <td title={e.device} className='cell_device'>
                    {shortDevice(e.device)}
                  </td>
                  <td className='cell_from'>
                    {e.country ?? ta('common.countryUnknown')}
                    {e.city ? `, ${e.city}` : ''}
                  </td>
                  <td className='cell_state'>
                    {e.suspicious ? (
                      <span className='tag tag_danger'>
                        {ta('common.suspicious')}
                      </span>
                    ) : (
                      <span className='tag tag_ok'>{ta('logins.normal')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(page > 1 || hasOlder) && (
        <nav className='pager' aria-label={ta('logins.title')}>
          {page > 1 ? (
            <Link className='btn btn_sm btn_outline' href={pageHref(page - 1)}>
              {ta('logins.newer')}
            </Link>
          ) : (
            <span />
          )}
          {hasOlder && (
            <Link className='btn btn_sm btn_outline' href={pageHref(page + 1)}>
              {ta('logins.older')}
            </Link>
          )}
        </nav>
      )}
    </AdminShell>
  );
}
