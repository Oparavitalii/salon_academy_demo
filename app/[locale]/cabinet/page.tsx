import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { utilityMeta } from '@/components/AuthShell/AuthShell';
import { CabinetHeader } from '@/components/CabinetHeader/CabinetHeader';
import { Footer } from '@/components/Footer/Footer';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { address } from '@/lib/content/site';
import { getMyCourses } from '@/lib/courses/cabinet';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return utilityMeta((await params).locale, 'cabinet');
}

/**
 * `/cabinet` — Welcome (greeting, overall progress) · PurchasedGrid (online card → its
 * lessons; intensive card → details disclosure) · EmptyState → /courses (07_Cab_My).
 */
export default async function CabinetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, 'student');
  const tc = await getTranslations('cabinet');
  const mine = await getMyCourses(user.id);

  const total = mine.reduce((n, c) => n + c.total, 0);
  const done = mine.reduce((n, c) => n + c.done, 0);
  const first = user.name?.split(' ')[0] || user.email.split('@')[0];
  const resume = mine.find((c) => c.course.kind === 'online' && c.nextPosition);

  return (
    <>
      <CabinetHeader locale={locale} name={first} />
      <main className='app_main' data-theme={theme}>
        <div className='wrap'>
          <section className='app_head'>
            <h1 className='display display_lg'>
              {tc('welcome', { name: first })}
            </h1>
            {total > 0 && (
              <>
                <p className='lede'>{tc('progress', { done, total })}</p>
                <div
                  className='progress'
                  role='progressbar'
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={done}
                >
                  <span
                    style={{ width: `${Math.round((done / total) * 100)}%` }}
                  />
                </div>
              </>
            )}
            {resume && done > 0 && done < total && (
              <p>
                <Link
                  className='hv-link link_accent'
                  href={`/cabinet/${resume.course.slug}/${resume.nextPosition}`}
                >
                  {tc('continueLesson', { n: resume.nextPosition ?? 1 })}
                </Link>
              </p>
            )}
          </section>

          {mine.length === 0 ? (
            <section className='card app_section empty_state'>
              <h2>{tc('emptyHeading')}</h2>
              <Link className='btn hv-btn-glow' href='/courses'>
                {tc('emptyCta')}
              </Link>
            </section>
          ) : (
            <section className='app_grid' aria-label={tc('myCourses')}>
              {mine.map((c) =>
                c.course.kind === 'online' ? (
                  <article key={c.course.id} className='card course_tile'>
                    <h2 className='course-card_title'>
                      {t(c.course.title, locale)}
                    </h2>
                    {c.tierName && (
                      <p className='note'>{tc('tier', { name: c.tierName })}</p>
                    )}
                    <p className='course_tile_pct'>
                      <strong>
                        {tc('watchedPct', {
                          pct: c.total
                            ? Math.round((c.done / c.total) * 100)
                            : 0,
                        })}
                      </strong>
                      <span className='note'>
                        {tc('progress', { done: c.done, total: c.total })}
                      </span>
                    </p>
                    <div className='progress' aria-hidden='true'>
                      <span
                        style={{
                          width: `${c.total ? Math.round((c.done / c.total) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    {c.total > 0 && (
                      <p className='course_tile_cert'>
                        {c.certified
                          ? tc('certSent')
                          : c.done >= c.total
                            ? tc('certDone')
                            : tc('certLeft', { left: c.total - c.done })}
                      </p>
                    )}
                    <Link
                      className='btn hv-btn-glow'
                      href={`/cabinet/${c.course.slug}${c.done > 0 && c.nextPosition ? `/${c.nextPosition}` : ''}`}
                    >
                      {c.done > 0 ? tc('continue') : tc('start')}
                    </Link>
                  </article>
                ) : (
                  <article key={c.course.id} className='card course_tile'>
                    <h2 className='course-card_title'>
                      {t(c.course.title, locale)}
                    </h2>
                    <details className='disclosure'>
                      <summary className='btn btn_outline hv-btn-invert'>
                        {tc('intensiveDetails')}
                      </summary>
                      <p>{t(c.course.title, locale)}</p>
                      <p className='note'>{address.full}</p>
                      <p className='note'>{tc('intensiveDateNote')}</p>
                    </details>
                  </article>
                ),
              )}
            </section>
          )}
        </div>
      </main>
      <Footer variant='minimal' locale={locale} theme={theme} />
    </>
  );
}
