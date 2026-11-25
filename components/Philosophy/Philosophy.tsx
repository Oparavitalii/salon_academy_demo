import type { Locale } from '@/i18n/routing';
import { philosophyCopy as c } from '@/lib/content/about';
import { t } from '@/lib/i18n/t';

import { BookingChannels } from '../BookingChannels/BookingChannels';
import { Pic } from '../Pic/Pic';

/**
 * Philosophy → Features12 (`/about`): «Чому нам довіряють: наші стандарти», four numbered standards
 * «01/ … 04/» (Features12 has no title slot — standards 3 and 4 open with their own words, 9_Text.md),
 * two photos and «Записатися в салон» → BookingChannels: the six channels sit right in this block
 * (`#booking`, FR-23 — 5.0 Navigation «BookingChannels repeats on /about»). Dark.
 */
export function Philosophy({ locale }: { locale: Locale }) {
  return (
    <section className='sec sec_surface philosophy_sec' id='standards'>
      <div className='wrap'>
        <div className='philosophy_grid'>
          <div className='sec_head sec_head_wide sec_head_span'>
            <h2 className='display display_lg'>{t(c.heading, locale)}</h2>
            <p className='lede'>{t(c.sub, locale)}</p>
          </div>
          <div>
            <ol className='standards'>
              {c.items.map((s, i) => (
                <li key={t(s.body, 'uk')} className='standard'>
                  <span className='standard_num' aria-hidden='true'>
                    {String(i + 1).padStart(2, '0')}/
                  </span>
                  <div>
                    {s.title && (
                      <h3 className='standard_title'>{t(s.title, locale)}</h3>
                    )}
                    <p>{t(s.body, locale)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className='sec_foot'>
              <a className='btn hv-btn-glow' href='#booking'>
                {t(c.cta, locale)}
              </a>
            </p>
          </div>
          <div className='philosophy_media' data-gallery>
            {c.images.map((p, i) => (
              <figure
                key={p.src}
                className={`philosophy_img philosophy_img_${i + 1}`}
              >
                <Pic
                  src={p.src}
                  alt={t(p.alt, locale)}
                  sizes='(min-width: 1200px) 260px, 45vw'
                />
              </figure>
            ))}
          </div>
        </div>
        <BookingChannels locale={locale} as='panel' />
      </div>
    </section>
  );
}
