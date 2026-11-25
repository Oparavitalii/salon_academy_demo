import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { academyTeaserCopy as c } from '@/lib/content/home';
import type { CourseView } from '@/lib/courses/public';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

import { CourseCards } from '../CourseCatalog/CourseCatalog';
import { Pic } from '../Pic/Pic';

/**
 * AcademyTeaser `#academy` → own · Academy_Teaser (`/`, wireframe §7): the light paper section
 * with the rounded top (`.theme-edge` + `.ix-edge`, 7.0 §5b — home's working interaction, F1),
 * five numbered benefits (owner 28.10 «сделать дизайн красивее в нашем стиле»: big Playfair
 * numerals on a pink hairline instead of five flat tiles), then all the courses with the «Усі ·
 * Онлайн · Офлайн» filter (CourseCards, compact), «Обрати курс» → `/courses`. The theme override sits on the section
 * itself (4.2 § Theme scopes). Copy: 9_Text.md → AcademyTeaser (E-26 international, E-23 cabinet).
 */
export function AcademyTeaser({
  locale,
  view,
  theme = 'light',
}: {
  locale: Locale;
  view: CourseView;
  theme?: Theme;
}) {
  return (
    <section
      className='sec academy_teaser theme-edge ix-edge'
      id='academy'
      data-theme={theme}
      data-area='academy'
    >
      <div className='wrap'>
        <div className='academy_head'>
          <div className='sec_head'>
            <h2 className='display display_xl'>{t(c.heading, locale)}</h2>
            <p className='lede'>{t(c.sub, locale)}</p>
          </div>
          <figure className='academy_inset'>
            <Pic
              src={c.inset.src}
              alt={t(c.inset.alt, locale)}
              sizes='(min-width: 1200px) 260px, 40vw'
            />
          </figure>
        </div>
        <ol className='benefits'>
          {c.benefits.map((b, i) => (
            <li key={t(b.title, 'uk')} className='benefit'>
              <p className='benefit_num' aria-hidden='true'>
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className='benefit_title'>{t(b.title, locale)}</h3>
              <p className='benefit_text'>{t(b.body, locale)}</p>
            </li>
          ))}
        </ol>
        <div className='academy_courses'>
          <CourseCards locale={locale} view={view} compact />
        </div>
        <p className='sec_foot'>
          <Link className='btn hv-btn-glow' href='/courses'>
            {t(c.cta, locale)}
          </Link>
        </p>
      </div>
    </section>
  );
}
