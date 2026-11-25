import type { Locale } from '@/i18n/routing';
import { mastersCopy as c, monogramOf } from '@/lib/content/about';
import { t } from '@/lib/i18n/t';

import { Words } from '../Fx/Words';
import { Pic } from '../Pic/Pic';

/**
 * Masters → Team3 (`/about`, FR-04): «Одна команда — один стандарт» (E-09) and five cards — the
 * Booksy team (Dana · Nika · Maryna · Yulia · Liana), level Base (E-20). Photos from the studio
 * shoot of 03.11.2026 (B-112): a tall 4:5 portrait across the card — no round avatar (owner 07.11) —
 * and a second, livelier shot of the same master that fades in on hover / focus. A master without a
 * photo falls back to the designed monogram frame, never a placeholder (Release floor F3, B-91).
 * Experience and languages per stylist hidden (Q-18, Q-36). One button «Записатися в салон» → the
 * page's booking channels (`#booking`, no booking per stylist — Decisions 20.10). Dark.
 */
export function Masters({
  locale,
  children,
}: {
  locale: Locale;
  /** Rendered under the cards — on `/salon` the booking channels (owner 08.11: masters right before «Як записатися»). */
  children?: React.ReactNode;
}) {
  const sizes = '(min-width: 1200px) 240px, (min-width: 768px) 30vw, 50vw';
  return (
    <section className='sec sec_page masters_sec' id='masters'>
      <div className='wrap'>
        <div className='sec_head_row'>
          <h2 className='display display_lg' data-fx='words'>
            <Words text={t(c.heading, locale)} />
          </h2>
          <a className='btn hv-btn-glow' href='#booking'>
            {t(c.cta, locale)}
          </a>
        </div>
        <ul className='masters_grid' data-gallery>
          {c.items.map((m) => {
            const name = t(m.name, locale);
            return (
              <li key={m.id} className='master_card ui-card ui-card--profile'>
                {/* ui-card--profile (Web_Ui_Elements, owner's pick 31.10) with a portrait on top */}
                {m.photo ? (
                  <div className='master_photo'>
                    <Pic src={m.photo} alt={name} sizes={sizes} />
                    {m.photo2 ? (
                      <Pic
                        src={m.photo2}
                        alt=''
                        sizes={sizes}
                        className='master_photo_alt'
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className='master_mono' aria-hidden='true'>
                    <span>{monogramOf(name)}</span>
                  </div>
                )}
                <div className='ui-card__body'>
                  <h3 className='master_name ui-card__title'>{name}</h3>
                  <p className='master_role ui-card__meta'>
                    {t(m.role, locale)}
                  </p>
                  <div className='ui-card__actions'>
                    <a className='btn btn_outline btn_sm' href='#booking'>
                      {t(c.cta, locale)}
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {children}
      </div>
    </section>
  );
}
