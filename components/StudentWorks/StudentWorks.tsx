import type { Locale, Localized } from '@/i18n/routing';
import { studentWorksCopy as c } from '@/lib/content/home';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

import { Polaroid } from '../Decorations/Polaroid';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * StudentWorks → Gallery5 — stands in for SuccessStories while there are no graduate stories with
 * consent (Q-35, 9_Text.md; the SuccessStories block renders nothing). Heading, caption, six photos
 * from @studio.demo.academy as polaroids (8.0 §5: «поляроїд лягає» — the decor of this slot on `/`),
 * tilt alternating; the button: `/` «Стати майстром» → `/courses#catalog`, `/courses` «Обрати свій
 * курс» → `#catalog`. Light on `/` (wireframe §8).
 */
export function StudentWorks({
  locale,
  cta,
  theme,
}: {
  locale: Locale;
  cta: { label: Localized; href: string };
  theme?: Theme;
}) {
  return (
    <section
      className='sec sec_page student_works'
      id='student-works'
      data-theme={theme}
    >
      <div className='wrap'>
        <div className='sec_head_row'>
          <div className='sec_head'>
            <p className='eyebrow'>{t(c.caption, locale)}</p>
            <h2 className='display display_lg'>{t(c.heading, locale)}</h2>
          </div>
          <SmartLink className='btn hv-btn-glow' href={cta.href}>
            {t(cta.label, locale)}
          </SmartLink>
        </div>
        <div className='polaroid_grid'>
          {c.images.map((p, i) => (
            <Polaroid
              key={p.src}
              src={p.src}
              alt={t(p.alt, locale)}
              sizes='(min-width: 1200px) 340px, (min-width: 768px) 30vw, 45vw'
              tilt={i % 2 ? 'r' : 'l'}
              tape={i === 0 || i === 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
