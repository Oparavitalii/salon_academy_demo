import type { Locale } from '@/i18n/routing';
import { studioLifeCopy as c } from '@/lib/content/about';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';

/**
 * «Життя студії» (`/about`, owner 08.11.2026: «Там багато фоток може їх ще десь використати з
 * фотосесії»): six frames of the studio shoot 03.11 — the team, each master, the floor. Phones: one
 * swipe row (wide frames 4:3, tall 4:5, one height). From 768 px a 4-column bento, the wide frames
 * spanning two columns. A tap opens the photo full screen (`data-gallery`, Lightbox). Dark.
 */
export function StudioLife({ locale }: { locale: Locale }) {
  const heading = t(c.heading, locale);
  return (
    <section className='sec sec_page studio_life_sec' id='studio-life'>
      <div className='wrap'>
        <div className='sec_head'>
          <h2 className='display display_lg'>{heading}</h2>
          <p className='lede'>{t(c.sub, locale)}</p>
        </div>
        {/* focusable: on phones the row scrolls sideways, so a keyboard must reach it */}
        <ul
          className='life_grid'
          data-gallery
          data-gallery-label={heading}
          aria-label={heading}
          tabIndex={0}
        >
          {c.items.map((p) => (
            <li
              key={p.src}
              className={p.wide ? 'life_tile life_tile_wide' : 'life_tile'}
            >
              <Pic
                src={p.src}
                alt={t(p.alt, locale)}
                sizes={
                  p.wide
                    ? '(min-width: 1200px) 600px, (min-width: 768px) 50vw, 400px'
                    : '(min-width: 1200px) 290px, (min-width: 768px) 25vw, 240px'
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
