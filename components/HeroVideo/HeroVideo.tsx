import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { type HeroVideoArea, heroVideoCopy } from '@/lib/content/heroVideo';
import { t } from '@/lib/i18n/t';

import { HeroVideo_Player } from './HeroVideo_Player';
import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

/** Phone: two tiles per row of the full width. Desktop: (content-max − video − gaps) / 2 ≈ 360 px. */
const TILE_SIZES =
  '(max-width: 767px) 50vw, (max-width: 1240px) calc((100vw - 480px) / 2), 380px';

/**
 * HeroVideo — the first screen of `/`, `/salon` and `/courses` on every screen size (owner 31.10):
 * vertical video with the script line → four tiles 2×2. No ticker and no Studio | Academy switch
 * (removed 06.11, Daryna 03.11 — one navigation: the phone bottom bar). A salon tile carries
 * `data-sheet`: the page's ServiceSheet opens that direction's prices over the page.
 * Phones stack it; from 768 px the video (9:16 frame) and the tiles sit side by side.
 * Root class is `hv_screen` (not `.hv`): skin_insta.css hides `main > .hv` in the classic skin.
 */
export function HeroVideo({
  locale,
  area = 'home',
  heading = 'h1',
  available,
}: {
  locale: Locale;
  area?: HeroVideoArea;
  /** Course slugs that are on (getCourseView); a course tile not in it is left out. */
  available?: Set<string>;
  /** The page's one h1 lives here; `p` only if a page keeps another h1. */
  heading?: 'h1' | 'p';
}) {
  const c = heroVideoCopy[area];
  const tiles = c.tiles.filter(
    (x) => !x.slug || !available || available.has(x.slug),
  );
  const Title = heading;
  return (
    <section
      className='hv_screen'
      data-hv-area={area}
      aria-labelledby='hv_title'
    >
      <Title id='hv_title' className='visually_hidden'>
        {t(c.h1, locale)}
      </Title>

      <div className='hv_body'>
        <div className='hv_stage'>
          {/* Phones: one video. From 1024 px a wall of three: the same clip from three moments
              (0, ⅓, ⅔) — three different shots, one file, each column below the clip's own width. */}
          <div className='hv_wall'>
            {[0, 1, 2].map((k) => (
              <HeroVideo_Player
                key={k}
                src={c.video.src}
                hls={c.video.hls}
                poster={c.video.poster}
                label={t(c.video.label, locale)}
                start={k / 3}
                extra={k > 0}
              />
            ))}
          </div>
          {c.script && (
            <div className='hv_copy'>
              <p className='hv_script'>{t(c.script, locale)}</p>
              {c.sub && <p className='hv_sub'>{t(c.sub, locale)}</p>}
            </div>
          )}
          {c.cta && (
            <SmartLink className='btn hv_cta' href={c.cta.href}>
              {t(c.cta.label, locale)}
            </SmartLink>
          )}
        </div>

        <ul className='hv_tiles' data-count={tiles.length}>
          {tiles.map((tile) => (
            <li key={tile.href + tile.image}>
              <Link
                href={tile.href}
                className='hv_tile'
                data-sheet={tile.sheet}
                aria-haspopup={tile.sheet ? 'dialog' : undefined}
              >
                <Pic
                  src={tile.image}
                  alt=''
                  sizes={TILE_SIZES}
                  className='hv_tile_img'
                />
                <span className='hv_tile_text'>
                  <span className='hv_tile_title'>{t(tile.title, locale)}</span>
                  <span className='hv_tile_sub'>{t(tile.sub, locale)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
