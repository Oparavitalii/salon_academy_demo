import type { Locale } from '@/i18n/routing';
import { type Pic as PicData, statsCopy as c } from '@/lib/content/home';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';

type Props = {
  locale: Locale;
  /** `/about` carries a heading over the tiles (9_Text.md → /about → Stats); `/` does not. */
  withHeading?: boolean;
  image?: PicData;
  id?: string;
};

/**
 * Stats → Stats27 (signature, wireframe §4, ref CreativeAgency): four tiles in a row (2 × 2 on a
 * phone), thin left + top lines, the numeral in Unbounded 700 pink, the caption muted (7.0 §3
 * `.stats`). Behind the tiles the page's one big typographic gesture — the ghost «20+»
 * (`.dec_ghost_num` on a `.dec_host`, 8.0 §5). Photo beside the tiles (Release floor F5).
 * Tiles: 20+ · 5 ★ · 180+ · 100000+ (Dana 16.11.2026) — 2 × 2, four across where the row is wide
 * enough (`/` on desktop); the numerals shrink with their card so «100000+» stays on one line.
 */
export function Stats({
  locale,
  withHeading,
  image = c.image,
  id = 'stats',
}: Props) {
  return (
    <section className='sec sec_page stats_sec dec_host' id={id}>
      <span className='dec_ghost_num' aria-hidden='true'>
        {c.ghost}
      </span>
      <div
        className={`wrap stats_grid${withHeading ? '' : ' stats_grid_solo'}`}
      >
        <div className='stats_body'>
          {withHeading && (
            <div className='sec_head'>
              <h2 className='display display_lg'>
                {t(c.aboutHeading, locale)}
              </h2>
              <p className='lede'>{t(c.aboutSub, locale)}</p>
            </div>
          )}
          <div className='stats_wrap'>
            <ul className='stats'>
              {c.items.map((s) => (
                <li className='stat ui-card ui-card--stat' key={s.value}>
                  <div className='ui-card__body'>
                    <p className='stat_num ui-card__value'>{s.value}</p>
                    <p className='stat_label label ui-card__meta'>
                      {t(s.label, locale)}
                    </p>
                    <span className='ui-card__spark' aria-hidden='true' />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {withHeading && (
          <figure className='stats_figure'>
            <Pic
              src={image.src}
              alt={t(image.alt, locale)}
              sizes='(min-width: 1200px) 360px, (min-width: 768px) 40vw, 90vw'
            />
          </figure>
        )}
      </div>
    </section>
  );
}
