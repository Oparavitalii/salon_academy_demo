import { asc } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  AdminShell,
  adminMetadata,
  INTL_LOCALE,
} from '@/components/AdminShell/AdminShell';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { catalog, courseDetails } from '@/lib/content/courses';
import {
  ACTIVE_DAYS,
  type StudentRow,
  STALE_DAYS,
  getCourseReports,
} from '@/lib/courses/adminStats';
import { db } from '@/lib/db/client';
import { courses } from '@/lib/db/schema';

import { updateCourseOnSite, updateLesson } from '../_actions';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ msg?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return adminMetadata(params, 'courses.title');
}

const date = (d: Date | null, locale: Locale) =>
  d
    ? d.toLocaleDateString(INTL_LOCALE[locale], {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Warsaw',
      })
    : '—';

/**
 * `/admin/courses` «Курси» (owner 31.10.2026 regroup): on top, every course's price and «доступний /
 * скоро» in one row with one «Зберегти» (moved here from «Ціни», so the status is edited in one
 * place only). Below, online courses only (owner 28.10: «не має сенсу тримати офлайн курси»). Per course, the report course platforms
 * show (Teachable / Thinkific / LearnDash): KPI tiles (with access · started · finished · average
 * progress · active in 7 days · not started), the lesson-by-lesson drop-off with the worst step
 * marked, the students table (progress, last lesson, last activity, state), then status and the
 * lesson editor. Data: enrollments (not revoked) × lesson_progress.
 */
export default async function AdminCourses({ params, searchParams }: Props) {
  const { locale } = await params;
  const { msg } = await searchParams;
  await requireUser(locale, 'admin');
  const ta = await getTranslations({ locale, namespace: 'admin' });
  const STATE: Record<StudentRow['state'], { label: string; cls: string }> = {
    finished: { label: ta('courses.state.finished'), cls: 'tag tag_ok' },
    learning: { label: ta('courses.state.learning'), cls: 'tag' },
    stale: {
      label: ta('courses.state.stale', { n: STALE_DAYS }),
      cls: 'tag tag_warn',
    },
    not_started: { label: ta('courses.state.notStarted'), cls: 'tag tag_warn' },
  };
  // Only the courses that have a page on the site — the «coloring» / «keratin» drafts stay out.
  const pages = new Set(courseDetails.map((d) => d.slug));
  const reports = (await getCourseReports()).filter((r) =>
    pages.has(r.course.slug),
  );
  const hidden = <input type='hidden' name='locale' value={locale} />;
  const list = await db.select().from(courses).orderBy(asc(courses.position));
  const codePrice = new Map(catalog.map((k) => [k.slug, k.price.uk]));

  return (
    <AdminShell
      locale={locale}
      active='/admin/courses'
      title={ta('courses.title')}
      msg={msg}
    >
      <p className='note'>{ta('courses.intro')}</p>
      <section className='card app_section'>
        <h2>{ta('courses.site')}</h2>
        <p className='note'>{ta('prices.courseTable.note')}</p>
        <div
          className='table_wrap'
          role='region'
          aria-label={ta('prices.courseTable.region')}
          tabIndex={0}
        >
          <table className='data_table data_stack'>
            <thead>
              <tr>
                <th>{ta('common.course')}</th>
                <th>{ta('prices.courseTable.now')}</th>
                <th>
                  {ta('prices.courseTable.newPrice')} ·{' '}
                  {ta('prices.courseTable.onSite')}
                </th>
              </tr>
            </thead>
            <tbody>
              {list
                .filter((c) => codePrice.has(c.slug))
                .map((c) => (
                  <tr key={c.id}>
                    <td className='cell_title'>
                      {c.title[locale] ?? c.title.uk}{' '}
                      <span className='tag'>
                        {c.kind === 'online'
                          ? ta('common.online')
                          : ta('prices.courseTable.offline')}
                      </span>
                      {c.status === 'soon' && (
                        <span className='tag tag_warn'>
                          {ta('common.soon')}
                        </span>
                      )}
                    </td>
                    <td data-label={ta('prices.courseTable.now')}>
                      {c.priceEur
                        ? `${c.priceEur} €`
                        : ta('prices.courseTable.fromText', {
                            price: codePrice.get(c.slug) ?? '',
                          })}
                    </td>
                    <td className='cell_block'>
                      <form action={updateCourseOnSite} className='inline_form'>
                        {hidden}
                        <input type='hidden' name='course' value={c.id} />
                        <input
                          name='price'
                          inputMode='numeric'
                          defaultValue={c.priceEur ?? ''}
                          placeholder={codePrice.get(c.slug)?.replace(' €', '')}
                          aria-label={ta('prices.courseTable.priceAria', {
                            course: c.title[locale] ?? c.title.uk,
                          })}
                          className='input_narrow'
                        />
                        <select
                          name='status'
                          defaultValue={c.status}
                          aria-label={ta('prices.courseTable.statusAria', {
                            course: c.title[locale] ?? c.title.uk,
                          })}
                        >
                          <option value='available'>
                            {ta('common.available')}
                          </option>
                          <option value='soon'>
                            {ta('prices.courseTable.soonHidden')}
                          </option>
                        </select>
                        <button type='submit' className='btn btn_sm'>
                          {ta('common.save')}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      {reports.map(
        ({
          course: c,
          lessons: cl,
          total,
          students,
          funnel,
          kpi,
          biggestDrop,
        }) => (
          <section key={c.id} className='card app_section'>
            <h2>
              {c.title[locale] ?? c.title.uk}{' '}
              <span className='tag'>{ta('common.online')}</span>
              {c.status === 'soon' && (
                <span className='tag tag_warn'>{ta('common.soon')}</span>
              )}
            </h2>
            <p className='note'>
              <Link className='hv-link' href={`/courses/${c.slug}`}>
                /courses/{c.slug}
              </Link>{' '}
              · {ta('courses.lessonsCount', { n: total })}
            </p>

            {total === 0 && <p className='note'>{ta('courses.noLessons')}</p>}
            {total > 0 && (
              <dl className='kpi_grid'>
                <div className='kpi'>
                  <dt>{ta('courses.kpi.enrolled')}</dt>
                  <dd>{kpi.enrolled}</dd>
                </div>
                <div className='kpi'>
                  <dt>{ta('courses.kpi.started')}</dt>
                  <dd>{kpi.started}</dd>
                </div>
                <div className='kpi'>
                  <dt>{ta('courses.kpi.finished')}</dt>
                  <dd>
                    {kpi.finished}
                    {kpi.enrolled > 0 && (
                      <small>
                        {' '}
                        · {Math.round((kpi.finished / kpi.enrolled) * 100)}%
                      </small>
                    )}
                  </dd>
                </div>
                <div className='kpi'>
                  <dt>{ta('courses.kpi.avgProgress')}</dt>
                  <dd>{kpi.avgPct}%</dd>
                </div>
                <div className='kpi'>
                  <dt>{ta('courses.kpi.active', { n: ACTIVE_DAYS })}</dt>
                  <dd>{kpi.active}</dd>
                </div>
                <div className='kpi'>
                  <dt>{ta('courses.kpi.notStarted')}</dt>
                  <dd>{kpi.notStarted}</dd>
                </div>
              </dl>
            )}

            {total > 0 && kpi.enrolled > 0 && (
              <details className='disclosure' open>
                <summary className='btn btn_sm btn_outline'>
                  {ta('courses.funnel.summary')}
                </summary>
                {biggestDrop && (
                  <p className='note'>
                    {ta('courses.funnel.biggestDrop', {
                      position: biggestDrop.position,
                      lost: biggestDrop.lost,
                    })}
                  </p>
                )}
                <ol className='funnel'>
                  {funnel.map((l) => (
                    <li
                      key={l.id}
                      className={
                        biggestDrop?.position === l.position
                          ? 'funnel_row is_drop'
                          : 'funnel_row'
                      }
                    >
                      <span className='funnel_num'>{l.position}</span>
                      <span className='funnel_title'>{l.title}</span>
                      <span className='funnel_bar' aria-hidden='true'>
                        <span style={{ width: `${l.pct}%` }} />
                      </span>
                      <span className='funnel_val'>
                        {ta('courses.funnel.value', {
                          watched: l.watched,
                          enrolled: kpi.enrolled,
                          pct: l.pct,
                        })}
                      </span>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {total === 0 ? null : students.length > 0 ? (
              <div
                className='table_wrap'
                role='region'
                aria-label={ta('courses.studentsRegion', {
                  course: c.title[locale] ?? c.title.uk,
                })}
                tabIndex={0}
              >
                <table className='data_table data_stack'>
                  <thead>
                    <tr>
                      <th>{ta('common.student')}</th>
                      <th>{ta('courses.th.since')}</th>
                      <th>{ta('courses.th.progress')}</th>
                      <th>{ta('courses.th.lastLesson')}</th>
                      <th>{ta('courses.th.lastActivity')}</th>
                      <th>{ta('courses.th.state')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.userId}>
                        <td className='cell_title'>
                          <Link
                            href={`/admin/students?q=${encodeURIComponent(s.email)}`}
                          >
                            {s.name || s.email}
                          </Link>
                          {s.name && <span className='note'> {s.email}</span>}
                        </td>
                        <td data-label={ta('courses.th.since')}>
                          {date(s.since, locale)}
                        </td>
                        <td data-label={ta('courses.th.progress')}>
                          <span>
                            <span className='mini_progress' aria-hidden='true'>
                              <span style={{ width: `${s.pct}%` }} />
                            </span>{' '}
                            {s.pct}% · {s.done}/{total}
                          </span>
                        </td>
                        <td data-label={ta('courses.th.lastLesson')}>
                          {s.lastLesson ?? '—'}
                        </td>
                        <td data-label={ta('courses.th.lastActivity')}>
                          {date(s.lastAt, locale)}
                        </td>
                        <td data-label={ta('courses.th.state')}>
                          <span className={STATE[s.state].cls}>
                            {STATE[s.state].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='note'>{ta('courses.noStudents')}</p>
            )}

            {cl.length > 0 && (
              <div className='inline_row'>
                <Link
                  className='btn btn_sm hv-btn-glow'
                  href={`/cabinet/${c.slug}`}
                >
                  {ta('courses.viewLessons')}
                </Link>
              </div>
            )}

            {cl.length > 0 && (
              <details className='disclosure'>
                <summary className='btn btn_sm btn_outline'>
                  {ta('courses.lessons.summary', { n: cl.length })}
                </summary>
                <div
                  className='table_wrap'
                  role='region'
                  aria-label={ta('courses.lessons.region')}
                  tabIndex={0}
                >
                  <table className='data_table data_stack'>
                    <thead>
                      <tr>
                        <th>{ta('courses.lessons.thNum')}</th>
                        <th>{ta('courses.lessons.thFields')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cl.map((l) => (
                        <tr key={l.id}>
                          <td className='cell_num cell_title'>{l.position}</td>
                          <td className='cell_block'>
                            <form
                              action={updateLesson}
                              className='inline_form edit_form edit_form_lesson'
                            >
                              {hidden}
                              <input type='hidden' name='lesson' value={l.id} />
                              <label className='mini_field'>
                                <span className='mini_label'>
                                  {ta('courses.lessons.titleAria', {
                                    n: l.position,
                                  })}
                                </span>
                                <input
                                  name='title'
                                  defaultValue={l.title.uk}
                                  aria-label={ta('courses.lessons.titleAria', {
                                    n: l.position,
                                  })}
                                  required
                                />
                              </label>
                              <label className='mini_field'>
                                <span className='mini_label'>
                                  {ta('courses.lessons.videoPlaceholder')}
                                </span>
                                <input
                                  name='video'
                                  defaultValue={l.bunnyVideoId ?? ''}
                                  placeholder={ta(
                                    'courses.lessons.videoPlaceholder',
                                  )}
                                  aria-label={ta('courses.lessons.videoAria', {
                                    n: l.position,
                                  })}
                                />
                              </label>
                              <label className='mini_field'>
                                <span className='mini_label'>
                                  {ta('courses.lessons.minutesPlaceholder')}
                                </span>
                                <input
                                  name='minutes'
                                  type='number'
                                  min={1}
                                  defaultValue={l.durationMin ?? ''}
                                  placeholder={ta(
                                    'courses.lessons.minutesPlaceholder',
                                  )}
                                  aria-label={ta(
                                    'courses.lessons.minutesAria',
                                    {
                                      n: l.position,
                                    },
                                  )}
                                />
                              </label>
                              <button type='submit' className='btn btn_sm'>
                                {ta('common.save')}
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </section>
        ),
      )}
    </AdminShell>
  );
}
