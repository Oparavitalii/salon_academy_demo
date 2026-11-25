import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  AdminShell,
  adminMetadata,
  fmtDate,
} from '@/components/AdminShell/AdminShell';
import {
  PasswordForm,
  ProfileForm,
} from '@/components/PasswordForms/PasswordForms';
import type { Locale } from '@/i18n/routing';
import { shortDevice } from '@/lib/auth/device';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { loginEvents } from '@/lib/db/schema';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return adminMetadata(params, 'settings.title');
}

/**
 * `/admin/settings` — the admin's own profile (name, phone; e-mail read-only), password change
 * (asks for the current one, same action as the student's) and the last 10 logins of this account.
 */
export default async function AdminSettings({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, 'admin');
  const tc = await getTranslations('cabinet');
  const tp = await getTranslations('password');
  const ta = await getTranslations({ locale, namespace: 'admin' });

  const logins = await db
    .select()
    .from(loginEvents)
    .where(eq(loginEvents.userId, user.id))
    .orderBy(desc(loginEvents.createdAt))
    .limit(10);

  return (
    <AdminShell
      locale={locale}
      active='/admin/settings'
      title={ta('settings.title')}
    >
      <div className='app_grid'>
        <section className='card app_section'>
          <h2>{ta('settings.personal')}</h2>
          <ProfileForm
            name={user.name ?? ''}
            phone={user.phone ?? ''}
            email={user.email}
            labels={{
              name: ta('settings.name'),
              phone: tc('phone'),
              email: tc('email'),
              emailHint: ta('settings.emailHint'),
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
          <p className='note'>{ta('settings.forgot', { email: user.email })}</p>
        </section>
      </div>
      <section className='card app_section'>
        <h2>{ta('settings.recentLogins')}</h2>
        {logins.length === 0 ? (
          <p className='note'>{ta('settings.noLogins')}</p>
        ) : (
          <ul className='feed'>
            {logins.map((e) => (
              <li key={e.id}>
                <span className='feed_time'>
                  {fmtDate(e.createdAt, locale)}
                </span>
                <span>{shortDevice(e.device)}</span>
                <span className='note'>
                  {e.country ?? ta('common.countryUnknown')}
                  {e.city ? `, ${e.city}` : ''}
                </span>
                {e.suspicious && (
                  <span className='tag tag_danger'>
                    {ta('common.suspicious')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className='note'>{ta('settings.note')}</p>
      </section>
    </AdminShell>
  );
}
