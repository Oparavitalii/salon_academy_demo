import type { Metadata } from 'next';
import {
  Cormorant_Garamond,
  Great_Vibes,
  Montserrat,
  Playfair_Display,
  Unbounded,
} from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { BottomBar } from '@/components/BottomBar/BottomBar';
import { CONSENT_KNOWN_SCRIPT } from '@/components/CookieBanner/Consent_Known_Script';
import { CookieBanner } from '@/components/CookieBanner/Cookie_Banner';
import { CONSENT_DEFAULT_SCRIPT } from '@/components/CookieBanner/Load_Marketing';
import { Decorations } from '@/components/Decorations/Decorations';
import { FxKit } from '@/components/Fx/FxKit';
import { Lightbox } from '@/components/Fx/Lightbox';
import { Interactions } from '@/components/Interactions/Interactions';
import { LanguagePill } from '@/components/LanguageSwitcher/LanguagePill';
import { AutoReveal } from '@/components/Motion/AutoReveal';
import { type Locale, routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/appUrl';

import '../globals.css';

// Phase 7 fonts (7.0_Ui-Kit §2, §10 · 4.3 Fonts — the only two files that name a family).
// Unbounded = display (300 hero · 700 heads), Montserrat = text (400 · 500 · 600; was Onest), Playfair Display italic =
// the one accent word and prices (500 · 600). Cyrillic + latin-ext cover uk/ru/pl (Fonts_Check 22.10).
// Exposed on --font-unbounded / --font-montserrat / --font-playfair; globals.css maps them onto
// --font-secondary / --font-primary / --font-accent.
// D-05 (fix round 22.10): `subsets` in next/font only picks which files are PRELOADED — every subset
// (latin, cyrillic, latin-ext) is still served through unicode-range, so pl text keeps its glyphs.
// Preloaded: latin + cyrillic for the display and text faces (uk/ru/en first screens), latin only
// for the accent face (its one word on / is Latin). The latin-ext files load when a page uses them.
const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '700'],
  variable: '--font-unbounded',
  display: 'swap',
});

// Base face = Montserrat (agreed with the client's SMM, Oksana 28.10 19:19 «Основний шрифт Монтсерат,
// який вже узгоджений»): all running text, UI, captions, quotes, prices. Was Onest.
const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'], // normal: the SignatureHero wordmark (Oksana «Вариант 1», 28.10)
  variable: '--font-playfair',
  display: 'swap',
});

// Script face — decorative spots only (owner 28.10: «декоративний шрифт хай буде»): the home hero line
// «ваш б'юті простір», master monograms, an accent word in a heading. Never captions, reviews, quotes or
// running text (Daryna 28.10: script there «аж очі болять») — those use the base face (refine.css).
const greatVibes = Great_Vibes({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
  variable: '--font-greatvibes',
  display: 'swap',
});

// Heading face of the Instagram skin (owner 31.10.2026, skin_insta.css): the thin high-contrast serif caps of
// the studio's own Instagram slides. With Montserrat it is the skin's whole type system — two faces.
const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

// Skin switch (owner 31.10.2026): the Instagram skin is the default; `?skin=classic` brings back the dark
// design for this browser (stored), `?skin=new` returns. Runs before first paint, so there is no flash.
const SKIN_SCRIPT =
  "try{var q=new URLSearchParams(location.search).get('skin');if(q==='classic'||q==='new')localStorage.setItem('demo_skin',q);if(localStorage.getItem('demo_skin')==='classic')document.documentElement.classList.add('skin_classic')}catch(e){}";

export const metadata: Metadata = {
  // B-33: absolute URLs (canonical, hreflang, OG) resolve against the production origin.
  metadataBase: new URL(siteUrl()),
  title: 'Studio Demo',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// This is the ROOT layout: the <html lang> must be the locale, so the html/body
// shell lives here and there is no app/layout.tsx (recorded in 10.0_Coding.md).
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const th = await getTranslations({ locale, namespace: 'header' });

  return (
    <html
      lang={locale}
      className={`${unbounded.variable} ${montserrat.variable} ${playfair.variable} ${greatVibes.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Google Consent Mode v2 default — FIRST in <head>, before any Google tag (10.0_Legal.md
            step 3): every storage denied, wait_for_update 500, sets window.__ccbConsentDefault.
            The tags themselves load only after «marketing» consent (Load_Marketing.ts, Basic mode). */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />
        {/* Before first paint (7.0 §5): `rv-js` gates the hidden .reveal state (library.css), `js`
            the older guard (globals.css). Without JS neither is set and every .reveal is visible. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js','rv-js')",
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: SKIN_SCRIPT }} />
        {/* D-05: hide the server-rendered cookie banner before paint when an answer is stored. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_KNOWN_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider>
          {children}
          <Interactions />
          <AutoReveal />
          <Decorations />
          <FxKit />
          <Lightbox />
          {/* Phase-10 consent banner v3 (B-22, FR-19): layer 1 + settings. Analytics stay off — there is
              no PostHog key and no loader in this build, so nothing loads even after consent.
              Marketing tags load after consent only when NEXT_PUBLIC_GOOGLE_ADS_ID /
              NEXT_PUBLIC_META_PIXEL_ID are set; empty → nothing loads. */}
          <CookieBanner locale={locale as Locale} />
          {/* Floating language pill, bottom-right (owner 27.10) — replaces the header language row. */}
          <LanguagePill label={th('langLabel')} />
          {/* Phone bottom bar: Салон | DEMO | Курси (owner 31.10.2026, A-01). */}
          <BottomBar locale={locale as Locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
