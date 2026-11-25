import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { utilityMeta } from '@/components/AuthShell/AuthShell';
import { CabinetHeader } from '@/components/CabinetHeader/CabinetHeader';
import { Footer } from '@/components/Footer/Footer';
import { PlayerFrame } from '@/components/PlayerFrame/PlayerFrame';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { getCourseFor } from '@/lib/courses/cabinet';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';
import { signedEmbedUrl } from '@/lib/video/embed';

import { markLessonDone } from '../../_actions';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = {
  params: Promise<{ locale: Locale; course: string; lesson: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return utilityMeta((await params).locale, 'cabinet');
}

/**
 * `/cabinet/[course]/[lesson]` — VideoEmbed · LessonMaterials · LessonNav (Cabinet_Lesson).
 * Protected twice: active session (requireUser) + active enrollment. The Bunny URL is signed
 * on the server for 1 h (30.10.2026). The audio language is chosen in the Bunny player's own menu (one video,
 * four tracks, FR-20). Fix round 22.10 (Release floor F3, challenger of Phase 11): no disabled
 * voice buttons and no «video will appear here» stub — without Bunny keys or a video id the
 * player block is not rendered. D-25: the player shows a focus ring when Tab enters the iframe.
 * The admin opens every lesson (preview): same player and materials, no «переглянуто».
 */
export default async function LessonPage({ params }: Props) {
  const { locale, course: slug, lesson } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, ['student', 'admin']);
  const admin = user.role === 'admin';
  const data = await getCourseFor(user, slug);
  if (!data) notFound();
  const pos = Number(lesson);
  const idx = data.lessons.findIndex((l) => l.position === pos);
  if (idx < 0) notFound();
  const l = data.lessons[idx];
  const prev = data.lessons[idx - 1];
  const next = data.lessons[idx + 1];
  const tc = await getTranslations('cabinet');
  const src = signedEmbedUrl(l.bunnyVideoId);
  const first = user.name?.split(' ')[0] || user.email.split('@')[0];

  return (
    <>
      <CabinetHeader locale={locale} name={first} admin={admin} />
      <main className='app_main' data-theme={theme}>
        <div className='wrap'>
          <section className='app_head'>
            <Link className='note hv-link' href={`/cabinet/${slug}`}>
              {t(data.course.title, locale)}
            </Link>
            <p className='eyebrow'>{tc('lesson', { n: l.position })}</p>
            <h1 className='display display_md'>{t(l.title, locale)}</h1>
            {admin && <span className='tag tag_warn'>Перегляд адміна</span>}
          </section>

          <section className='app_section'>
            {src && (
              <PlayerFrame
                src={src}
                title={t(l.title, locale)}
                mark={user.email}
                labels={{
                  fullscreen: tc('fullscreen'),
                  exitFullscreen: tc('exitFullscreen'),
                }}
              />
            )}
            {admin ? null : l.done ? (
              <p>
                <span className='tag tag_ok'>{tc('watched')}</span>
              </p>
            ) : (
              <form action={markLessonDone}>
                <input type='hidden' name='lesson' value={l.id} />
                <button type='submit' className='btn btn_outline hv-btn-invert'>
                  {tc('markWatched')}
                </button>
              </form>
            )}
          </section>

          <section className='app_section'>
            <h2>{tc('materials')}</h2>
            {l.materials.length ? (
              <ul className='material_list'>
                {l.materials.map((m, i) => (
                  <li key={m.url}>
                    {/* gated download: session + enrollment checked per request */}
                    <a
                      className='hv-link'
                      href={`/api/materials/${l.id}/${i}`}
                      download
                    >
                      {m.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='note'>{tc('noMaterials')}</p>
            )}
          </section>

          <nav className='lesson_nav' aria-label={tc('toLessons')}>
            {prev ? (
              <Link
                className='btn btn_outline hv-btn-invert'
                href={`/cabinet/${slug}/${prev.position}`}
              >
                {tc('prevLesson')}
              </Link>
            ) : (
              <span />
            )}
            <Link className='app_link' href={`/cabinet/${slug}`}>
              {tc('toLessons')}
            </Link>
            {next ? (
              <Link
                className='btn hv-btn-glow'
                href={`/cabinet/${slug}/${next.position}`}
              >
                {tc('nextLesson')}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </main>
      <Footer variant='minimal' locale={locale} theme={theme} />
    </>
  );
}
