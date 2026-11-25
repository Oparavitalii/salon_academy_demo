import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { utilityMeta } from '@/components/AuthShell/AuthShell';
import { CabinetHeader } from '@/components/CabinetHeader/CabinetHeader';
import { Footer } from '@/components/Footer/Footer';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { getCourseFor } from '@/lib/courses/cabinet';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = { params: Promise<{ locale: Locale; course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return utilityMeta((await params).locale, 'cabinet');
}

/**
 * `/cabinet/[course]` — CourseHead (course, tier) · LessonList (number, title, minutes,
 * «Переглянуто» / «Не почато»). All lessons open at once (Q-04 → «доступ назавжди»).
 * Telegram support chat waits for Q-31. Not enrolled / revoked → 404. The admin sees every
 * course here (preview, no progress).
 */
export default async function CabinetCoursePage({ params }: Props) {
  const { locale, course: slug } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, ['student', 'admin']);
  const data = await getCourseFor(user, slug);
  if (!data) notFound();
  const tc = await getTranslations('cabinet');
  const first = user.name?.split(' ')[0] || user.email.split('@')[0];
  const admin = user.role === 'admin';

  return (
    <>
      <CabinetHeader locale={locale} name={first} admin={admin} />
      <main className='app_main' data-theme={theme}>
        <div className='wrap'>
          <section className='app_head'>
            <Link
              className='note hv-link'
              href={admin ? '/admin/courses' : '/cabinet'}
            >
              {admin ? 'Адмінка · Курси' : tc('myCourses')}
            </Link>
            {admin && <span className='tag tag_warn'>Перегляд адміна</span>}
            <h1 className='display display_lg'>
              {t(data.course.title, locale)}
            </h1>
            <p className='note'>
              {data.tierName && <>{tc('tier', { name: data.tierName })} · </>}
              {tc('lessons', { n: data.lessons.length })}
            </p>
          </section>
          <ol className='lesson_list'>
            {data.lessons.map((l) => (
              <li key={l.id}>
                <Link
                  className='lesson_row'
                  href={`/cabinet/${slug}/${l.position}`}
                >
                  <span className='eyebrow'>
                    {tc('lesson', { n: l.position })}
                  </span>
                  <b>{t(l.title, locale)}</b>
                  {l.durationMin && (
                    <span className='note'>
                      {tc('minutes', { min: l.durationMin })}
                    </span>
                  )}
                  {!admin && (
                    <span className={`tag${l.done ? ' tag_ok' : ''}`}>
                      {l.done ? tc('watched') : tc('notStarted')}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <Footer variant='minimal' locale={locale} theme={theme} />
    </>
  );
}
