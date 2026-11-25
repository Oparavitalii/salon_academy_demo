import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { AboutCta } from '@/components/AboutCta/AboutCta';
import { AcademyRecognition } from '@/components/AcademyRecognition/AcademyRecognition';
import { Footer } from '@/components/Footer/Footer';
import { FounderStory } from '@/components/FounderStory/FounderStory';
import { Header } from '@/components/Header/Header';
import { Masters } from '@/components/Masters/Masters';
import { Philosophy } from '@/components/Philosophy/Philosophy';
import { SignatureHero } from '@/components/SignatureHero/SignatureHero';
import { Stats } from '@/components/Stats/Stats';
import { StudioLife } from '@/components/StudioLife/StudioLife';
import type { Locale } from '@/i18n/routing';
import { aboutStatsImage, heroAboutCopy as h } from '@/lib/content/about';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

import { pageMeta } from '../_lib/meta';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: dark). */
const theme: Theme = 'dark';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, 'about', '/about');
}

/**
 * `/about` — 7 blocks in the order of Oksana's copy 20.10 (5.0_Sitemap 22.10): HeroAbout →
 * FounderStory (polaroid portrait, `.ix-fill` quote) → Masters (5 photo cards, shoot 03.11) →
 * StudioLife («Життя студії», 6 frames of the shoot — owner 08.11) → Philosophy (4 standards + BookingChannels `#booking`) →
 * AcademyRecognition (the strands divider between them is gone since 16.11 — client: no hair decoration) → Stats (repeat, ghost «20+») → FinalCta. Copy: 9_Text.md round 4.
 */
export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header variant='site' theme={theme} locale={locale} active='/about' />
      <main data-theme={theme}>
        <SignatureHero
          locale={locale}
          eyebrow={t(h.eyebrow, locale)}
          title={t(h.heading, locale)}
          sub={t(h.body, locale)}
          ctas={[
            { label: t(h.ctaSalon, locale), href: '/salon' },
            {
              label: t(h.ctaCourses, locale),
              href: '/courses',
              variant: 'outline',
            },
          ]}
          photo={h.images[0]}
          inset={h.images[1]}
        />
        <FounderStory locale={locale} />
        <Masters locale={locale} />
        <StudioLife locale={locale} />
        <Philosophy locale={locale} />
        <AcademyRecognition locale={locale} />
        <Stats
          locale={locale}
          withHeading
          image={aboutStatsImage}
          id='numbers'
        />
        <AboutCta locale={locale} />
      </main>
      <Footer variant='site' locale={locale} />
    </>
  );
}
