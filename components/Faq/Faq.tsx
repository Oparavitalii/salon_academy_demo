import type { Locale } from '@/i18n/routing';
import type { FaqSection } from '@/lib/content/faq';
import { t } from '@/lib/i18n/t';

import { SmartLink } from '../SmartLink/SmartLink';

/**
 * Faq `#faq` → Faq1 (`/salon` FR-24, `/courses` and both course pages FR-25): heading, sub-line,
 * every answered question as a `<details>` (7.0 `.faq`: «+» turns to «×», opens without JS), and
 * the aside «Залишились питання?» + «Зв'язатися з нами» → `/contacts` — under the questions on
 * phones, bottom-aligned with them on desktop (Oksana 16.11, `Studio_Salon.css`). No decor (8.0 §5).
 */
export function Faq({
  locale,
  data,
  surface = 'sec_page',
}: {
  locale: Locale;
  data: FaqSection;
  surface?: 'sec_page' | 'sec_surface';
}) {
  return (
    <section className={`sec ${surface} faq_sec`} id={data.id}>
      <div className='wrap faq_grid'>
        <div className='sec_head sec_head_wide sec_head_span'>
          <h2 className='display display_lg'>{t(data.heading, locale)}</h2>
          <p className='lede'>{t(data.sub, locale)}</p>
        </div>
        <div className='faq_list'>
          {data.items.map((f) => (
            <details key={t(f.q, 'uk')} className='faq'>
              <summary>{t(f.q, locale)}</summary>
              <p>{t(f.a, locale)}</p>
            </details>
          ))}
        </div>
        {/* after the questions in the DOM (Oksana 16.11, M-25): phones read it once they went through
            them all; desktop puts it back in the left column, level with the list's last line (M-10, M-14) */}
        <div className='faq_head'>
          <div className='faq_aside'>
            <p className='faq_aside_title'>{t(data.asideHeading, locale)}</p>
            <SmartLink
              className='btn btn_outline hv-btn-invert'
              href={data.cta.href}
            >
              {t(data.cta.label, locale)}
            </SmartLink>
          </div>
        </div>
      </div>
    </section>
  );
}
