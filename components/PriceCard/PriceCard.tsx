import type { Locale } from '@/i18n/routing';
import type { PriceCardCopy } from '@/lib/content/courses';
import { t } from '@/lib/i18n/t';

import { BookingChannels } from '../BookingChannels/BookingChannels';
import { Icon } from '../Icons/Icons';
import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * PriceCard `#price` → Pricing4 (intensive, FR-22): heading, sub-line, the card — name, format
 * (3 students · 2 instructors, E-19), place, the price 990 € (E-31) — and «Забронювати місце». No
 * Stripe while Q-03 / B-93 are open: the button opens the six booking channels right in the card (a
 * native `<details>`, works without JS). Online courses (Oksana's copy 26.10 §6) pass `href`: the
 * button is then a plain link (Direct @studio.demo.academy). The photo beside the card (F5).
 */
export function PriceCard({
  locale,
  copy: c,
}: {
  locale: Locale;
  copy: PriceCardCopy;
}) {
  return (
    <section className='sec sec_surface price_sec' id='price'>
      <div className='wrap price_grid'>
        <figure className='price_figure'>
          <Pic
            src={c.image.src}
            alt={t(c.image.alt, locale)}
            sizes='(min-width: 1200px) 420px, (min-width: 768px) 40vw, 90vw'
          />
        </figure>
        <div>
          <div className='sec_head'>
            <h2 className='display display_lg'>{t(c.heading, locale)}</h2>
            <p className='lede'>{t(c.sub, locale)}</p>
          </div>
          <div className='card price_card'>
            <h3>{t(c.name, locale)}</h3>
            <p className='price price_card_price'>{t(c.price, locale)}</p>
            <ul className='price_card_list'>
              <li>
                <Icon name='clock' />
                <span>{t(c.format, locale)}</span>
              </li>
              <li>
                <Icon name='pin' />
                <span>{t(c.place, locale)}</span>
              </li>
            </ul>
            {c.href ? (
              <SmartLink className='btn btn_block hv-btn-glow' href={c.href}>
                {t(c.cta, locale)}
              </SmartLink>
            ) : (
              <details className='price_book'>
                <summary className='btn btn_block hv-btn-glow'>
                  {t(c.cta, locale)}
                </summary>
                <BookingChannels
                  locale={locale}
                  as='panel'
                  id='price-booking'
                />
              </details>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
