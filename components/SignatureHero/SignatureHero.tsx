import type { ReactNode } from 'react';

import type { Locale } from '@/i18n/routing';
import type { Pic as PicData } from '@/lib/content/home';
import { t } from '@/lib/i18n/t';

import { Polaroid } from '../Decorations/Polaroid';
import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

type Cta = { label: string; href: string; variant?: 'primary' | 'outline' };

type Props = {
  locale: Locale;
  /** The H1 — a node, so the home page can stack DEMO / BEAUTY / STUDIO. */
  title: ReactNode;
  eyebrow?: string;
  sub: string;
  ctas: Cta[];
  photo: PicData;
  /** A second, smaller photo over the main one's lower corner. */
  inset?: PicData;
  /** Two polaroids around the photo (`/courses`). */
  polaroids?: PicData[];
  /** Great Vibes line over the photo («ваш б'юті простір»). */
  script?: string;
  /** Faded wordmark along the bottom edge. */
  watermark?: string;
  /** Extra classes on the section (`hero_home dec_live` on `/` — the probes and the strands use them). */
  className?: string;
  /** Rendered inside the section before the content (the home strands). */
  decor?: ReactNode;
  stack?: boolean;
  id?: string;
};

/**
 * SignatureHero — the first screen of `/`, `/salon`, `/courses`, `/about` in Oksana's «Вариант 1»
 * (Telegram 24.10.2026 10:04, `docs/14_Project_Edits/Assets/Hero_Oksana_Variant_1.png`): a dark plum
 * band, the heading, sub-line and two buttons on the left, the photo on the right melting into the
 * background, a script line over it and a faded wordmark at the bottom. Dana (24.10): the colours of
 * variant 1, but not the stock model — so every page uses the studio's own photo (owner 28.10).
 * Always the dark register, whatever the page theme. The photo is the LCP image (`priority`).
 */
export function SignatureHero({
  locale,
  title,
  eyebrow,
  sub,
  ctas,
  photo,
  inset,
  polaroids,
  script,
  watermark = 'Demo Beauty',
  className = '',
  decor,
  stack = false,
  id = 'hero',
}: Props) {
  return (
    <section
      className={`sig_hero${stack ? ' sig_hero_stack' : ''} ${className}`}
      id={id}
      data-theme='dark'
    >
      {decor}
      <div className='sig_hero_media'>
        <figure className='sig_hero_photo'>
          <Pic
            src={photo.src}
            alt={t(photo.alt, locale)}
            sizes='(min-width: 1024px) 50vw, 100vw'
            priority
          />
        </figure>
        {inset && (
          <figure className='sig_hero_inset'>
            <Pic
              src={inset.src}
              alt={t(inset.alt, locale)}
              sizes='(min-width: 1024px) 200px, 30vw'
            />
          </figure>
        )}
        {polaroids?.map((p, i) => (
          <Polaroid
            key={p.src}
            src={p.src}
            alt={t(p.alt, locale)}
            sizes='(min-width: 1200px) 170px, 26vw'
            tilt={i % 2 ? 'r' : 'l'}
            tape={i === 0}
            small
            settle
            settleDelay={360 + i * 120}
            className={`sig_hero_polaroid sig_hero_polaroid_${i + 1}`}
          />
        ))}
        {script && (
          <p className='sig_hero_script' aria-hidden='true'>
            {script}
          </p>
        )}
      </div>
      <div className='wrap sig_hero_inner'>
        <div className='sig_hero_text'>
          {eyebrow && <p className='eyebrow'>{eyebrow}</p>}
          <h1 className='sig_hero_title'>{title}</h1>
          <p className='lede sig_hero_sub hero_home_sub'>{sub}</p>
          <div className='hero_actions'>
            {ctas.map((c) => (
              <SmartLink
                key={c.href}
                href={c.href}
                className={
                  c.variant === 'outline'
                    ? 'btn btn_outline hv-btn-invert'
                    : 'btn hv-btn-glow'
                }
              >
                {c.label}
              </SmartLink>
            ))}
          </div>
        </div>
      </div>
      <p className='sig_hero_mark' aria-hidden='true'>
        {watermark}
      </p>
    </section>
  );
}
