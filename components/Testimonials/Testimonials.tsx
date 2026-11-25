import type { Locale, Localized } from '@/i18n/routing';
import type { Pic as PicData } from '@/lib/content/home';
import { ratingCopy, reviews } from '@/lib/content/salon';
import { t } from '@/lib/i18n/t';

import { ReviewSlider } from './ReviewSlider';
import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

type Props = {
  locale: Locale;
  heading: Localized;
  sub: Localized;
  cta: { label: Localized; href: string };
  /** `/` sets a photo behind the block (9_Text.md → Testimonials «фон блоку»). */
  background?: PicData;
  id?: string;
};

/**
 * Testimonials → Testimonial9 (`/`, `/salon`, FR-06): the rating plaque «★★★★★ 5.0 · 180+
 * відгуків Booksy» (E-28 stars, Bk), one review card at a time (Playfair quote mark, italic quote,
 * initial avatar, name, source), arrows + dots. Reviews are verbatim in their own language on
 * every locale (9_Text.md); per-card stars stay hidden until each rating is known (Q-35). The
 * track is a scroll-snap strip, so it swipes and works without JS; the slider only drives it.
 * Oksana 16.11.2026: the rating and «Стати клієнткою» follow the card — under it while the block is
 * one column (M-21, phones), and from 1200 px the left column bottom-aligned with the card (M-06,
 * /salon M-09) — Studio_Home.css.
 */
export function Testimonials({
  locale,
  heading,
  sub,
  cta,
  background,
  id = 'testimonials',
}: Props) {
  return (
    <section
      className={`sec reviews_sec${background ? ' reviews_sec_photo' : ''}`}
      id={id}
    >
      {background && (
        <div className='reviews_bg' aria-hidden='true'>
          <Pic src={background.src} alt='' sizes='100vw' />
        </div>
      )}
      <div className='wrap reviews_grid'>
        <div className='sec_head sec_head_wide sec_head_span'>
          <h2 className='display display_lg'>{t(heading, locale)}</h2>
          <p className='lede'>{t(sub, locale)}</p>
        </div>
        <ReviewSlider
          id={`${id}_track`}
          label={t(heading, locale)}
          prev={t(ratingCopy.prev, locale)}
          next={t(ratingCopy.next, locale)}
          goTo={t(ratingCopy.goTo, locale)}
          more={t(ratingCopy.more, locale)}
          less={t(ratingCopy.less, locale)}
          items={reviews.map((r) => ({
            author: r.author,
            source: t(r.source, locale),
            text: r.text,
            lang: r.lang,
          }))}
        />
        {/* after the card in the DOM: under it when stacked (M-21), its left column from 1200 px */}
        <div className='reviews_head'>
          <p className='rating'>
            <span className='stars'>{ratingCopy.stars}</span>
            <span className='rating_count'>{t(ratingCopy.count, locale)}</span>
          </p>
          <p>
            <SmartLink
              className='btn btn_outline hv-btn-invert'
              href={cta.href}
            >
              {t(cta.label, locale)}
            </SmartLink>
          </p>
        </div>
      </div>
    </section>
  );
}
