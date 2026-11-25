import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthShell, utilityMeta } from '@/components/AuthShell/AuthShell';
import { PasswordForm } from '@/components/PasswordForms/PasswordForms';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return utilityMeta((await params).locale, 'resetPassword');
}

/** `/reset-password/[token]` — Password_New (FR-13). The token is checked on submit. */
export default async function ResetPasswordPage({ params }: Props) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const tp = await getTranslations('password');
  const tl = await getTranslations('login');

  return (
    <AuthShell locale={locale} heading={tp('newHeading')} minimal>
      <PasswordForm
        mode='reset'
        locale={locale}
        token={token}
        labels={{
          password: tp('newHeading'),
          repeat: tp('repeat'),
          submit: tp('saveAndLogin'),
          again: tp('sendLink'),
          errors: {
            tooShort: tp('tooShort'),
            mismatch: tp('mismatch'),
            wrongCurrent: tp('wrongCurrent'),
            expired: tp('expired'),
            blocked: tl('errorBlocked'),
          },
        }}
      />
    </AuthShell>
  );
}
