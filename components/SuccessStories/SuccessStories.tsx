import type { Locale, Localized } from '@/i18n/routing';
import { stories, storiesCopy as c } from '@/lib/content/stories';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

import { Polaroid } from '../Decorations/Polaroid';
import { Words } from '../Fx/Words';
import { ReadMore } from '../ReadMore/ReadMore';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * SuccessStories → Testimonial13 (`/`, `/courses`; Oksana's copy §7 / §4, E-42): heading, sub,
 * the button, then one card per graduate — polaroid photo, name, course chip, «До курсу» / «Зараз»
 * and her own words — the whole story behind «Читати повністю» (owner 28.10; verbatim, `lang` set);
 * a story with a translation for the locale shows it with «Переклад з …» and the original under
 * «Оригінал» (Daryna, 06.11; the E-47 rule). Replaces StudentWorks; four stories with consent
 * (E-43, E-45), laid out 2 × 2 from 768 px.
 * Oksana 16.11 (M-13): no stack shadow on the cards — the pink outline and glow of the course cards
 * on hover instead (`hv-card-border`, the shadow reset in `app/styles/Studio_About.css`).
 */
export function SuccessStories({
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
      className='sec sec_page stories_sec'
      id='success-stories'
      data-theme={theme}
      data-area='academy'
    >
      <div className='wrap'>
        <div className='sec_head_row'>
          <div className='sec_head'>
            <h2 className='display display_lg' data-fx='words'>
              <Words text={t(c.heading, locale)} />
            </h2>
            <p className='lede'>{t(c.sub, locale)}</p>
          </div>
          <SmartLink className='btn hv-btn-glow' href={cta.href}>
            {t(cta.label, locale)}
          </SmartLink>
        </div>
        {/* sx-stack (Web_Site_Effects, owner's pick 31.10): the stories pile up as you scroll */}
        <ul className='stories_list sx-stack' data-gallery>
          {stories.map((s, i) => {
            // A translation for this locale (E-47 rule): shown with «Переклад з …», original below.
            const tr = s.lang !== locale ? s.translation?.[locale] : undefined;
            const from = c.translatedFrom[s.lang];
            return (
              <li
                key={s.name}
                className='card story_card sx-stack__card hv-card-border'
              >
                <Polaroid
                  src={s.photo.src}
                  alt={t(s.photo.alt, locale)}
                  sizes='(min-width: 1024px) 220px, (min-width: 768px) 45vw, 80vw'
                  tilt={i % 2 ? 'r' : 'l'}
                  tape={i === 0}
                />
                <div className='story_body'>
                  <span className='chip'>{t(s.course, locale)}</span>
                  <h3 className='story_name'>
                    {s.name}
                    {s.city && (
                      <span className='story_city'>{t(s.city, locale)}</span>
                    )}
                  </h3>
                  {(s.before || s.now) && (
                    <dl className='story_facts'>
                      {s.before && (
                        <div>
                          <dt className='meta'>{t(c.beforeLabel, locale)}</dt>
                          <dd>{t(s.before, locale)}</dd>
                        </div>
                      )}
                      {s.now && (
                        <div>
                          <dt className='meta'>{t(c.nowLabel, locale)}</dt>
                          <dd>{t(s.now, locale)}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                  <blockquote className='review_quote story_quote'>
                    <ReadMore
                      paragraphs={tr ? tr.full : s.full}
                      preview={tr ? tr.quote : s.quote}
                      lang={tr ? locale : s.lang}
                      more={t(c.more, locale)}
                      less={t(c.less, locale)}
                      lines={6}
                    />
                  </blockquote>
                  {tr && (
                    <>
                      {from && (
                        <p className='meta story_tr_note'>{t(from, locale)}</p>
                      )}
                      <details className='story_original'>
                        <summary className='meta'>
                          {t(c.original, locale)}
                        </summary>
                        <div lang={s.lang}>
                          {s.full.map((para, k) => (
                            <p key={k}>{para}</p>
                          ))}
                        </div>
                      </details>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
