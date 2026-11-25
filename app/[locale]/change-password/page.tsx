import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthShell } from '@/components/AuthShell/AuthShell';
import { PasswordForm } from '@/components/PasswordForms/PasswordForms';
import type { Locale } from '@/i18n/routing';
import { getValidSession, homeFor } from '@/lib/auth/session';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata(): Promise<Metadata> {
  const tp = await getTranslations('password');
  return { title: tp('changeHeading'), robots: { index: false } };
}

/**
 * `/change-password` — forced change after a temporary password (access e-mail or the admin
 * seed). Not in 5.0_Sitemap; added for B-09 (`must_change_password`).
 */
export default async function ChangePasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const s = await getValidSession();
  if (!s.ok)
    redirect(
      `/${locale}/login${s.reason === 'none' ? '' : `?reason=${s.reason}`}`,
    );
  if (!s.user.mustChangePassword) redirect(homeFor(locale, s.user.role));

  const tp = await getTranslations('password');
  const tc = await getTranslations('cabinet');

  return (
    <AuthShell
      locale={locale}
      heading={tp('changeHeading')}
      sub={tp('changeSub')}
      minimal
    >
      <PasswordForm
        mode='forced'
        locale={locale}
        labels={{
          password: tc('newPassword'),
          repeat: tc('repeatPassword'),
          submit: tp('save'),
          errors: {
            tooShort: tp('tooShort'),
            mismatch: tp('mismatch'),
            wrongCurrent: tp('wrongCurrent'),
            expired: tp('expired'),
          },
        }}
      />
    </AuthShell>
  );
}
