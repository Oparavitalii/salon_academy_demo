import { Link } from '@/i18n/navigation';
import type { Locale, Localized } from '@/i18n/routing';
import { portfolio, portfolioFilters } from '@/lib/content/salon';
import { t } from '@/lib/i18n/t';

import { Words } from '../Fx/Words';
import { Pic } from '../Pic/Pic';

const copy = {
  heading: {
    uk: 'Наші роботи',
    pl: 'Nasze prace',
    en: 'Our work',
  } satisfies Localized,
  sub: {
    uk: 'Готові образи клієнток салону: фарбування, нарощування й догляд — гортайте, вони проїдуть збоку.',
    pl: 'Gotowe stylizacje klientek salonu: koloryzacja, przedłużanie i pielęgnacja — przewijaj, a przesuną się w bok.',
    en: 'Finished looks from the salon: colouring, extensions and care — scroll and they slide past.',
  } satisfies Localized,
  cta: {
    uk: 'Уся галерея',
    pl: 'Cała galeria',
    en: 'Full gallery',
  } satisfies Localized,
};

/** Ten finished looks from the salon gallery (the before / after pair stays on /salon). */
const works = portfolio.filter((w) => w.kind === 'work').slice(0, 10);

/**
 * WorksScroll (`/`, owner 31.10.2026 — UI-kit pick `.wx-hscroll`, Web_Wow_Effects): the section holds
 * the screen while the vertical scroll drives the salon's works sideways. Photos from the salon
 * gallery (`lib/content/salon.ts → portfolio`); a caption is the post tag or the service group.
 * Without JS (or with reduced motion) it is a row you swipe. Behaviour: components/Fx/FxKit.tsx.
 * Phones (Oksana 16.11.2026, M-20 «звичайний слайдер з фото і кнопку під фото»): no pinning — the
 * head on top, the photos in `.works_strip` as one swipe row, «Уся галерея» under the photos
 * (Studio_Home.css). From 768 px the strip is just the photo row inside the moving track.
 */
export function WorksScroll({ locale }: { locale: Locale }) {
  const group = (id: string) =>
    portfolioFilters.find((f) => f.id === id)?.label;
  return (
    <section
      className='wx-hscroll works_scroll'
      id='works'
      aria-labelledby='works_title'
      data-gallery
    >
      <div className='wx-hscroll__stage'>
        <div className='wx-hscroll__track'>
          <div className='wx-hscroll__head'>
            <p className='wx-hscroll__count'>
              {String(works.length).padStart(2, '0')} ·{' '}
              {t(copy.heading, locale)}
            </p>
            <h2 id='works_title' className='display display_lg' data-fx='words'>
              <Words text={t(copy.heading, locale)} />
            </h2>
            <p className='lede'>{t(copy.sub, locale)}</p>
            <Link className='btn btn_outline' href='/salon#portfolio'>
              {t(copy.cta, locale)}
            </Link>
          </div>
          {/* focusable: on phones the row scrolls sideways, so a keyboard must reach it */}
          <div
            className='works_strip'
            role='group'
            aria-labelledby='works_title'
            tabIndex={0}
          >
            {works.map((w, i) => {
              const cap = w.untitled ? group(w.group) : w.alt;
              return (
                <figure
                  key={w.src}
                  className='wx-hscroll__item hv-parallax-inner'
                >
                  <Pic
                    src={w.src}
                    alt={t(w.alt, locale)}
                    sizes='(min-width: 768px) 420px, 78vw'
                  />
                  <figcaption>
                    {String(i + 1).padStart(2, '0')}
                    {cap ? ` · ${t(cap, locale)}` : ''}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
