import type { Locale } from '@/i18n/routing';
import type { CourseDetail } from '@/lib/content/courses';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * Program `#program` → Process28 (signature, ref PersonalCoach). Online: 16 lesson rows — big
 * «01» (`.dec_rows_num`), title, description, mono-indexed sub-points (`.dec_rows_sub`), hairlines
 * (`.dec_rows`, 8.0 §5); `.ix-dim` (7.0 §5b) steps the other rows back on hover / keyboard focus
 * (rows are focusable); every row stays open, so nothing hides without JS. Intensive: Day 1 / Day 2
 * (FR-27, E-27) — the same rows with the day's points and a photo each. Minutes per lesson hidden
 * (Q-10). Button = the page's main action (B-89). Light.
 */
export function Program({
  locale,
  course,
}: {
  locale: Locale;
  course: CourseDetail;
}) {
  const days = course.days;
  return (
    <section className='sec sec_surface program_sec' id='program' data-gallery>
      <div className='wrap'>
        <div className='sec_head'>
          <h2 className='display display_lg'>
            {t(course.programHeading, locale)}
          </h2>
          <p className='lede'>{t(course.programSub, locale)}</p>
        </div>
        {days ? (
          /* sx-pin (Web_Site_Effects, owner's pick 31.10): the day's photo stays on screen while the
             days scroll past and switch it (phone: the photo docks at the bottom). */
          <div className='sx-pin program_pin'>
            <ol className='sx-pin__steps program_days'>
              {days.map((d, i) => (
                <li
                  key={t(d.title, 'uk')}
                  className={`sx-pin__step program_day${i === 0 ? ' is-active' : ''}`}
                >
                  <span className='sx-pin__num' aria-hidden='true'>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className='program_text'>
                    <h3>{t(d.title, locale)}</h3>
                    <ol className='dec_rows_sub'>
                      {d.points.map((pt) => (
                        <li key={t(pt, 'uk')}>{t(pt, locale)}</li>
                      ))}
                    </ol>
                  </div>
                </li>
              ))}
            </ol>
            <div className='sx-pin__stage'>
              {days.map((d, i) => (
                <figure
                  key={d.image.src}
                  className={`sx-pin__panel${i === 0 ? ' is-active' : ''}`}
                >
                  <Pic
                    src={d.image.src}
                    alt={t(d.image.alt, locale)}
                    sizes='(min-width: 1024px) 50vw, 90vw'
                  />
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <ol className='dec_rows ix-dim program_rows'>
            {course.program.map((row, i) => (
              <li
                key={t(row.title, 'uk')}
                className='ix-dim__item program_row'
                tabIndex={0}
              >
                <span className='dec_rows_num' aria-hidden='true'>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className='program_text'>
                  <h3>{t(row.title, locale)}</h3>
                  <p>{t(row.body, locale)}</p>
                </div>
                {row.subs.length > 0 && (
                  <ol className='dec_rows_sub program_subs'>
                    {row.subs.map((s) => (
                      <li key={t(s, 'uk')}>{t(s, locale)}</li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        )}
        <p className='sec_foot'>
          <SmartLink className='btn hv-btn-glow' href={course.cta.href}>
            {t(course.cta.label, locale)}
          </SmartLink>
        </p>
      </div>
    </section>
  );
}
