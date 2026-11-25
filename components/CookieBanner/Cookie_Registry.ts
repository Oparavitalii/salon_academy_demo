import type { Localized } from '@/i18n/routing';

/**
 * The DECLARED cookie list — what the settings modal discloses (name · provider ·
 * purpose · duration). Never built from `document.cookie`: a category has to be
 * disclosed BEFORE consent, when none of its cookies exist yet.
 *
 * One list, two copies: this file and section 10 of
 * `docs/10_Legal/Privacy_Policy_PL.md` / `_UK.md`. Change one, change both.
 * After the production cookie audit, keep only what the site really sets.
 *
 * Four categories are shown: necessary, functional (Google Maps on /contacts
 * and /salon — added 20.10.2026, CONSENT_VERSION 2), analytics and marketing
 * (Google Ads, Meta Pixel — added 27.10.2026, CONSENT_VERSION 3, policy §2.7,
 * §3.14, §10). A new category = new entry here + policy update +
 * CONSENT_VERSION bump in `Use_Cookie_Consent.ts` and `lib/content/map.ts`.
 *
 * Marketing rows carry NO cookie names and NO durations (10.0_Legal.md → «Оновлення
 * банера під рекламні теги», step 8): names and lifetimes enter this file only from
 * the production audit (CC1–CC5) after the tags run with real ids — until then a row
 * shows the provider and the purpose only (`name` / `duration` left out).
 *
 * Google Maps is «functional», not «marketing»: the visitor asks for the map
 * (a feature of the site), it is not used to advertise to them. Without this
 * consent the map still loads on an explicit click on «Показати мапу»
 * (`components/MapEmbed`) — that click is the visitor's own request.
 *
 * Cloudflare `__cf_bm` removed 22.10.2026: DNS is at SEOHOST, traffic goes straight
 * to Fly (Decisions.md 20.10.2026). Return it only if Cloudflare ever fronts the site.
 * The production audit (Phase 12, CC1–CC5) re-checks every name and duration here
 * and in policy §10; open audit items live in 10.0_Legal.md, not in visible strings.
 * One marker remains (Bunny player storage, unknown): Phase 11 greps this folder for
 * `[[` and must not ship it visible — hide that row until the audit names it.
 */

export type ConsentCategory =
  | 'necessary'
  | 'functional'
  | 'analytics'
  | 'marketing';

export type CookieEntry = {
  /** Literal name as it appears in DevTools. Left out = not audited yet (marketing). */
  name?: string;
  provider: string;
  /** null = first party (the site itself) or no link chosen — see 10.0_Legal.md. */
  policyUrl: string | null;
  purpose: Localized;
  /** Left out = not audited yet (marketing) — the row shows no lifetime. */
  duration?: Localized;
};

/** localStorage key that holds the visitor's choice. Named in policy §10. */
export const CONSENT_KEY = 'demo_cookie_consent';

/** PostHog project key (public — it ships in the client bundle). */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';

/** PostHog stores its id under this exact name, as a cookie AND in localStorage. */
export const POSTHOG_STORAGE_KEY = `ph_${POSTHOG_KEY}_posthog`;

/** Written by posthog `opt_out_capturing()` on withdrawal; purged with the rest. */
export const POSTHOG_OPT_OUT_KEY = `__ph_opt_in_out_${POSTHOG_KEY}`;

/**
 * Marketing tag ids (public — they ship in the client bundle). Never invented and never
 * written into a document: they come from the Fly env only. Empty id → that tag does not
 * load; all empty → the «marketing» category is shown and loads nothing.
 * - Google Ads conversion id, format `AW-…`.
 * - Conversion label — for a conversion event once Q-45 decides one; read by nothing yet.
 * - Meta Pixel id.
 */
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '';
export const GOOGLE_ADS_CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL ?? '';
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

/**
 * First-party marketing storage the site can and must erase on withdrawal (policy §10).
 * Cookies by pattern (`_gcl_au`, `_gcl_aw` and the other `_gcl_*` of Google Ads; `_fbp`,
 * `_fbc` of Meta Pixel); localStorage by EXACT key — the store is shared with the origin.
 * `IDE` (doubleclick.net) and `fr` (facebook.com) sit on foreign domains: not erasable here.
 */
export const MARKETING_COOKIE = /^(_gcl_[a-z]+|_fbp|_fbc)$/;
export const TRACKING_STORAGE_KEYS = {
  marketing: ['lastExternalReferrer', 'lastExternalReferrerTime'],
} as const;

const SITE = 'Studio Demo';

const session: Localized = {
  pl: 'sesja',
  uk: 'сесія',
  en: 'session',
};

export const COOKIE_REGISTRY: Record<ConsentCategory, CookieEntry[]> = {
  necessary: [
    {
      name: '__Secure-authjs.session-token',
      provider: SITE,
      policyUrl: null,
      purpose: {
        pl: 'Utrzymuje zalogowanie do konta.',
        uk: 'Підтримує вхід в акаунт.',
        en: 'Keeps you signed in to your account.',
      },
      // auth.config.ts: JWT strategy without maxAge → Auth.js default, 30 days.
      duration: {
        pl: 'do 30 dni',
        uk: 'до 30 днів',
        en: 'up to 30 days',
      },
    },
    {
      name: '__Host-authjs.csrf-token',
      provider: SITE,
      policyUrl: null,
      purpose: {
        pl: 'Chroni formularz logowania przed atakami CSRF.',
        uk: 'Захищає форму входу від атак CSRF.',
        en: 'Protects the sign-in form against CSRF attacks.',
      },
      duration: session,
    },
    {
      name: '__Secure-authjs.callback-url',
      provider: SITE,
      policyUrl: null,
      purpose: {
        pl: 'Wraca na właściwą stronę po zalogowaniu.',
        uk: 'Повертає на потрібну сторінку після входу.',
        en: 'Returns you to the right page after sign-in.',
      },
      duration: session,
    },
    {
      name: `${CONSENT_KEY} (localStorage)`,
      provider: SITE,
      policyUrl: null,
      purpose: {
        pl: 'Zapamiętuje Twój wybór w tym banerze.',
        uk: 'Запам’ятовує Ваш вибір у цьому банері.',
        en: 'Remembers your choice in this banner.',
      },
      duration: {
        pl: 'wybór ważny 180 dni',
        uk: 'вибір дійсний 180 днів',
        en: 'choice valid for 180 days',
      },
    },
    {
      name: 'NEXT_LOCALE',
      provider: SITE,
      policyUrl: null,
      purpose: {
        pl: 'Zapamiętuje język strony (po zmianie języka albo gdy różni się od języka przeglądarki).',
        uk: 'Запам’ятовує мову сторінки (після зміни мови або коли вона відрізняється від мови браузера).',
        en: 'Remembers the page language (after you switch it, or when it differs from your browser language).',
      },
      duration: session,
    },
    {
      // Cabinet only. Mirrors the policy row «dane odtwarzacza wideo».
      name: '[[DO POTWIERDZENIA: czy odtwarzacz Bunny Stream zapisuje dane na urządzeniu i jakie]]',
      provider: 'BunnyWay d.o.o. (Bunny Stream)',
      policyUrl: null, // link not verified — add after the audit if wanted
      purpose: {
        pl: 'Odtwarzanie lekcji wideo w panelu kursu.',
        uk: 'Відтворення відеоуроків у кабінеті курсу.',
        en: 'Plays the video lessons in the course cabinet.',
      },
      duration: {
        pl: '[[DO POTWIERDZENIA: okres — po audycie]]',
        uk: '[[DO POTWIERDZENIA: okres — po audycie]]',
        en: '[[DO POTWIERDZENIA: okres — po audycie]]',
      },
    },
  ],
  functional: [
    {
      name: 'NID, AEC, SOCS',
      provider: 'Google Ireland Ltd (Google Maps)',
      policyUrl: 'https://policies.google.com/privacy',
      purpose: {
        pl: 'Mapa Google na stronach /contacts i /salon. Ładuje się dopiero po kliknięciu «Pokaż mapę» albo po tej zgodzie; Google otrzymuje adres IP.',
        uk: 'Мапа Google на сторінках /contacts і /salon. Завантажується лише після натискання «Показати мапу» або після цієї згоди; Google отримує IP-адресу.',
        en: 'The Google map on /contacts and /salon. It loads only after a click on “Show map” or after this consent; Google receives the IP address.',
      },
      duration: {
        pl: 'do 6 miesięcy (NID), według polityki Google',
        uk: 'до 6 місяців (NID), за політикою Google',
        en: 'up to 6 months (NID), per Google’s policy',
      },
    },
    {
      name: 'demo_map_shown (sessionStorage)',
      provider: SITE,
      policyUrl: null,
      purpose: {
        pl: 'Zapamiętuje, że w tej karcie kliknięto «Pokaż mapę», żeby nie pytać na każdej stronie.',
        uk: 'Запам’ятовує, що в цій вкладці Ви натиснули «Показати мапу», щоб не питати на кожній сторінці.',
        en: 'Remembers that you clicked “Show map” in this tab, so it is not asked on every page.',
      },
      duration: session,
    },
  ],
  analytics: [
    {
      name: `${POSTHOG_STORAGE_KEY} (cookie + localStorage)`,
      provider: 'PostHog Cloud EU',
      policyUrl: 'https://posthog.com/privacy',
      purpose: {
        pl: 'Pseudonimowy identyfikator do map kliknięć, przewijania i nagrań sesji. Pola formularzy są maskowane.',
        uk: 'Псевдонімний ідентифікатор для теплових карт кліків, прокручування і записів сесій. Поля форм маскуються.',
        en: 'Pseudonymous id for click and scroll heatmaps and session recordings. Form fields are masked.',
      },
      duration: {
        pl: 'do 180 dni',
        uk: 'до 180 днів',
        en: 'up to 180 days',
      },
    },
  ],
  // Provider + purpose only, no names, no durations — until the audit (see header).
  marketing: [
    {
      provider: 'Google Ireland Ltd (Google Ads)',
      policyUrl: 'https://policies.google.com/privacy',
      purpose: {
        pl: 'Pomiar konwersji i remarketing: czy reklamy w Google prowadzą do odwiedzin Serwisu i zamówień, oraz reklamy Akademii i salonu dla osób, które odwiedziły Serwis.',
        uk: 'Вимірювання конверсій і ремаркетинг: чи приводить реклама в Google до відвідування Сайту й замовлень, а також реклама Академії й салону для осіб, які відвідали Сайт.',
        en: 'Conversion measurement and remarketing: whether ads on Google lead to site visits and orders, and ads for the Academy and the salon shown to people who visited the site.',
      },
    },
    {
      provider: 'Meta Platforms Ireland Ltd (Meta Pixel)',
      policyUrl: 'https://www.facebook.com/privacy/policy/',
      purpose: {
        pl: 'Pomiar skuteczności reklam na Facebooku i Instagramie oraz remarketing: reklamy Akademii i salonu dla osób, które odwiedziły Serwis.',
        uk: 'Вимірювання ефективності реклами у Facebook та Instagram і ремаркетинг: реклама Академії й салону для осіб, які відвідали Сайт.',
        en: 'Ad measurement on Facebook and Instagram and remarketing: ads for the Academy and the salon shown to people who visited the site.',
      },
    },
  ],
};
