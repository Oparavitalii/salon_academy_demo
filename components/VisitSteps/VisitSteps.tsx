import type { Locale } from '@/i18n/routing';
import { visitStepsCopy as c } from '@/lib/content/salon';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';

/**
 * «Як проходить візит» (`/salon`, owner 08.11.2026 — album «робочий процес» of the shoot 03.11):
 * five numbered steps, each a 4:5 frame with a short title and one line. Phones and tablets: one swipe
 * row to the screen edges (like «Життя студії»); from 1200 px all five in a row. A tap on a photo
 * opens it full screen (`data-gallery`, Lightbox). Dark.
 */
export function VisitSteps({ locale }: { locale: Locale }) {
  const heading = t(c.heading, locale);
  return (
    <section className='sec sec_page visit_sec' id='visit'>
      <div className='wrap'>
        <div className='sec_head'>
          <h2 className='display display_lg'>{heading}</h2>
          <p className='lede'>{t(c.sub, locale)}</p>
        </div>
        {/* focusable: below 1200 px the row scrolls sideways, so a keyboard must reach it */}
        <ol
          className='visit_row'
          data-gallery
          data-gallery-label={heading}
          aria-label={heading}
          tabIndex={0}
        >
          {c.steps.map((s, i) => (
            <li key={s.pic.src} className='visit_step'>
              <div className='visit_photo'>
                <Pic
                  src={s.pic.src}
                  alt={t(s.pic.alt, locale)}
                  sizes='(min-width: 1200px) 230px, (min-width: 768px) 34vw, 70vw'
                />
              </div>
              <p className='visit_num' aria-hidden='true'>
                {String(i + 1).padStart(2, '0')}/
              </p>
              <h3 className='visit_title'>{t(s.title, locale)}</h3>
              <p className='visit_body'>{t(s.body, locale)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
