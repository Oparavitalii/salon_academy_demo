import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Audience } from '@/components/Audience/Audience';
import { Author } from '@/components/Author/Author';
import { Faq } from '@/components/Faq/Faq';
import { FinalCta } from '@/components/FinalCta/FinalCta';
import { Footer } from '@/components/Footer/Footer';
import { Gallery } from '@/components/Gallery/Gallery';
import { Header } from '@/components/Header/Header';
import { HeroCourse } from '@/components/HeroCourse/HeroCourse';
import { Inclusions } from '@/components/Inclusions/Inclusions';
import { PriceCard } from '@/components/PriceCard/PriceCard';
import { Program } from '@/components/Program/Program';
import { routing, type Locale } from '@/i18n/routing';
import {
  coursePageSlugs,
  getCourseDetail,
  mentoringCourse,
} from '@/lib/content/courses';
import { sitePrice } from '@/lib/courses/price';
import { getPublicCourses } from '@/lib/courses/public';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

import { Mentoring_Page } from './Mentoring_Page';
import { alternatesFor, socialMeta } from '../../_lib/meta';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

/** ISR — kept for the day prices return from /admin/courses (Q-02); nothing priced renders now. */
export const revalidate = 300;

/**
 * One template (FR-22): two courses × online / intensive (owner 27.10), plus the personal mentoring
 * (Dana 16.11) on its own page. «Скоро» cards have no page.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    coursePageSlugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const course =
    getCourseDetail(slug) ??
    (slug === mentoringCourse.slug ? mentoringCourse : null);
  if (!course) return {};
  const title = t(course.metaTitle, locale);
  const description = t(course.metaDescription, locale);
  return {
    title,
    description,
    alternates: alternatesFor(locale, `/courses/${slug}`),
    ...socialMeta(locale, `/courses/${slug}`, title, description, 'courses'),
  };
}

/**
 * `/courses/[slug]` — one template, two pages (5.0_Sitemap 22.10, Oksana's copy 20.10):
 * online — HeroCourse → Audience → Program `#program` (16 rows, `.dec_rows`, `.ix-dim`) →
 * Inclusions → Author (ghost «20+») → [Tiers hidden — Q-02, Q-10] → CourseGallery (polaroids) →
 * Faq `#faq` → FinalCta; intensive — HeroCourse → Audience → Program Day 1 / Day 2 (FR-27) →
 * Inclusions (six items) → Author → PriceCard `#price` (booking channels, no price) →
 * CourseGallery → Faq → FinalCta. Online buttons → Direct @studio.demo.academy (B-89); no `#tiers` anchor.
 */
export default async function CoursePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  // Personal mentoring (Dana 16.11): one format, two prices, her own text — its own page.
  if (slug === mentoringCourse.slug) {
    const tm = await getTranslations('legal');
    return (
      <>
        <Header
          variant='site'
          theme={theme}
          locale={locale}
          active='/courses'
        />
        <main data-theme={theme} data-area='academy'>
          <Mentoring_Page locale={locale} privacyLabel={tm('privacy')} />
        </main>
        <Footer variant='site' locale={locale} />
      </>
    );
  }
  const base = getCourseDetail(slug);
  if (!base) notFound();
  // The admin's euro price (/admin/prices) replaces the price in code everywhere on the page.
  const priceEur = (await getPublicCourses()).find(
    (c) => c.slug === slug,
  )?.priceEur;
  const course = priceEur
    ? {
        ...base,
        price: sitePrice(base.price, priceEur),
        priceCard: base.priceCard && {
          ...base.priceCard,
          price: sitePrice(base.priceCard.price, priceEur),
        },
      }
    : base;
  const tl = await getTranslations('legal');

  return (
    <>
      <Header variant='site' theme={theme} locale={locale} active='/courses' />
      <main data-theme={theme} data-area='academy'>
        <HeroCourse locale={locale} course={course} />
        <Audience locale={locale} course={course} />
        <Program locale={locale} course={course} />
        <Inclusions
          locale={locale}
          course={course}
          ctaLabel={
            course.priceCard ? t(course.priceCard.cta, locale) : undefined
          }
        />
        <Author locale={locale} course={course} />
        {course.priceCard && (
          <PriceCard locale={locale} copy={course.priceCard} />
        )}
        <Gallery locale={locale} course={course} />
        <Faq locale={locale} data={course.faq} surface='sec_surface' />
        <FinalCta
          locale={locale}
          course={course}
          privacyLabel={tl('privacy')}
        />
      </main>
      <Footer variant='site' locale={locale} />
    </>
  );
}
