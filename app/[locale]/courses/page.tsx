import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { CourseCatalog } from '@/components/CourseCatalog/CourseCatalog';
import { Tape } from '@/components/Decorations/Tape';
import { Faq } from '@/components/Faq/Faq';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { HeroVideo } from '@/components/HeroVideo/HeroVideo';
import { PlatformBenefits } from '@/components/PlatformBenefits/PlatformBenefits';
import { SuccessStories } from '@/components/SuccessStories/SuccessStories';
import type { Locale } from '@/i18n/routing';
import { coursesTapeWords } from '@/lib/content/courses';
import { academyFaq } from '@/lib/content/faq';
import { storiesCopy } from '@/lib/content/stories';
import { getCourseView } from '@/lib/courses/public';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

import { pageMeta } from '../_lib/meta';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = { params: Promise<{ locale: Locale }> };

/** ISR: course status comes from /admin/courses (which also revalidates on save). */
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, 'courses', '/courses');
}

/**
 * `/courses` — 5 blocks (5.0_Sitemap 22.10): HeroVideo (31.10, academy video) →
 * `.dec_tape` → PlatformBenefits (international certificate first, FR-26) → CourseCatalog
 * `#catalog` (intensive first; no prices — Q-02, B-89) → SuccessStories (E-42)
 * → Faq `#faq` (FR-25). `/faq` 308s to `#faq` here (next.config.ts). Copy: 9_Text.md round 4.
 */
export default async function CoursesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const view = await getCourseView();

  return (
    <>
      <Header variant='site' theme={theme} locale={locale} active='/courses' />
      <main data-theme={theme} data-area='academy'>
        {/* first screen = the home one (owner 31.10); SignatureHero stays for other pages */}
        <HeroVideo locale={locale} area='academy' available={view.available} />
        <Tape words={coursesTapeWords.map((w) => t(w, locale))} />
        <PlatformBenefits locale={locale} />
        <CourseCatalog locale={locale} view={view} />
        <SuccessStories
          locale={locale}
          cta={{ label: storiesCopy.ctaCourses, href: '#catalog' }}
        />
        <Faq locale={locale} data={academyFaq} surface='sec_surface' />
      </main>
      <Footer variant='site' locale={locale} />
    </>
  );
}
