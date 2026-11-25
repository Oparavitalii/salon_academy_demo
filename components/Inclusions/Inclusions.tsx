import type { Locale } from '@/i18n/routing';
import type { CourseDetail } from '@/lib/content/courses';
import { t } from '@/lib/i18n/t';

import { Icon } from '../Icons/Icons';
import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * Inclusions → Layout10 (both course pages): heading, sub-line, the list with check icons — online:
 * ten items, one «all included» price (Decisions 22.10); intensive: six items (FR-27), item 5 with its second
 * line «Контакти постачальників…» (E-27), the note «З собою — лише…» and the certificate photo
 * beside item 6. Button = the page's main action («Забронювати місце» → `#price` on the intensive).
 */
export function Inclusions({
  locale,
  course,
  ctaLabel,
}: {
  locale: Locale;
  course: CourseDetail;
  ctaLabel?: string;
}) {
  const inc = course.inclusions;
  return (
    <section className='sec sec_page inclusions_sec' id='inclusions'>
      <div className={`wrap inclusions_grid${inc.image ? ' has_image' : ''}`}>
        <div>
          <div className='sec_head'>
            <h2 className='display display_lg'>{t(inc.heading, locale)}</h2>
            <p className='lede'>{t(inc.sub, locale)}</p>
          </div>
          <ul className='inclusions_list'>
            {inc.items.map((it) => (
              <li
                key={t(it.text, 'uk')}
                className='inclusion ui-card ui-card--outlined'
              >
                <span className='inclusion_icon'>
                  <Icon name='check' />
                </span>
                <span>
                  {t(it.text, locale)}
                  {it.sub && (
                    <span className='inclusion_sub'>{t(it.sub, locale)}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {inc.note && (
            <p className='callout inclusions_note'>{t(inc.note, locale)}</p>
          )}
          <p className='sec_foot'>
            <SmartLink className='btn hv-btn-glow' href={course.cta.href}>
              {ctaLabel ?? t(course.cta.label, locale)}
            </SmartLink>
          </p>
        </div>
        {inc.image && (
          <figure className='inclusions_figure'>
            <Pic
              src={inc.image.src}
              alt={t(inc.image.alt, locale)}
              sizes='(min-width: 1200px) 400px, (min-width: 768px) 40vw, 90vw'
            />
          </figure>
        )}
      </div>
    </section>
  );
}
