import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthShell, utilityMeta } from '@/components/AuthShell/AuthShell';
import { ForgotForm } from '@/components/PasswordForms/PasswordForms';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return utilityMeta((await params).locale, 'forgotPassword');
}

/** `/forgot-password` — Password_Request (FR-13). */
export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tp = await getTranslations('password');

  return (
    <AuthShell locale={locale} heading={tp('forgotHeading')} minimal>
      <ForgotForm
        locale={locale}
        labels={{
          email: tp('email'),
          submit: tp('sendLink'),
          sent: tp('sent'),
        }}
      />
      <Link href='/login' className='note hv-link'>
        {tp('backToLogin')}
      </Link>
    </AuthShell>
  );
}
