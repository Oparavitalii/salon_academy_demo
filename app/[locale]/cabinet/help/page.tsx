import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { utilityMeta } from '@/components/AuthShell/AuthShell';
import { CabinetHeader } from '@/components/CabinetHeader/CabinetHeader';
import { Footer } from '@/components/Footer/Footer';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { contacts } from '@/lib/content/site';
import type { Theme } from '@/lib/theme';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return utilityMeta((await params).locale, 'cabinet');
}

const FAQ = ['Cert', 'Password', 'Device', 'Email'] as const;

/**
 * `/cabinet/help` (owner 02.11.2026: «не переходило на сайт з контакти»): the academy's contacts
 * right in the cabinet — Instagram academy, Telegram, WhatsApp, phone, e-mail — and answers to the
 * cabinet questions (certificate, password, one device, e-mail). Replaces «Допомога → /contacts».
 */
export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, 'student');
  const tc = await getTranslations('cabinet');
  const first = user.name?.split(' ')[0] || user.email.split('@')[0];

  const ways: { label: string; value: string; href: string }[] = [
    {
      label: tc('helpInstagram'),
      value: contacts.instagramAcademy.handle,
      href: contacts.instagramAcademy.url,
    },
    ...(contacts.telegram
      ? [
          {
            label: 'Telegram',
            value: contacts.phone.label,
            href: contacts.telegram,
          },
        ]
      : []),
    { label: 'WhatsApp', value: contacts.phone.label, href: contacts.whatsapp },
    {
      label: tc('phone'),
      value: contacts.phone.label,
      href: contacts.phone.href,
    },
    ...(contacts.email
      ? [
          {
            label: tc('email'),
            value: contacts.email,
            href: `mailto:${contacts.email}`,
          },
        ]
      : []),
  ];

  return (
    <>
      <CabinetHeader locale={locale} name={first} active='/cabinet/help' />
      <main className='app_main' data-theme={theme}>
        <div className='wrap'>
          <section className='app_head'>
            <h1 className='display display_lg'>{tc('help')}</h1>
            <p className='lede'>{tc('helpIntro')}</p>
          </section>
          <div className='app_grid'>
            <section className='card app_section'>
              <h2>{tc('helpWrite')}</h2>
              <ul className='todo_list'>
                {ways.map((w) => (
                  <li key={w.label}>
                    <span className='note'>{w.label}</span>
                    <a
                      className='hv-link link_accent'
                      href={w.href}
                      {...(w.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener' }
                        : {})}
                    >
                      {w.value}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            <section className='card app_section'>
              <h2>{tc('helpFaq')}</h2>
              <div className='help_faq'>
                {FAQ.map((k) => (
                  <details key={k} className='help_q'>
                    <summary>
                      {tc(`helpQ${k}`)}
                      <span className='choose_caret' aria-hidden='true' />
                    </summary>
                    <p>{tc(`helpA${k}`)}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer variant='minimal' locale={locale} theme={theme} />
    </>
  );
}
