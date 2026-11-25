import type { Locale } from '@/i18n/routing';
import { courseCopy as cc, type CourseDetail } from '@/lib/content/courses';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * Audience → Services12 (both course pages): heading, sub-line, three segments as cards, the
 * «точка Б» skills list with a photo, and a button — Oksana's copy 26.10: «Програма курсу / інтенсиву»
 * → `#program` (`audience.cta`); without it, the page's main button (`course.cta`). Light.
 */
export function Audience({
  locale,
  course,
}: {
  locale: Locale;
  course: CourseDetail;
}) {
  const a = course.audience;
  const cta = a.cta ?? course.cta;
  return (
    <section className='sec sec_page audience_sec' id='audience'>
      <div className='wrap'>
        <div className='sec_head'>
          <h2 className='display display_lg'>{t(a.heading, locale)}</h2>
          <p className='lede'>{t(a.sub, locale)}</p>
        </div>
        <ol className='audience_cards'>
          {a.segments.map((s, i) => (
            <li key={t(s.title, 'uk')} className='card audience_card'>
              <p className='card_num' aria-hidden='true'>
                {i + 1}/
              </p>
              <h3>{t(s.title, locale)}</h3>
              <p>{t(s.body, locale)}</p>
            </li>
          ))}
        </ol>
        <div className='skills'>
          <figure className='skills_figure'>
            <Pic
              src={a.image.src}
              alt={t(a.image.alt, locale)}
              sizes='(min-width: 1200px) 360px, (min-width: 768px) 40vw, 90vw'
            />
          </figure>
          <div className='skills_text'>
            <h3 className='display display_md'>{t(cc.skillsLabel, locale)}</h3>
            <ul className='check_list'>
              {a.skills.map((s) => (
                <li key={t(s, 'uk')}>{t(s, locale)}</li>
              ))}
            </ul>
            <p>
              <SmartLink className='btn hv-btn-glow' href={cta.href}>
                {t(cta.label, locale)}
              </SmartLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
