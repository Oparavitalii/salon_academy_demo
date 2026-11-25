import { asc, desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  AdminShell,
  adminMetadata,
  fmtDate,
} from '@/components/AdminShell/AdminShell';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import {
  CERT_COURSES,
  certNumber,
  finishedWithoutCertificate,
  fmtIssued,
  nextSeq,
  todayWarsaw,
} from '@/lib/certificate/issue';
import { db } from '@/lib/db/client';
import { certificates, courses, users } from '@/lib/db/schema';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ msg?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return adminMetadata(params, 'certificates.title');
}

/**
 * `/admin/certificates` «Сертифікати» (owner 30.10.2026): the studio's IPHM certificate with the
 * name, course, date and number filled in → «Переглянути PDF» (new tab, nothing saved) or
 * «Надіслати на e-mail» (saved + sent). Below: every issued certificate — open the PDF or send
 * it again. The student is picked from the list (her e-mail is the account's); a student who watched
 * every lesson gets hers automatically — «Пройшли курс» lists those still without one (finished
 * before 30.10.2026, or no name in the profile). Posts to `/api/admin/certificates` (plain HTML).
 */
export default async function AdminCertificates({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { msg } = await searchParams;
  await requireUser(locale, 'admin');
  const ta = await getTranslations({ locale, namespace: 'admin' });

  const today = todayWarsaw();
  const year = Number(today.slice(0, 4));
  const seq = await nextSeq(year);
  const list = await db
    .select()
    .from(certificates)
    .orderBy(desc(certificates.createdAt))
    .limit(300);
  const students = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.role, 'student'))
    .orderBy(asc(users.email));
  const titles = await db
    .select({ slug: courses.slug, title: courses.title })
    .from(courses);
  const courseName = (slug: string) => {
    const t = titles.find((c) => c.slug === slug)?.title;
    return t ? (t[locale] ?? t.uk) : slug;
  };
  const pending = await finishedWithoutCertificate();

  return (
    <AdminShell
      locale={locale}
      active='/admin/certificates'
      tabs='payments'
      title={ta('certificates.title')}
      msg={msg}
    >
      <section className='card app_section'>
        <h2>{ta('certificates.form.heading')}</h2>
        <form
          method='post'
          action='/api/admin/certificates'
          className='app_form cert_form'
          // no browser form restore after the redirect back (it ran before hydration → mismatch)
          autoComplete='off'
        >
          <input type='hidden' name='locale' value={locale} />
          <div className='cert_grid'>
            <div className='field'>
              <label htmlFor='cert-user'>{ta('common.student')}</label>
              <select id='cert-user' name='user' required defaultValue=''>
                <option value='' disabled>
                  {ta('certificates.form.studentPick')}
                </option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ? `${s.name} · ${s.email}` : s.email}
                  </option>
                ))}
              </select>
            </div>
            <div className='field'>
              <label htmlFor='cert-name'>{ta('certificates.form.name')}</label>
              <input
                id='cert-name'
                name='name'
                maxLength={80}
                autoComplete='off'
                placeholder='Olena Kosheleva'
              />
              <p className='field_hint'>{ta('certificates.form.nameHint')}</p>
            </div>
            <div className='field'>
              <label htmlFor='cert-date'>{ta('certificates.form.date')}</label>
              <input
                id='cert-date'
                name='date'
                type='date'
                required
                defaultValue={today}
              />
            </div>
            <div className='field cert_wide'>
              <label htmlFor='cert-course'>{ta('common.course')}</label>
              <select
                id='cert-course'
                name='course'
                defaultValue={CERT_COURSES[0].slug}
              >
                {CERT_COURSES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {courseName(c.slug)} — {c.line1} {c.line2}
                  </option>
                ))}
                <option value=''>{ta('certificates.form.otherCourse')}</option>
              </select>
            </div>
            <div className='field'>
              <label htmlFor='cert-line1'>
                {ta('certificates.form.line1')}
              </label>
              <input
                id='cert-line1'
                name='line1'
                maxLength={80}
                placeholder='Hair Reconstruction'
              />
            </div>
            <div className='field'>
              <label htmlFor='cert-line2'>
                {ta('certificates.form.line2')}
              </label>
              <input
                id='cert-line2'
                name='line2'
                maxLength={80}
                placeholder='and Restoration'
              />
            </div>
            <p className='field_hint cert_wide'>
              {ta('certificates.form.linesHint')}
            </p>
            <div className='field'>
              <label htmlFor='cert-seq'>{ta('certificates.form.number')}</label>
              <input
                id='cert-seq'
                name='seq'
                inputMode='numeric'
                pattern='\d{1,5}'
                placeholder={String(seq)}
              />
              <p className='field_hint'>
                {ta('certificates.form.numberHint', {
                  number: certNumber(year, seq),
                })}
              </p>
            </div>
          </div>
          <div className='cert_actions'>
            <button
              type='submit'
              name='intent'
              value='preview'
              formTarget='_blank'
              className='btn btn_outline'
            >
              {ta('certificates.form.preview')}
            </button>
            <button
              type='submit'
              name='intent'
              value='send'
              className='btn hv-btn-glow'
            >
              {ta('certificates.form.send')}
            </button>
          </div>
        </form>
      </section>

      {pending.length > 0 && (
        <section className='card app_section'>
          <h2>{ta('certificates.pending.heading')}</h2>
          <p className='note'>{ta('certificates.pending.note')}</p>
          <ul className='cert_pending'>
            {pending.map((p) => (
              <li key={`${p.userId}_${p.courseId}`}>
                <span>
                  <strong>{p.name ?? ta('certificates.pending.noName')}</strong>
                  <br />
                  <span className='note'>
                    {p.email} · {courseName(p.courseSlug)}
                  </span>
                </span>
                {p.name ? (
                  <form method='post' action='/api/admin/certificates'>
                    <input type='hidden' name='locale' value={locale} />
                    <input type='hidden' name='intent' value='issue' />
                    <input type='hidden' name='user' value={p.userId} />
                    <input type='hidden' name='course' value={p.courseId} />
                    <button type='submit' className='btn btn_sm'>
                      {ta('certificates.pending.issue')}
                    </button>
                  </form>
                ) : (
                  <span className='tag'>
                    {ta('certificates.pending.useForm')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className='card app_section'>
        <h2>{ta('certificates.list.heading')}</h2>
        {list.length === 0 ? (
          <p className='note'>{ta('certificates.list.empty')}</p>
        ) : (
          <div
            className='table_wrap'
            role='region'
            aria-label={ta('certificates.list.heading')}
            tabIndex={0}
          >
            <table className='data_table data_stack'>
              <thead>
                <tr>
                  <th>{ta('certificates.list.number')}</th>
                  <th>{ta('common.student')}</th>
                  <th>{ta('common.course')}</th>
                  <th>{ta('certificates.form.date')}</th>
                  <th>{ta('certificates.list.sent')}</th>
                  <th>{ta('certificates.list.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td className='cell_title'>{c.number}</td>
                    <td data-label={ta('common.student')}>
                      {c.name}
                      <br />
                      <span className='note'>{c.email}</span>
                    </td>
                    <td data-label={ta('common.course')}>
                      {[c.courseLine1, c.courseLine2].filter(Boolean).join(' ')}
                    </td>
                    <td data-label={ta('certificates.form.date')}>
                      {fmtIssued(c.issuedOn)}
                    </td>
                    <td data-label={ta('certificates.list.sent')}>
                      {c.sentAt ? (
                        fmtDate(c.sentAt, locale)
                      ) : (
                        <span className='tag'>
                          {ta('certificates.list.notSent')}
                        </span>
                      )}
                    </td>
                    <td
                      data-label={ta('certificates.list.actions')}
                      className='cell_block'
                    >
                      <div className='cert_row_actions'>
                        <a
                          className='btn btn_sm btn_outline'
                          href={`/api/admin/certificates/${c.id}`}
                          target='_blank'
                          rel='noopener'
                        >
                          {ta('certificates.list.open')}
                        </a>
                        <form method='post' action='/api/admin/certificates'>
                          <input type='hidden' name='locale' value={locale} />
                          <input type='hidden' name='intent' value='resend' />
                          <input type='hidden' name='id' value={c.id} />
                          <button type='submit' className='btn btn_sm'>
                            {ta('certificates.list.resend')}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
