import type { Locale } from '@/i18n/routing';
import { courseCopy as cc, type CourseDetail } from '@/lib/content/courses';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * Author → About31 (both course pages, FR-03): two photos, heading, sub-line, three facts (20+ years
 * — E-08; booked a year ahead in Ukraine; every stylist trained by her — E-09), «Стати майстром» →
 * the page's main action (online → Direct, B-89; intensive → `#price`). Behind it the page's one
 * big typographic gesture — the ghost «20+» (`.dec_ghost_num` on a `.dec_host`, 8.0 §5).
 */
export function Author({
  locale,
  course,
}: {
  locale: Locale;
  course: CourseDetail;
}) {
  const a = course.author;
  return (
    <section className='sec sec_surface author_sec dec_host' id='author'>
      <span className='dec_ghost_num dec_ghost_num_left' aria-hidden='true'>
        {cc.ghost}
      </span>
      <div className='wrap author_grid'>
        <div className='author_media'>
          {a.images.map((p, i) => (
            <figure key={p.src} className={`author_img author_img_${i + 1}`}>
              <Pic
                src={p.src}
                alt={t(p.alt, locale)}
                sizes={
                  i === 0
                    ? '(min-width: 1200px) 380px, (min-width: 768px) 40vw, 80vw'
                    : '(min-width: 1200px) 200px, 35vw'
                }
              />
            </figure>
          ))}
        </div>
        <div className='author_text'>
          <h2 className='display display_lg'>{t(a.heading, locale)}</h2>
          <p className='lede'>{t(a.sub, locale)}</p>
          <ul className='facts_list'>
            {cc.authorFacts.map((f) => (
              <li key={t(f, 'uk')}>{t(f, locale)}</li>
            ))}
          </ul>
          <p>
            <SmartLink className='btn hv-btn-glow' href={course.cta.href}>
              {course.format === 'online'
                ? t(course.cta.label, locale)
                : t(cc.authorCtaLabel, locale)}
            </SmartLink>
          </p>
        </div>
      </div>
    </section>
  );
}
