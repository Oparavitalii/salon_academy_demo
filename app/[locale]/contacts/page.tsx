import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { BookingChannels } from '@/components/BookingChannels/BookingChannels';
import { ContactCards } from '@/components/ContactCards/ContactCards';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { Location } from '@/components/Location/Location';
import type { Locale } from '@/i18n/routing';
import type { Theme } from '@/lib/theme';

import { pageMeta } from '../_lib/meta';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: dark). */
const theme: Theme = 'dark';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, 'contacts', '/contacts');
}

/**
 * `/contacts` — 3 blocks (5.0_Sitemap 22.10): ContactCards (H1 with the scribble, four cards, photo
 * strip) → Map `#map` (click-to-load, «Маршрут», parking — Release floor F4) → BookingChannels
 * `#booking` (six channels, FR-23; also the target of the header «Записатися в салон»).
 * No contact form (B-37). Copy: 9_Text.md round 4.
 */
export default async function ContactsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Header variant='site' theme={theme} locale={locale} active='/contacts' />
      <main data-theme={theme}>
        <ContactCards locale={locale} />
        <Location locale={locale} variant='contacts' />
        {/* in the bordered panel, the same as on /about (Oksana 16.11, M-19) */}
        <BookingChannels locale={locale} framed />
      </main>
      <Footer variant='site' locale={locale} />
    </>
  );
}
