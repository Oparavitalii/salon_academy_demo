import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { aboutShortCopy as c } from '@/lib/content/home';
import { t } from '@/lib/i18n/t';

import { Words } from '../Fx/Words';
import { Pic } from '../Pic/Pic';

/**
 * AboutShort → Layout9 (`/`, wireframe §3, FR-28): a big photo with a small one over its corner,
 * the heading, the sub-line, ≤ 60 words of text (24) and «Детальніше про бренд» → `/about`.
 * Copy: 9_Text.md → AboutShort (E-24 short, E-22 no makeup, B-90 «майстерність»). Dark.
 */
export function AboutShort({ locale }: { locale: Locale }) {
  return (
    <section className='sec sec_page about_short' id='about-short'>
      <div className='wrap'>
        <div className='sec_head sec_head_wide'>
          <h2 className='display display_xl' data-fx='words'>
            <Words text={t(c.heading, locale)} />
          </h2>
          <p className='lede'>{t(c.sub, locale)}</p>
        </div>
        <div className='about_short_grid'>
          <div className='about_short_media'>
            {/* tx-mask (Web_Top_Effects): the photo opens out of its frame with the scroll */}
            <figure className='tx-mask about_short_big'>
              <Pic
                src={c.imageBig.src}
                alt={t(c.imageBig.alt, locale)}
                sizes='(min-width: 1200px) 520px, (min-width: 768px) 50vw, 90vw'
              />
            </figure>
            <Pic
              src={c.imageSmall.src}
              alt={t(c.imageSmall.alt, locale)}
              sizes='(min-width: 1200px) 220px, 40vw'
              className='about_short_small'
            />
          </div>
          <div className='about_short_text'>
            <p className='body'>{t(c.body, locale)}</p>
            <p>
              <Link className='btn btn_outline hv-btn-invert' href='/about'>
                {t(c.cta, locale)}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
