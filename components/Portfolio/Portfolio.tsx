import { Fragment } from 'react';

import { img } from '@/lib/content/images';
import type { PortfolioItem } from '@/lib/content/salon';

import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

type Props = {
  heading: string;
  sub: string;
  filters: { id: string; label: string }[];
  items: (Omit<PortfolioItem, 'alt'> & { alt: string })[];
  cta: { label: string; href: string };
  accent: { kicker: string; stat: string; body: string };
};

/** The accent panel sits after this many photos (desktop: right under the first feature). */
const ACCENT_AFTER = 5;

/**
 * Portfolio `#portfolio` → Gallery27 «editorial bento wall» (`/salon`, FR-05; owner 29.10: «знайти
 * блок галереї більш якісний у нашому каталозі»): straight photos, one rounded frame, mixed sizes —
 * `feature` tiles span 2 × 2, the rest are 4 : 5 — and an accent panel woven into the grid. Filter
 * chips (Усі · Нарощування · Фарбування · Догляд · До / після) drive the `.ix-flip` handler
 * (components/Interactions): FLIP shuffle on filter; a tile opens the full photo (Esc · ← → · swipe).
 * JS off: no filter bar, every tile links to the photo. Captions = the post tags, on the photo.
 */
export function Portfolio({
  heading,
  sub,
  filters,
  items,
  cta,
  accent,
}: Props) {
  return (
    <section
      className='sec sec_surface portfolio_sec ix-flip'
      id='portfolio'
      data-ix='flip'
      data-label={heading}
    >
      <div className='wrap'>
        <div className='sec_head_row'>
          <div className='sec_head'>
            <h2 className='display display_lg'>{heading}</h2>
            <p className='lede'>{sub}</p>
          </div>
          <SmartLink className='btn hv-btn-glow' href={cta.href}>
            {cta.label}
          </SmartLink>
        </div>
        <div className='ix-flip__filters' role='group' aria-label={heading}>
          {filters.map((f, i) => (
            <button
              key={f.id}
              type='button'
              className='chip chip_toggle'
              data-filter={f.id === 'all' ? '*' : f.id}
              aria-pressed={i === 0}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ul className='ix-flip__grid works_bento'>
          {items.map((it, i) => {
            const a = img(it.src);
            const tags = it.kind === 'work' ? it.group : `${it.group} ba`;
            return (
              <Fragment key={it.src}>
                <li
                  className={`ix-flip__item works_tile${it.feature ? ' works_tile_feature' : ''}`}
                  data-tags={tags}
                >
                  <figure className='works_fig hv-parallax-inner'>
                    <a
                      className='ix-flip__link works_link'
                      href={a.src}
                      data-caption={it.alt}
                    >
                      <Pic
                        src={it.src}
                        alt={it.alt}
                        sizes={
                          it.feature
                            ? '(min-width: 1200px) 600px, (min-width: 768px) 60vw, 92vw'
                            : '(min-width: 1200px) 300px, (min-width: 768px) 30vw, 46vw'
                        }
                      />
                    </a>
                    {!it.untitled && (
                      <figcaption className='works_cap'>{it.alt}</figcaption>
                    )}
                  </figure>
                </li>
                {i === ACCENT_AFTER - 1 && (
                  <li className='works_accent'>
                    <span className='works_accent_kicker'>{accent.kicker}</span>
                    <p className='works_accent_stat'>{accent.stat}</p>
                    <p className='works_accent_body'>{accent.body}</p>
                    <SmartLink className='works_accent_link' href={cta.href}>
                      {cta.label} <span aria-hidden='true'>↗</span>
                    </SmartLink>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ul>
        <p className='ix-flip__live' aria-live='polite' />
      </div>
    </section>
  );
}
