import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { recognitionCopy as c } from '@/lib/content/about';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';

/**
 * AcademyRecognition → Layout3 (`/about`): «Навчальний напрям Demo Beauty», the sub-line, the text
 * (intensive + online course, international certificate — E-26), «Стати майстром» → `/courses` and the
 * photos. Dark.
 * Oksana 16.11 (M-16 / M-28): the text and the button sit under the heading, the photos follow as one row
 * of four equal 4:5 frames (no empty column beside them, no tall frame that crops the certificate); on a
 * phone the row is a swipe slider, every photo the same size (`app/styles/Studio_About.css`). A tap
 * opens the photo full screen (`data-gallery`, Lightbox).
 */
export function AcademyRecognition({ locale }: { locale: Locale }) {
  const heading = t(c.heading, locale);
  return (
    <section className='sec sec_page recognition_sec' id='academy'>
      <div className='wrap recognition_grid'>
        <div className='sec_head sec_head_wide sec_head_span'>
          <h2 className='display display_lg'>{heading}</h2>
          <p className='lede'>{t(c.sub, locale)}</p>
        </div>
        <div className='recognition_text'>
          <p className='body'>{t(c.body, locale)}</p>
          <p>
            <Link className='btn hv-btn-glow' href='/courses'>
              {t(c.cta, locale)}
            </Link>
          </p>
        </div>
        {/* focusable: on phones the row scrolls sideways, so a keyboard must reach it */}
        <ul
          className='recognition_media'
          data-gallery
          data-gallery-label={heading}
          aria-label={heading}
          tabIndex={0}
        >
          {c.images.map((p, i) => (
            <li
              key={p.src}
              className={`recognition_img recognition_img_${i + 1}`}
            >
              <Pic
                src={p.src}
                alt={t(p.alt, locale)}
                sizes='(min-width: 1200px) 270px, (min-width: 768px) 23vw, 300px'
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
