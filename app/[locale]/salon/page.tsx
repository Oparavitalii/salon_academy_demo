import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { BookingChannels } from '@/components/BookingChannels/BookingChannels';
import { Tape } from '@/components/Decorations/Tape';
import { Faq } from '@/components/Faq/Faq';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { HeroVideo } from '@/components/HeroVideo/HeroVideo';
import { Location } from '@/components/Location/Location';
import { Masters } from '@/components/Masters/Masters';
import { Portfolio } from '@/components/Portfolio/Portfolio';
import {
  type PricingGroup,
  ServicePricing,
} from '@/components/ServicePricing/ServicePricing';
import { ServiceSheet } from '@/components/ServiceSheet/ServiceSheet';
import { Testimonials } from '@/components/Testimonials/Testimonials';
import { VisitSteps } from '@/components/VisitSteps/VisitSteps';
import type { Locale } from '@/i18n/routing';
import { salonFaq } from '@/lib/content/faq';
import {
  priceWords as W,
  portfolio,
  portfolioFilters,
  salonCopy,
  salonTapeWords,
  serviceGroups,
} from '@/lib/content/salon';
import { t } from '@/lib/i18n/t';
import { sheetClose } from '@/lib/services/directions';
import { getDirectionSheets } from '@/lib/services/directionSheets';
import { getServiceOverrides } from '@/lib/services/public';
import { rowsOf } from '@/lib/services/rows';
import type { Theme } from '@/lib/theme';

import { pageMeta } from '../_lib/meta';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: dark). */
const theme: Theme = 'dark';

type Props = { params: Promise<{ locale: Locale }> };

/** ISR: prices / durations come from /admin/services (which also revalidates on save). */
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, 'salon', '/salon');
}

/**
 * `/salon` — 7 blocks (5.0_Sitemap 22.10, spec 02 + Oksana's copy 20.10): HeroVideo (31.10) →
 * ServiceCatalog `#services` → [Calculator hidden until Q-27] → Portfolio `#portfolio` (Gallery27 bento)
 * → VisitSteps `#visit` (five steps of a visit, shoot 03.11 — owner 08.11) → `.dec_tape` → Testimonials
 * → Faq `#faq` → Masters + BookingChannels `#booking` (owner 08.11) → Location `#location`.
 * Every «Записатися» → `#booking` (FR-23). Copy: 9_Text.md round 4; prices Booksy 20.10 / the DB.
 */
export default async function SalonPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pc = salonCopy.pricing;
  const pf = salonCopy.portfolio;
  const [overrides, sheets] = await Promise.all([
    getServiceOverrides(),
    getDirectionSheets(locale),
  ]);

  const groups: PricingGroup[] = serviceGroups.map((g) => ({
    id: g.id,
    name: t(g.name, locale),
    description: g.description ? t(g.description, locale) : undefined,
    rows: g.services.flatMap((s) => rowsOf(s, overrides.get(s.id), locale)),
  }));

  return (
    <>
      <Header variant='site' theme={theme} locale={locale} active='/salon' />
      <main data-theme={theme}>
        {/* first screen = the home one (owner 31.10); SignatureHero stays for other pages */}
        <HeroVideo locale={locale} area='salon' />
        <section className='sec sec_page services_sec' id='services'>
          <div className='wrap'>
            <div className='services_head'>
              <div className='sec_head'>
                <h2 className='display display_lg'>{t(pc.heading, locale)}</h2>
                <p className='lede'>{t(pc.sub, locale)}</p>
              </div>
              <div className='services_intro'>
                <p className='body'>{t(pc.body, locale)}</p>
                <ul className='services_notes'>
                  <li className='note'>{t(pc.noteLength, locale)}</li>
                  <li className='note'>{t(pc.noteDensity, locale)}</li>
                </ul>
              </div>
            </div>
            <ServicePricing
              groups={groups}
              bookLabel={t(W.book, locale)}
              bookHref='#booking'
              tablistLabel={t(pc.heading, locale)}
            />
          </div>
        </section>
        <Portfolio
          heading={t(pf.heading, locale)}
          sub={t(pf.sub, locale)}
          cta={{ label: t(pf.cta, locale), href: '#booking' }}
          accent={{
            kicker: t(pf.accentKicker, locale),
            stat: t(pf.accentStat, locale),
            body: t(pf.accentBody, locale),
          }}
          filters={portfolioFilters.map((f) => ({
            id: f.id,
            label: t(f.label, locale),
          }))}
          items={portfolio.map((it) => ({ ...it, alt: t(it.alt, locale) }))}
        />
        <VisitSteps locale={locale} />
        <Tape words={salonTapeWords.map((w) => t(w, locale))} />
        <Testimonials
          locale={locale}
          heading={salonCopy.reviews.heading}
          sub={salonCopy.reviews.sub}
          cta={{ label: salonCopy.reviews.cta, href: '#booking' }}
        />
        <Faq locale={locale} data={salonFaq} />
        {/* the five masters, then «Як записатися» right under their cards — the card button lands on
            the channels (owner 08.11); the address and the map follow */}
        <Masters locale={locale}>
          <BookingChannels locale={locale} as='panel' />
        </Masters>
        <Location locale={locale} variant='salon' booking={false} />
        {/* first-screen tiles open their direction's prices here (Daryna 03.11) */}
        <ServiceSheet
          sheets={sheets}
          book={{ label: t(W.book, locale), href: '#booking' }}
          closeLabel={t(sheetClose, locale)}
        />
      </main>
      <Footer variant='site' locale={locale} />
    </>
  );
}
