import type { CSSProperties } from 'react';

import type { Locale } from '@/i18n/routing';
import { t } from '@/lib/i18n/t';
import { directions } from '@/lib/services/directions';

import { ServicesCarousel_Arrows } from './ServicesCarousel_Arrows';
import { Pic } from '../Pic/Pic';

const COPY = {
  heading: { uk: 'Послуги', pl: 'Usługi', en: 'Services' },
  sub: {
    uk: 'Гортайте й обирайте напрямок — ціни відкриються одразу',
    pl: 'Przewiń i wybierz kierunek — ceny otworzą się od razu',
    en: 'Scroll and pick a direction — the prices open right away',
  },
  prev: { uk: 'Назад', pl: 'Wstecz', en: 'Previous' },
  next: { uk: 'Далі', pl: 'Dalej', en: 'Next' },
};

/**
 * Framing of a card photo (Dana 16.11: «Фото пожалуйста поставьте на одной высоте, много обрезаных
 * волос и сверху пространство»). The frame is 4:5 like the files, so each photo showed whole — and two
 * of them carry empty room above the head (the crown at ~20 % of the height, the other cards at 0–8 %).
 * Those are zoomed from their bottom edge (`--svc-zoom`, `--svc-y`, home_blocks.css): the crown comes
 * up to ~8 % like the rest and not a centimetre of hair length is lost. Keyed by the file, so a new
 * photo in lib/services/directions.ts falls back to the plain full frame.
 */
const FRAMES: Record<string, { zoom: number; y: string }> = {
  'Salon_Works/Narosh_03.webp': { zoom: 1.15, y: '100%' },
  'Salon_Works/Farb_05.webp': { zoom: 1.15, y: '100%' },
};

const frameStyle = (src: string) => {
  const f = FRAMES[src];
  return f
    ? ({ '--svc-zoom': f.zoom, '--svc-y': f.y } as CSSProperties)
    : undefined;
};

/**
 * ServicesCarousel (Daryna's Canva, 03.11.2026: «SERVICES» — a row of photos with arrows, «щоб була
 * можливість гортати і вибирати напрямок»). One card per salon direction; a card opens the
 * page's ServiceSheet with that direction's prices (`data-sheet`), without JS it links to the
 * price list on `/salon`. Scroll-snap row, swipe on phones, ← → buttons from the arrows island.
 * 16.11 (Dana «на одной высоте»): the row is `data-rv-skip` — AutoReveal no longer lifts each card
 * 32 px with a 90 ms stagger (a staircase while the row came in, and a card swiped into view rose
 * on its own next to the others); the cards stand on one line, the head still rises.
 */
export function ServicesCarousel({ locale }: { locale: Locale }) {
  return (
    <section className='sec sec_page svc_carousel' id='services-carousel'>
      <div className='wrap'>
        <div className='svc_carousel_head'>
          <div>
            <h2 className='display display_lg svc_carousel_title'>
              {t(COPY.heading, locale)}
            </h2>
            <p className='lede'>{t(COPY.sub, locale)}</p>
          </div>
          <ServicesCarousel_Arrows
            target='svc_carousel_track'
            prev={t(COPY.prev, locale)}
            next={t(COPY.next, locale)}
          />
        </div>
      </div>
      <ul className='svc_carousel_track' id='svc_carousel_track' data-rv-skip>
        {directions.map((d) => (
          <li key={d.id} className='svc_carousel_item'>
            <a
              className='svc_card'
              href={`/${locale}/salon#services`}
              data-sheet={d.id}
              aria-haspopup='dialog'
            >
              <span className='svc_card_media' style={frameStyle(d.cardImage)}>
                {d.cardVideo ? (
                  // B-117: a silent loop of the client's work; reduced motion keeps the poster (Studio_Home.css)
                  <video
                    className='svc_card_video'
                    src={d.cardVideo.src}
                    poster={d.cardVideo.poster}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload='metadata'
                    aria-hidden='true'
                  />
                ) : (
                  <Pic
                    src={d.cardImage}
                    alt=''
                    sizes='(min-width: 1024px) 300px, (min-width: 768px) 38vw, 68vw'
                  />
                )}
              </span>
              <span className='svc_card_name'>{t(d.title, locale)}</span>
              <span className='svc_card_sub'>{t(d.sub, locale)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
