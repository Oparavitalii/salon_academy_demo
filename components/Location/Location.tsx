import type { Locale } from '@/i18n/routing';
import {
  contactLabels as l,
  mapSectionCopy,
  storefrontPhoto as door,
} from '@/lib/content/contacts';
import { mapCopy } from '@/lib/content/map';
import { salonCopy } from '@/lib/content/salon';
import { address, contacts, hoursLong } from '@/lib/content/site';
import { t } from '@/lib/i18n/t';

import { BookingChannels } from '../BookingChannels/BookingChannels';
import { MapEmbed } from '../MapEmbed/MapEmbed';
import { Pic } from '../Pic/Pic';

/**
 * `/salon` Location `#location` → Contact7 + BookingChannels (FR-23): heading, sub-line, address,
 * phone, hours (E-25), the click-to-load map with «Показати мапу» / «Маршрут» (Release floor F4,
 * MapEmbed) and the six booking channels `#booking` — the target of every «Записатися» on the page.
 * `/contacts` Map `#map` → Contact7: the same map with «Як нас знайти у Варшаві» and the parking line.
 * On `/salon` the storefront photo (shoot 03.11) closes the info column — the door a client looks for;
 * `/contacts` shows it first in the photo strip, its map keeps the full width (owner 28.10).
 */
export function Location({
  locale,
  variant = 'salon',
  booking = true,
}: {
  locale: Locale;
  variant?: 'salon' | 'contacts';
  /** The salon's booking channels under the map; `/salon` renders them under the masters instead (08.11). */
  booking?: boolean;
}) {
  const salon = variant === 'salon';
  const heading = salon ? salonCopy.location.heading : mapSectionCopy.heading;
  const sub = salon ? salonCopy.location.sub : mapSectionCopy.sub;
  return (
    <section
      className={`sec ${salon ? 'sec_surface' : 'sec_page'} location_sec`}
      id={salon ? 'location' : 'map'}
    >
      <div
        className={`wrap location_grid${salon ? '' : ' location_grid_solo'}`}
      >
        <div className='sec_head sec_head_wide sec_head_span'>
          <h2 className='display display_lg'>{t(heading, locale)}</h2>
          <p className='lede'>{t(sub, locale)}</p>
        </div>
        {salon && (
          <div className='location_info'>
            <dl className='location_list'>
              <div>
                <dt className='label'>{t(l.address, locale)}</dt>
                <dd>
                  <address>{address.full}</address>
                </dd>
              </div>
              <div>
                <dt className='label'>{t(l.phone, locale)}</dt>
                <dd>
                  <a className='hv-link' href={contacts.phone.href}>
                    {contacts.phone.label}
                  </a>
                </dd>
              </div>
              <div>
                <dt className='label'>{t(l.hours, locale)}</dt>
                <dd>{t(hoursLong, locale)}</dd>
              </div>
            </dl>
            <figure className='location_door' data-gallery>
              <Pic
                src={door.src}
                alt={t(door.alt, locale)}
                sizes='(min-width: 1200px) 480px, 100vw'
              />
              <figcaption className='note'>
                {t(door.caption, locale)}
              </figcaption>
            </figure>
          </div>
        )}
        <MapEmbed locale={locale} fallbackLabel={t(mapCopy.route, locale)} />
      </div>
      {salon && booking && (
        <div className='wrap'>
          <BookingChannels locale={locale} as='panel' />
        </div>
      )}
    </section>
  );
}
