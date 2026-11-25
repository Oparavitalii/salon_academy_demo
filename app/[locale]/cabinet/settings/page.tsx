import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { utilityMeta } from '@/components/AuthShell/AuthShell';
import { CabinetHeader } from '@/components/CabinetHeader/CabinetHeader';
import { Footer } from '@/components/Footer/Footer';
import {
  PasswordForm,
  ProfileForm,
} from '@/components/PasswordForms/PasswordForms';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import type { Theme } from '@/lib/theme';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return utilityMeta((await params).locale, 'cabinet');
}

/**
 * `/cabinet/settings` — ProfileForm · PasswordForm (09_Cab_Settings). The Certificate block is not
 * rendered: 9_Text.md → Certificate «[○] … hide: блок, доки сертифіката немає у файлах учениці»
 * (Q-06). Fix round 22.10 — the disabled «Завантажити» was a visible stub (Release floor F3).
 */
export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, 'student');
  const tc = await getTranslations('cabinet');
  const tp = await getTranslations('password');
  const first = user.name?.split(' ')[0] || user.email.split('@')[0];

  return (
    <>
      <CabinetHeader locale={locale} name={first} active='/cabinet/settings' />
      <main className='app_main' data-theme={theme}>
        <div className='wrap'>
          <section className='app_head'>
            <h1 className='display display_lg'>{tc('settings')}</h1>
          </section>
          <div className='app_grid'>
            <section className='card app_section'>
              <h2>{tc('profile')}</h2>
              <ProfileForm
                name={user.name ?? ''}
                phone={user.phone ?? ''}
                email={user.email}
                labels={{
                  name: tc('certName'),
                  phone: tc('phone'),
                  email: tc('email'),
                  emailHint: tc('emailHint'),
                  save: tc('save'),
                  saved: tc('saved'),
                }}
              />
            </section>
            <section className='card app_section'>
              <h2>{tc('changePassword')}</h2>
              <PasswordForm
                mode='settings'
                locale={locale}
                labels={{
                  current: tc('currentPassword'),
                  password: tc('newPassword'),
                  repeat: tc('repeatPassword'),
                  submit: tc('changePassword'),
                  done: tc('passwordChanged'),
                  errors: {
                    tooShort: tp('tooShort'),
                    mismatch: tp('mismatch'),
                    wrongCurrent: tp('wrongCurrent'),
                    expired: tp('expired'),
                  },
                }}
              />
            </section>
          </div>
        </div>
      </main>
      <Footer variant='minimal' locale={locale} theme={theme} />
    </>
  );
}
