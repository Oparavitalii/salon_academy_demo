import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { AboutShort } from '@/components/AboutShort/AboutShort';
import { AboutVideo } from '@/components/AboutVideo/AboutVideo';
import { AcademyTeaser } from '@/components/AcademyTeaser/AcademyTeaser';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { HeroVideo } from '@/components/HeroVideo/HeroVideo';
import { SalonTeaser } from '@/components/SalonTeaser/SalonTeaser';
import { ServicesCarousel } from '@/components/ServicesCarousel/ServicesCarousel';
import { ServiceSheet } from '@/components/ServiceSheet/ServiceSheet';
import { Stats } from '@/components/Stats/Stats';
import { SuccessStories } from '@/components/SuccessStories/SuccessStories';
import { Testimonials } from '@/components/Testimonials/Testimonials';
import { WorksScroll } from '@/components/WorksScroll/WorksScroll';
import type { Locale } from '@/i18n/routing';
import { homeReviewsCopy as rc } from '@/lib/content/home';
import { priceWords } from '@/lib/content/salon';
import { storiesCopy } from '@/lib/content/stories';
import { getCourseView } from '@/lib/courses/public';
import { t } from '@/lib/i18n/t';
import { sheetClose } from '@/lib/services/directions';
import { getDirectionSheets } from '@/lib/services/directionSheets';
import type { Theme } from '@/lib/theme';

import { pageMeta } from './_lib/meta';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: mixed, the main element dark). */
const theme: Theme = 'dark';

/** ISR: the academy block reads course status from /admin/courses (which revalidates on save). */
export const revalidate = 300;

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, 'home', '');
}

/**
 * `/` — wireframe 21.10 (5.0_Sitemap 22.10, 6.0_Karkas 22.10): HeroVideo (31.10, was
 * HeroHome) → ServicesCarousel «SERVICES» → AboutVideo «ABOUT US» (both Daryna's Canva 03.11, built
 * 06.11; a tile or a card opens ServiceSheet with the direction's prices) → AboutShort →
 * Stats (signature, ghost «20+») → SalonTeaser `#salon` → Testimonials → AcademyTeaser `#academy`
 * (light, rounded top + `.ix-edge`) → SuccessStories (light; 3 graduate stories, E-42; StudentWorks stood here
 * until 27.10). Copy: 9_Text.md round 4. Footer dark with the torn edge above it.
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [view, sheets] = await Promise.all([
    getCourseView(),
    getDirectionSheets(locale),
  ]);

  return (
    <>
      <Header variant='site' theme={theme} locale={locale} />
      <main data-theme={theme}>
        {/* Daryna's first screen on every screen size (owner 31.10); it holds the page's one h1. */}
        <HeroVideo locale={locale} area='home' />
        <ServicesCarousel locale={locale} />
        <AboutVideo locale={locale} />
        <AboutShort locale={locale} />
        <Stats locale={locale} />
        <SalonTeaser locale={locale} />
        <WorksScroll locale={locale} />
        <Testimonials
          locale={locale}
          heading={rc.heading}
          sub={rc.sub}
          cta={{ label: rc.cta, href: '/salon' }}
          background={rc.background}
        />
        {/* owner 06.11: the whole home page dark (the academy pages stay light) */}
        <AcademyTeaser locale={locale} view={view} theme='dark' />
        <SuccessStories
          locale={locale}
          theme='dark'
          cta={{ label: storiesCopy.ctaHome, href: '/courses#catalog' }}
        />
        <ServiceSheet
          sheets={sheets}
          book={{ label: t(priceWords.book, locale), href: '/salon#booking' }}
          closeLabel={t(sheetClose, locale)}
        />
      </main>
      <Footer variant='site' locale={locale} />
    </>
  );
}
