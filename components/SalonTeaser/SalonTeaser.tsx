import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { salonTeaserCopy as c } from '@/lib/content/home';
import { t } from '@/lib/i18n/t';
import { localizeUnits } from '@/lib/i18n/units';

import { Words } from '../Fx/Words';
import { Pic } from '../Pic/Pic';

/**
 * SalonTeaser `#salon` → Layout13 (`/`, wireframe §5): heading, sub-line and «Переглянути всі
 * послуги» → `/salon` on the left; three numbered cards with a photo (E-28), name, text and the
 * italic «від … zł» (Booksy 20.10); under them the one before / after pair (CHo §4). Every card is
 * a link to `/salon#services` (hover: frame + zoom + lift). Dark.
 * 23.11.2026 (owner): the services switch on scroll (sx-pin) instead of a 5.5 s timer (sx-autotabs).
 * Oksana 16.11.2026 (M-05 «фото обрізаються неправильно»): the photos are 4:5 portraits, so the tab
 * frame is a portrait too (6:7, held at the top — heads and lengths stay in) and the before / after
 * pair is 4:5 on every width instead of 4:3 on desktop — Studio_Home.css.
 */
export function SalonTeaser({ locale }: { locale: Locale }) {
  return (
    <section className='sec sec_page salon_teaser' id='salon'>
      <div className='wrap'>
        <div className='salon_teaser_grid'>
          <div className='sec_head sec_head_wide salon_teaser_head'>
            <h2 className='display display_lg' data-fx='words'>
              <Words text={t(c.heading, locale)} />
            </h2>
            <div className='sec_head_split'>
              <p className='lede'>{t(c.sub, locale)}</p>
              <Link className='btn hv-btn-glow' href='/salon'>
                {t(c.cta, locale)}
              </Link>
            </div>
          </div>
          {/* sx-pin (Web_Site_Effects; owner 23.11 «на скрол повинні змінюватись блоки», was sx-autotabs on a
              timer): the photo stays while the three services scroll past and switch it; on a phone the
              photo docks above the bottom bar. Every service is a link to /salon#services. */}
          <div className='sx-pin salon_pin'>
            <ol className='sx-pin__steps salon_steps'>
              {c.cards.map((card, i) => (
                <li
                  key={card.image.src}
                  className={`sx-pin__step salon_step${i === 0 ? ' is-active' : ''}`}
                >
                  <span className='sx-pin__num' aria-hidden='true'>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Link className='salon_step_link' href='/salon#services'>
                    <h3 className='salon_card_title'>
                      {t(card.title, locale)}
                    </h3>
                  </Link>
                  <p className='salon_card_text'>{t(card.body, locale)}</p>
                  <span className='price'>
                    {localizeUnits(t(card.price, locale), locale)}
                  </span>
                </li>
              ))}
            </ol>
            <div className='sx-pin__stage'>
              {c.cards.map((card, i) => (
                <figure
                  key={card.image.src}
                  className={`sx-pin__panel salon_pin_panel${i === 0 ? ' is-active' : ''}`}
                >
                  <Pic
                    src={card.image.src}
                    alt={t(card.image.alt, locale)}
                    sizes='(min-width: 821px) 50vw, 92vw'
                  />
                </figure>
              ))}
            </div>
          </div>
        </div>
        <div className='ba_pair' data-gallery>
          {[c.pair.before, c.pair.after].map((p) => (
            <figure key={p.src} className='ba_figure'>
              <Pic
                src={p.src}
                alt={t(p.alt, locale)}
                sizes='(min-width: 1200px) 560px, 50vw'
              />
              <figcaption className='caption'>{t(p.alt, locale)}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
