import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { splitDocument } from '@/components/Markdown/Markdown';
import { PolicyText } from '@/components/PolicyText/PolicyText';
import type { Locale } from '@/i18n/routing';
import { loadPolicy } from '@/lib/content/legal';
import type { Theme } from '@/lib/theme';

import { pageMeta } from '../_lib/meta';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: light). */
const theme: Theme = 'light';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  // Draft with visible lawyer markers (9.0_Legal.md) — keep it out of search until they are 0.
  const meta = await pageMeta(locale, 'privacy', '/privacy', {
    robots: { index: false },
  });
  if (locale !== 'pl') return meta;
  // /pl renders the Polish (binding) text: title + description come from that document's own
  // `# ` line («Polityka prywatności – …»), not from the Ukrainian messages (blind R-16, 16.10).
  const { title } = splitDocument(loadPolicy('pl').markdown);
  return { ...meta, title, description: title };
}

/**
 * `/privacy` — Політика конфіденційності (R-16). Content17, static (SSG): the markdown is read
 * from `content/legal/` at build time. No cookie banner, no PostHog (9.0_Legal.md → Handoff).
 */
export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header variant='site' theme={theme} locale={locale} />
      <main data-theme={theme}>
        <PolicyText locale={locale} />
      </main>
      <Footer variant='site' locale={locale} />
    </>
  );
}
