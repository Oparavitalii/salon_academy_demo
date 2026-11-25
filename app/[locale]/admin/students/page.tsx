import { and, asc, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  AdminShell,
  adminMetadata,
  fmtDate,
} from '@/components/AdminShell/AdminShell';
import { ConfirmButton } from '@/components/AdminShell/ConfirmButton';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  courses,
  courseTiers,
  enrollments,
  loginEvents,
  users,
} from '@/lib/db/schema';

import {
  blockStudent,
  changeStudentEmail,
  createStudent,
  grantCourse,
  resendAccess,
  revokeCourse,
  unblockStudent,
} from '../_actions';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string; msg?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return adminMetadata(params, 'students.title');
}

/**
 * `/admin/students` — DataTable (search, courses, status) · per-row actions: block / unblock,
 * change e-mail + resend access, a fresh «встановіть пароль» link, open / close a course; «Додати
 * вручну» folded on top. Suspicious logins moved to «Сьогодні» and the «Журнал входів» tab
 * (owner 31.10.2026). FR-14, FR-16; blocking is manual and confirmed — Decisions 19.10.2026.
 */
export default async function AdminStudents({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q = '', msg } = await searchParams;
  await requireUser(locale, 'admin');
  const ta = await getTranslations({ locale, namespace: 'admin' });
  const query = q.trim().slice(0, 100);

  const list = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.role, 'student'),
        query
          ? or(
              ilike(users.email, `%${query}%`),
              ilike(users.name, `%${query}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(200);
  const ids = list.map((u) => u.id);

  const enr = ids.length
    ? await db
        .select({
          userId: enrollments.userId,
          courseId: courses.id,
          title: courses.title,
          tier: courseTiers.name,
          by: enrollments.grantedBy,
        })
        .from(enrollments)
        .innerJoin(courses, eq(courses.id, enrollments.courseId))
        .leftJoin(courseTiers, eq(courseTiers.id, enrollments.tierId))
        .where(
          and(inArray(enrollments.userId, ids), isNull(enrollments.revokedAt)),
        )
    : [];
  // Only the latest login per student; the full history is on /admin/logins.
  const logins = ids.length
    ? await db
        .selectDistinctOn([loginEvents.userId])
        .from(loginEvents)
        .where(inArray(loginEvents.userId, ids))
        .orderBy(loginEvents.userId, desc(loginEvents.createdAt))
    : [];
  const allCourses = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .orderBy(asc(courses.position));

  const hidden = (
    <>
      <input type='hidden' name='locale' value={locale} />
      <input type='hidden' name='q' value={query} />
    </>
  );

  return (
    <AdminShell
      locale={locale}
      active='/admin/students'
      tabs='students'
      title={ta('students.title')}
      msg={msg}
    >
      <form className='inline_form filter_bar' method='get' role='search'>
        <label className='visually_hidden' htmlFor='q'>
          {ta('common.search')}
        </label>
        <input
          id='q'
          name='q'
          defaultValue={query}
          placeholder={ta('students.placeholder')}
        />
        <button type='submit' className='btn btn_sm'>
          {ta('students.find')}
        </button>
      </form>

      <details className='card app_section add_student'>
        <summary className='btn btn_sm'>{ta('students.addOpen')}</summary>
        <h2 className='visually_hidden'>{ta('students.add.heading')}</h2>
        <p className='note'>{ta('students.add.note')}</p>
        <form action={createStudent} className='inline_form'>
          {hidden}
          <input
            type='email'
            name='email'
            placeholder={ta('common.email')}
            aria-label={ta('common.email')}
            required
          />
          <select name='course' aria-label={ta('common.course')}>
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title[locale] ?? c.title.uk}
              </option>
            ))}
          </select>
          <button type='submit' className='btn btn_sm'>
            {ta('students.add.submit')}
          </button>
        </form>
      </details>

      {/* Owner 28.10: the 5-column table ran wider than the screen — one card per student instead. */}
      <ul className='student_list' aria-label={ta('students.title')}>
        {list.length === 0 && (
          <li className='note table_empty'>{ta('students.empty')}</li>
        )}
        {list.map((u) => {
          const mine = enr.filter((x) => x.userId === u.id);
          const last = logins.find((x) => x.userId === u.id);
          const blocked = !!u.blockedAt;
          return (
            <li key={u.id} className='card student_card'>
              <div className='student_head'>
                <b className='student_email'>{u.email}</b>
                {blocked ? (
                  <span className='tag tag_danger'>
                    {ta('students.blocked')}
                  </span>
                ) : (
                  <span className='tag tag_ok'>{ta('students.active')}</span>
                )}

                <span className='note'>
                  {u.name ?? '—'} · {u.phone ?? '—'} ·{' '}
                  {ta('students.since', {
                    date: fmtDate(u.createdAt, locale),
                  })}
                </span>
              </div>
              <div className='student_grid'>
                <div>
                  <p className='label'>{ta('students.th.courses')}</p>
                  <div className='cell_stack'>
                    {mine.length === 0 && <span className='note'>—</span>}
                    {mine.map((m) => (
                      <form
                        key={m.courseId}
                        action={revokeCourse}
                        className='inline_form'
                      >
                        {hidden}
                        <input type='hidden' name='user' value={u.id} />
                        <input type='hidden' name='course' value={m.courseId} />
                        <span>
                          {m.title[locale] ?? m.title.uk}
                          {m.tier ? ` · ${m.tier}` : ''}
                          {m.by === 'admin'
                            ? ` · ${ta('students.manual')}`
                            : ''}
                        </span>
                        <button type='submit' className='btn btn_sm btn_ghost'>
                          {ta('students.revoke')}
                        </button>
                      </form>
                    ))}
                    <form action={grantCourse} className='inline_form'>
                      {hidden}
                      <input type='hidden' name='user' value={u.id} />
                      <select name='course' aria-label={ta('common.course')}>
                        {allCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title[locale] ?? c.title.uk}
                          </option>
                        ))}
                      </select>
                      <button type='submit' className='btn btn_sm btn_outline'>
                        {ta('students.grant')}
                      </button>
                    </form>
                  </div>
                </div>
                <div>
                  <p className='label'>{ta('students.th.lastLogin')}</p>
                  {last ? (
                    <>
                      {fmtDate(last.createdAt, locale)}
                      <br />
                      <span className='note'>
                        {last.country ?? ta('common.countryUnknown')}
                        {last.city ? `, ${last.city}` : ''}
                      </span>
                      <br />
                      <Link href={`/admin/logins?u=${u.id}`}>
                        {ta('students.allLogins')}
                      </Link>
                    </>
                  ) : (
                    <span className='note'>{ta('students.neverLoggedIn')}</span>
                  )}
                </div>
                <div>
                  <p className='label'>{ta('students.th.actions')}</p>
                  <div className='cell_stack'>
                    <form action={resendAccess}>
                      {hidden}
                      <input type='hidden' name='user' value={u.id} />
                      <button type='submit' className='btn btn_sm btn_outline'>
                        {ta('students.resend')}
                      </button>
                    </form>
                    <details className='disclosure'>
                      <summary className='btn btn_sm btn_ghost'>
                        {ta('students.moreEmail')}
                      </summary>
                      <form action={changeStudentEmail} className='inline_form'>
                        {hidden}
                        <input type='hidden' name='user' value={u.id} />
                        <input
                          type='email'
                          name='email'
                          defaultValue={u.email}
                          aria-label={ta('students.newEmail')}
                          required
                        />
                        <button
                          type='submit'
                          className='btn btn_sm btn_outline'
                        >
                          {ta('students.changeEmail')}
                        </button>
                      </form>
                    </details>
                    <form action={blocked ? unblockStudent : blockStudent}>
                      {hidden}
                      <input type='hidden' name='user' value={u.id} />
                      {blocked ? (
                        <button
                          type='submit'
                          className='btn btn_sm btn_outline'
                        >
                          {ta('students.unblock')}
                        </button>
                      ) : (
                        <ConfirmButton
                          className='btn btn_sm btn_danger_quiet'
                          message={ta('students.blockConfirm', {
                            email: u.email,
                          })}
                        >
                          {ta('students.block')}
                        </ConfirmButton>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </AdminShell>
  );
}
