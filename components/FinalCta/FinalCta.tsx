import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { CourseDetail } from '@/lib/content/courses';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * FinalCta → Cta20 (both course pages): the deep magenta band (7.0 `.band_deep`), heading, sub-line,
 * the guarantee line (online: «Про старт і доступ — пишіть у Direct» while online payment is off —
 * Q-02; intensive: «3 учениці · 2 майстри · своя модель»), the page's main button, a photo, and the
 * privacy link (10.0 → links next to the purchase). The one price of the course (E-31).
 */
export function FinalCta({
  locale,
  course,
  privacyLabel,
}: {
  locale: Locale;
  course: CourseDetail;
  privacyLabel: string;
}) {
  const f = course.final;
  return (
    <section className='sec sec_page final_sec' id='final'>
      <div className='wrap'>
        <div className='band_deep final_band' data-theme='dark'>
          <div className='final_text'>
            <h2 className='display display_lg'>{t(f.heading, locale)}</h2>
            <p>{t(f.sub, locale)}</p>
            <p className='price final_price'>{t(course.price, locale)}</p>
            <p className='final_guarantee'>{t(f.guarantee, locale)}</p>
            <div className='hero_actions'>
              <SmartLink
                className='btn btn_ondark hv-btn-invert'
                href={course.cta.href}
              >
                {t(course.cta.label, locale)}
              </SmartLink>
            </div>
            <p className='final_legal note'>
              <Link className='hv-link' href='/privacy'>
                {privacyLabel}
              </Link>
            </p>
          </div>
          <figure className='final_figure'>
            <Pic
              src={f.image.src}
              alt={t(f.image.alt, locale)}
              sizes='(min-width: 1200px) 380px, (min-width: 768px) 35vw, 80vw'
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
