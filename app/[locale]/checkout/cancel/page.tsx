import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthShell } from '@/components/AuthShell/AuthShell';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { courseDetails } from '@/lib/content/courses';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ course?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const tk = await getTranslations('checkout');
  return { title: tk('cancelHeading'), robots: { index: false } };
}

/** `/checkout/cancel` — Status_Message: nothing charged, back to the course. */
export default async function CheckoutCancelPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { course } = await searchParams;
  setRequestLocale(locale);
  const tk = await getTranslations('checkout');
  const known = courseDetails.some((c) => c.slug === course);

  return (
    <AuthShell
      locale={locale}
      heading={tk('cancelHeading')}
      sub={tk('cancelBody')}
    >
      <Link
        className='btn hv-btn-glow'
        href={known ? `/courses/${course}` : '/courses#catalog'}
      >
        {tk('backToCourse')}
      </Link>
    </AuthShell>
  );
}
