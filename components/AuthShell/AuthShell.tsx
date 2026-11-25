import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import type { Theme } from '@/lib/theme';

import { Footer } from '../Footer/Footer';
import { Header } from '../Header/Header';

/** Auth / password / checkout pages are light (4.2 route → theme). */
const theme: Theme = 'light';

/**
 * Utility pages (password, checkout): header (salon logo; `minimal` = Header_Auth, logo + languages)
 * + one centred card + FooterMinimal in the page theme (4.2, Decisions 22.10 B-88).
 */
export function AuthShell({
  locale,
  heading,
  sub,
  children,
  minimal = false,
}: {
  locale: Locale;
  heading: string;
  sub?: string;
  children: React.ReactNode;
  minimal?: boolean;
}) {
  return (
    <>
      <Header
        variant={minimal ? 'minimal' : 'site'}
        theme={theme}
        locale={locale}
      />
      <main data-theme={theme}>
        <section className='sec_page auth_sec'>
          <div className='wrap'>
            <div className='login'>
              <div>
                <div className='card'>
                  <div>
                    <h1 className='display display_md auth_title'>{heading}</h1>
                    {sub && <p className='note'>{sub}</p>}
                  </div>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer variant='minimal' theme={theme} locale={locale} />
    </>
  );
}

/** `<title>` from `meta.<key>.title`, never indexed. */
export async function utilityMeta(
  locale: Locale,
  key:
    | 'cabinet'
    | 'checkout'
    | 'checkoutPending'
    | 'forgotPassword'
    | 'resetPassword',
): Promise<Metadata> {
  const tr = await getTranslations({ locale, namespace: 'meta' });
  return { title: tr(`${key}.title`), robots: { index: false } };
}
