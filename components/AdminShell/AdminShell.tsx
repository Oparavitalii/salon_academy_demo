import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Theme } from '@/lib/theme';

import { AdminHeader } from '../CabinetHeader/CabinetHeader';
import { Footer } from '../Footer/Footer';

/** Admin is light (4.2 route → theme, NFR-08). */
const theme: Theme = 'light';

/** The `?msg=` codes the admin actions redirect with → `admin.shell.msg.*`. */
const MESSAGES = [
  'saved',
  'blocked',
  'unblocked',
  'email_changed',
  'resent',
  'created',
  'granted',
  'revoked',
  'refunded',
  'bad_email',
  'email_taken',
  'bad_price',
  'bad_lesson',
  'cert_sent',
  'cert_not_sent',
  'cert_number_taken',
  'cert_no_name',
  'bad_cert',
] as const;
type MessageCode = (typeof MESSAGES)[number];
const isMessage = (m?: string): m is MessageCode =>
  !!m && (MESSAGES as readonly string[]).includes(m);

/** BCP 47 tag for dates in the admin (the UI locale, Warsaw time). */
export const INTL_LOCALE: Record<Locale, string> = {
  uk: 'uk-UA',
  pl: 'pl-PL',
  en: 'en-GB',
};

/** Page `<title>`: «{page} — адмінка» in the UI locale; admin pages are never indexed. */
export async function adminMetadata(
  params: Promise<{ locale: Locale }>,
  key: string,
): Promise<Metadata> {
  const { locale } = await params;
  const ta = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: ta('meta.title', { title: ta(key) }),
    robots: { index: false },
  };
}

/** Sub-pages that share one header section (31.10.2026): shown as tabs under the title. */
const TABS: Record<string, [string, string][]> = {
  students: [
    ['/admin/students', 'tabs.students'],
    ['/admin/logins', 'tabs.logins'],
  ],
  payments: [
    ['/admin/payments', 'tabs.payments'],
    ['/admin/certificates', 'tabs.certificates'],
  ],
};

/** Admin page frame: Header_Admin · title · tabs · status line from `?msg=` · FooterMinimal. */
export async function AdminShell({
  locale,
  active,
  title,
  msg,
  tabs,
  children,
}: {
  locale: Locale;
  active: string;
  title: string;
  msg?: string;
  tabs?: keyof typeof TABS;
  children: React.ReactNode;
}) {
  const ta = await getTranslations({ locale, namespace: 'admin' });
  const text = isMessage(msg) ? ta(`shell.msg.${msg}`) : undefined;
  const bad =
    msg?.startsWith('bad_') ||
    msg === 'email_taken' ||
    msg === 'cert_not_sent' ||
    msg === 'cert_number_taken' ||
    msg === 'cert_no_name';
  return (
    <>
      <AdminHeader locale={locale} active={active} />
      <main className='app_main app_admin' data-theme={theme}>
        <div className='wrap'>
          <section className='app_head'>
            <h1 className='display display_md'>{title}</h1>
            {tabs && (
              <nav className='admin_tabs' aria-label={title}>
                {TABS[tabs].map(([href, key]) => (
                  <Link
                    key={href}
                    href={href}
                    className={`admin_tab${active === href ? ' is_active' : ''}`}
                    aria-current={active === href ? 'page' : undefined}
                  >
                    {ta(key)}
                  </Link>
                ))}
              </nav>
            )}
            {text && (
              <p
                className={`form_msg${bad ? ' form_msg_error' : ''}`}
                role={bad ? 'alert' : 'status'}
              >
                {text}
              </p>
            )}
          </section>
          {children}
        </div>
      </main>
      <Footer variant='minimal' theme={theme} locale={locale} />
    </>
  );
}

export const fmtDate = (d: Date | null, locale: Locale) =>
  d
    ? d.toLocaleString(INTL_LOCALE[locale], {
        timeZone: 'Europe/Warsaw',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—';
