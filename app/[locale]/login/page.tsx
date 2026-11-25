import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { LoginForm } from '@/components/LoginForm/LoginForm';
import type { Locale } from '@/i18n/routing';
import { getValidSession, homeFor } from '@/lib/auth/session';
import type { Theme } from '@/lib/theme';

import { pageMeta } from '../_lib/meta';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ reason?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, 'login', '/login', { robots: { index: false } });
}

/**
 * `/login` — Header_Auth (logo + languages) · Login_Form · Banner · FooterMinimal (6.0). One form for both roles (FR-13, Decisions 19.10.2026). A valid session goes
 * straight to its home; `?reason=ended|blocked` shows why the previous session stopped.
 */
export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { reason } = await searchParams;
  setRequestLocale(locale);

  const s = await getValidSession();
  if (s.ok) {
    redirect(
      s.user.mustChangePassword
        ? `/${locale}/change-password`
        : homeFor(locale, s.user.role),
    );
  }

  const tr = await getTranslations('login');
  const tl = await getTranslations('legal');
  const notice =
    reason === 'ended'
      ? tr('sessionEnded')
      : reason === 'blocked'
        ? tr('errorBlocked')
        : undefined;

  return (
    <>
      <Header variant='minimal' theme={theme} locale={locale} />
      <main data-theme={theme}>
        <section className='sec_page auth_sec'>
          <div className='wrap'>
            <LoginForm
              locale={locale}
              heading={tr('heading')}
              sub={tr('sub')}
              email={tr('email')}
              emailHint={tr('emailHint')}
              password={tr('password')}
              forgot={tr('forgot')}
              submit={tr('submit')}
              noCourse={tr('noCourse')}
              chooseCourse={tr('chooseCourse')}
              privacy={tl('privacy')}
              errors={{
                invalid: tr('errorInvalid'),
                rate: tr('errorRate'),
                blocked: tr('errorBlocked'),
              }}
              notice={notice}
            />
            <div className='info_strip'>
              <b>{tr('bannerLabel')}</b>
              <p>{tr('bannerBody')}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer variant='minimal' theme={theme} locale={locale} />
    </>
  );
}
