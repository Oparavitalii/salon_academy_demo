import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { utilityMeta } from '@/components/AuthShell/AuthShell';
import { CabinetHeader } from '@/components/CabinetHeader/CabinetHeader';
import { Footer } from '@/components/Footer/Footer';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { fmtIssued } from '@/lib/certificate/issue';
import { getMyCourses } from '@/lib/courses/cabinet';
import { db } from '@/lib/db/client';
import { certificates } from '@/lib/db/schema';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return utilityMeta((await params).locale, 'cabinet');
}

/**
 * `/cabinet/certificates` (owner 02.11.2026): her issued certificates — number, date, «Відкрити
 * PDF» (`/api/cabinet/certificates/[id]`, own rows only) — and, for every online course without
 * one yet, how far she is from it. A finished course without a certificate points to the name in
 * Налаштування (no name → the automatic letter does not go; the studio issues it).
 */
export default async function CertificatesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, 'student');
  const tc = await getTranslations('cabinet');
  const first = user.name?.split(' ')[0] || user.email.split('@')[0];

  const mine = await db
    .select()
    .from(certificates)
    .where(eq(certificates.userId, user.id))
    .orderBy(desc(certificates.createdAt));
  const waiting = (await getMyCourses(user.id)).filter(
    (c) => c.course.kind === 'online' && c.total > 0 && !c.certified,
  );

  return (
    <>
      <CabinetHeader
        locale={locale}
        name={first}
        active='/cabinet/certificates'
      />
      <main className='app_main' data-theme={theme}>
        <div className='wrap'>
          <section className='app_head'>
            <h1 className='display display_lg'>{tc('certificates')}</h1>
            <p className='lede'>{tc('certIntro')}</p>
          </section>

          {mine.length === 0 && waiting.length === 0 ? (
            <section className='card app_section empty_state'>
              <h2>{tc('certNone')}</h2>
              <Link className='btn hv-btn-glow' href='/cabinet'>
                {tc('myCourses')}
              </Link>
            </section>
          ) : (
            <div className='app_grid'>
              {mine.map((c) => (
                <article key={c.id} className='card course_tile'>
                  <h2 className='course-card_title'>
                    {c.courseLine1}
                    {c.courseLine2 ? ` ${c.courseLine2}` : ''}
                  </h2>
                  <p className='note'>
                    {tc('certNumber', { number: c.number })}
                    <br />
                    {tc('certIssued', { date: fmtIssued(c.issuedOn) })}
                  </p>
                  <a
                    className='btn hv-btn-glow'
                    href={`/api/cabinet/certificates/${c.id}`}
                    target='_blank'
                    rel='noopener'
                  >
                    {tc('certOpen')}
                  </a>
                </article>
              ))}
              {waiting.map((c) => (
                <article key={c.course.id} className='card course_tile'>
                  <h2 className='course-card_title'>
                    {t(c.course.title, locale)}
                  </h2>
                  {c.done >= c.total ? (
                    <>
                      <p className='course_tile_cert'>{tc('certDone')}</p>
                      <p className='note'>{tc('certWaitName')}</p>
                      <Link
                        className='btn btn_outline hv-btn-invert'
                        href='/cabinet/settings'
                      >
                        {tc('settings')}
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className='course_tile_cert'>
                        {tc('certLeft', { left: c.total - c.done })}
                      </p>
                      <div className='progress' aria-hidden='true'>
                        <span
                          style={{
                            width: `${Math.round((c.done / c.total) * 100)}%`,
                          }}
                        />
                      </div>
                      <Link
                        className='btn hv-btn-glow'
                        href={`/cabinet/${c.course.slug}${c.done > 0 && c.nextPosition ? `/${c.nextPosition}` : ''}`}
                      >
                        {c.done > 0 ? tc('continue') : tc('start')}
                      </Link>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer variant='minimal' locale={locale} theme={theme} />
    </>
  );
}
