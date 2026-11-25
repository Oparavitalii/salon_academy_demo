import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { AboutShort } from '@/components/AboutShort/AboutShort';
import { AcademyTeaser } from '@/components/AcademyTeaser/AcademyTeaser';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { HeroVideo } from '@/components/HeroVideo/HeroVideo';
import { SalonTeaser } from '@/components/SalonTeaser/SalonTeaser';
import { Stats } from '@/components/Stats/Stats';
import { SuccessStories } from '@/components/SuccessStories/SuccessStories';
import { Testimonials } from '@/components/Testimonials/Testimonials';
import type { Locale } from '@/i18n/routing';
import { homeReviewsCopy as rc } from '@/lib/content/home';
import { storiesCopy } from '@/lib/content/stories';
import { getCourseView } from '@/lib/courses/public';
import type { Theme } from '@/lib/theme';

import { pageMeta } from '../_lib/meta';

const theme: Theme = 'dark';

export const revalidate = 300;

type Props = { params: Promise<{ locale: Locale }> };

/** A review copy of the home page — never indexed, not in the sitemap or the menu. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    ...(await pageMeta(locale, 'home', '')),
    robots: { index: false, follow: false },
  };
}

/**
 * `/variant_video` (30.10.2026) — the home page with Daryna's mobile first screen (HeroVideo) for the
 * team to review on a phone. Since 31.10 the home page itself opens with it on every screen size, so
 * HeroHome is gone here too (one h1). Every block below the first screen is the live home page.
 */
export default async function VariantVideoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const view = await getCourseView();

  return (
    <>
      <Header variant='site' theme={theme} locale={locale} />
      <main data-theme={theme} className='variant_video'>
        <HeroVideo locale={locale} area='home' />
        <AboutShort locale={locale} />
        <Stats locale={locale} />
        <SalonTeaser locale={locale} />
        <Testimonials
          locale={locale}
          heading={rc.heading}
          sub={rc.sub}
          cta={{ label: rc.cta, href: '/salon' }}
          background={rc.background}
        />
        <AcademyTeaser locale={locale} view={view} theme='light' />
        <SuccessStories
          locale={locale}
          theme='light'
          cta={{ label: storiesCopy.ctaHome, href: '/courses#catalog' }}
        />
      </main>
      <Footer variant='site' locale={locale} />
    </>
  );
}
