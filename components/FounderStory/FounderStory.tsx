import type { Locale, Localized } from '@/i18n/routing';
import { founderCopy as c } from '@/lib/content/about';
import { t } from '@/lib/i18n/t';

import { Polaroid } from '../Decorations/Polaroid';
import { Words } from '../Fx/Words';
import { Pic } from '../Pic/Pic';

/** tr-tldr labels and the reading-time units per language. */
const TLDR: Record<'short' | 'full' | 'sec' | 'min' | 'group', Localized> = {
  short: { uk: 'Коротко', pl: 'W skrócie', en: 'Short' },
  full: { uk: 'Повністю', pl: 'W całości', en: 'Full' },
  sec: { uk: 'с', pl: 's', en: 's' },
  min: { uk: 'хв', pl: 'min', en: 'min' },
  group: {
    uk: 'Обсяг тексту',
    pl: 'Długość tekstu',
    en: 'Text length',
  },
};

/** The first sentence is the key line kept in «short»; the rest folds away. */
function splitStory(text: string): [string, string] {
  const m = text.match(/^([^]+?[.!?…])\s+([^]+)$/);
  return m ? [m[1], m[2]] : [text, ''];
}

/**
 * FounderStory → About5 (`/about`, FR-03): Olena's portrait in a polaroid with tape (8.0 §5 —
 * the page's «поляроїд лягає»), a second photo, heading, story, and her own words from the voice
 * message of 14.10 as the quote (Oksana's manifesto quote is hidden — Q-41). The quote carries
 * `.ix-fill` (7.0 §5b): words light up `.5 → 1` between 90 % and 55 % of the viewport, the one
 * italic word is the `<em>`; JS off or reduced motion → the whole quote at full. Dark.
 */
export function FounderStory({ locale }: { locale: Locale }) {
  return (
    <section className='sec sec_surface founder_sec' id='founder'>
      <div className='wrap founder_grid'>
        <div className='sec_head sec_head_wide sec_head_span'>
          <h2 className='display display_lg' data-fx='words'>
            <Words text={t(c.heading, locale)} />
          </h2>
        </div>
        <div className='founder_media' data-gallery>
          <Polaroid
            src={c.portrait.src}
            alt={t(c.portrait.alt, locale)}
            sizes='(min-width: 1200px) 360px, (min-width: 768px) 40vw, 80vw'
            tilt='l'
            tape
            caption={t(c.caption, locale)}
          />
          <figure className='founder_second'>
            <Pic
              src={c.second.src}
              alt={t(c.second.alt, locale)}
              sizes='(min-width: 1200px) 220px, 40vw'
            />
          </figure>
        </div>
        <div className='founder_text'>
          {/* tr-tldr (Web_Trend_Effects, owner's pick 31.10): short / full switch with reading time */}
          <div
            className='tr-tldr founder_tldr'
            data-sec={t(TLDR.sec, locale)}
            data-min={t(TLDR.min, locale)}
          >
            <div className='tr-tldr__bar'>
              <div
                className='tr-tldr__seg'
                role='group'
                aria-label={t(TLDR.group, locale)}
              >
                <button type='button' data-mode='short' aria-pressed='false'>
                  {t(TLDR.short, locale)}
                </button>
                <button type='button' data-mode='full' aria-pressed='true'>
                  {t(TLDR.full, locale)}
                </button>
              </div>
              <span className='tr-tldr__time' />
            </div>
            <div className='tr-tldr__body'>
              {(() => {
                const [key, more] = splitStory(t(c.body, locale));
                return (
                  <p className='body'>
                    <span className='tr-tldr__key'>{key}</span>{' '}
                    {more && <span className='tr-tldr__more'>{more}</span>}
                  </p>
                );
              })()}
            </div>
          </div>
          <figure className='founder_quote'>
            <blockquote
              className='ix-fill'
              data-ix='fill'
              data-from='0.9'
              data-to='0.55'
            >
              «{t(c.quoteBefore, locale)} <em>{t(c.quoteEm, locale)}</em>{' '}
              {t(c.quoteAfter, locale)}»
            </blockquote>
            <figcaption className='caption'>
              — {t(c.caption, locale)}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
