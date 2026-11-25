import { getLocale, getTranslations } from 'next-intl/server';

import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Theme } from '@/lib/theme';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: dark). */
const theme: Theme = 'dark';

/** 404 — Header_Home · Status_Message · FooterMinimal (6_Karkas). Decor: `.fx-host` + ghost numeral «404» (8.0 §5). Copy: 9_Text.md → Global → 404. */
export default async function NotFound() {
  const locale = (await getLocale()) as Locale;
  const tr = await getTranslations('notFound');

  return (
    <>
      <Header variant='minimal' theme={theme} locale={locale} />
      <main data-theme={theme}>
        <section className='sec_page fx-host'>
          <span className='dec_ghost_num' aria-hidden='true'>
            404
          </span>
          <div className='wrap status'>
            <h1 className='display display_lg'>{tr('heading')}</h1>
            <p className='lede'>{tr('body')}</p>
            <Link className='btn hv-btn-glow' href='/'>
              {tr('home')}
            </Link>
            <Link className='hv-link link_accent' href='/contacts'>
              {tr('write')}
            </Link>
          </div>
        </section>
      </main>
      <Footer variant='minimal' theme={theme} locale={locale} />
    </>
  );
}
