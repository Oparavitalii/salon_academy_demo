import type { Locale } from '@/i18n/routing';
import { heroHomeCopy as c } from '@/lib/content/home';
import { t } from '@/lib/i18n/t';

import { SignatureHero } from '../SignatureHero/SignatureHero';

/**
 * HeroHome (`/`) — Oksana's «Вариант 1» (owner 28.10: «обкладинку таку як вислала Оксаня в групу,
 * тільки замінити фото»): DEMO / BEAUTY / STUDIO stacked in pink Playfair caps, the sub-line, «Записатися
 * в салон» (fill) → `#salon`, «Обрати курс» (outline) → `#academy`, the studio's photo on the right,
 * «ваш б'юті простір» in Great Vibes, the faded wordmark. `.hero_home` / `.hero_actions` stay — the
 * release probes and the cookie-bar check (D-19) look for them.
 * 16.11.2026 — client: hair decoration removed, so no more strands here: the static
 * `<Strands className='dec_strands_rest' />` (`decor` prop) and the `.dec_live` host of the mouse
 * strands (decEffects.ts) are gone. To revert: `className='hero_home dec_live'` +
 * `decor={<Strands className='dec_strands_rest' />}`.
 */
export function HeroHome({ locale }: { locale: Locale }) {
  return (
    <SignatureHero
      locale={locale}
      id='top'
      className='hero_home'
      stack
      title={c.title.split(' ').map((w, i) => (
        <span key={w}>
          {i > 0 && ' '}
          {w}
        </span>
      ))}
      sub={t(c.sub, locale)}
      ctas={[
        { label: t(c.ctaSalon, locale), href: '#salon' },
        { label: t(c.ctaCourse, locale), href: '#academy', variant: 'outline' },
      ]}
      photo={c.image}
      script={t(c.script, locale)}
    />
  );
}
