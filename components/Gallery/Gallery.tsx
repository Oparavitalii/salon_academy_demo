import type { Locale } from '@/i18n/routing';
import type { CourseDetail } from '@/lib/content/courses';
import { t } from '@/lib/i18n/t';

import { Polaroid } from '../Decorations/Polaroid';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * CourseGallery → Gallery5 (both course pages): nine photos from the studio's courses as polaroids
 * (8.0 §5 — the page's «поляроїди лягають»), tilt alternating, a caption line, and the page's
 * main button. Students' before / after works are not there yet (Q-35), so the heading names the
 * training itself (9_Text.md). Light.
 */
export function Gallery({
  locale,
  course,
}: {
  locale: Locale;
  course: CourseDetail;
}) {
  const g = course.gallery;
  return (
    <section className='sec sec_page course_gallery' id='gallery' data-gallery>
      <div className='wrap'>
        <div className='sec_head_row'>
          <div className='sec_head'>
            <p className='eyebrow'>{t(g.caption, locale)}</p>
            <h2 className='display display_lg'>{t(g.heading, locale)}</h2>
          </div>
          <SmartLink className='btn hv-btn-glow' href={course.cta.href}>
            {t(course.cta.label, locale)}
          </SmartLink>
        </div>
        <div className='polaroid_grid polaroid_grid_9'>
          {g.images.map((p, i) => (
            <Polaroid
              key={p.src}
              src={p.src}
              alt={t(p.alt, locale)}
              sizes='(min-width: 1200px) 340px, (min-width: 768px) 30vw, 45vw'
              tilt={i % 2 ? 'r' : 'l'}
              tape={i === 0 || i === 5}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
