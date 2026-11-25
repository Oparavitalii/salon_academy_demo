import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { aboutCtaCopy as c } from '@/lib/content/about';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';

/**
 * FinalCta → Cta7 (`/about`): the photo band (the salon hall at work, Studio_Life_07 — Oksana 16.11 M-18,
 * was the hair from behind; under a scrim), heading, sub-line and the two ways — «Стати клієнткою» →
 * `/salon`, «Стати майстром» → `/courses`. Dark. No decor (8.0 §5).
 */
export function AboutCta({ locale }: { locale: Locale }) {
  return (
    <section className='about_cta' id='cta'>
      <div className='about_cta_bg'>
        <Pic src={c.image.src} alt={t(c.image.alt, locale)} sizes='100vw' />
        <span className='page_hero_scrim' aria-hidden='true' />
      </div>
      <div className='wrap about_cta_inner'>
        <h2 className='display display_xl'>{t(c.heading, locale)}</h2>
        <p className='lede'>{t(c.body, locale)}</p>
        <div className='hero_actions'>
          <Link className='btn hv-btn-glow' href='/salon'>
            {t(c.salon, locale)}
          </Link>
          <Link className='btn btn_outline hv-btn-invert' href='/courses'>
            {t(c.academy, locale)}
          </Link>
        </div>
      </div>
    </section>
  );
}
