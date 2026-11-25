import { GOOGLE_ADS_ID, META_PIXEL_ID } from './Cookie_Registry';

/**
 * Marketing tags — Google Ads (gtag.js) and Meta Pixel (fbevents.js) — in Google's
 * BASIC consent mode (prior blocking, 10.0_Legal.md → «Оновлення банера під рекламні
 * теги», steps 3–6): nothing is fetched from Google or Meta before the visitor grants
 * «marketing». Same pattern as `Load_Analytics.ts`: injected, idempotent, the latest
 * answer wins. Advanced mode (tags loaded denied) would contradict policy §10 — only by
 * an owner decision.
 *
 * - Consent Mode v2 default: the inline <head> script `CONSENT_DEFAULT_SCRIPT` runs before
 *   any Google tag (`app/[locale]/layout.tsx`) and sets `window.__ccbConsentDefault`;
 *   `ensureConsentDefault()` sends the same default at runtime if that flag is missing
 *   (script stripped or moved) — building `dataLayer` and a CLASSIC `gtag` itself.
 * - No user data: `fbq('init', id)` with no e-mail / phone object; no Google Ads
 *   `user_data` / enhanced conversions (policy §2.7). No <noscript> pixel or iframe.
 * - Empty id → that tag never loads (ids: `Cookie_Registry.ts`, from the env only).
 */

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (this: unknown, ...args: unknown[]) => void;
  queue: unknown[];
  push: unknown;
  loaded: boolean;
  version: string;
};
type MarketingWindow = Window & {
  dataLayer?: unknown[];
  gtag?: Gtag;
  fbq?: Fbq;
  _fbq?: Fbq;
  __ccbConsentDefault?: boolean;
};

/** Every Consent Mode v2 storage denied until the visitor answers — grant nothing reflexively. */
const CONSENT_DEFAULT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'denied',
  wait_for_update: 500,
} as const;

/**
 * The inline <head> bootstrap. A classic `function gtag(){dataLayer.push(arguments);}` —
 * Google's tags read the pushed `arguments` object; an arrow pushing an array is dropped
 * silently.
 */
export const CONSENT_DEFAULT_SCRIPT =
  'window.dataLayer=window.dataLayer||[];' +
  'function gtag(){dataLayer.push(arguments);}' +
  `gtag('consent','default',${JSON.stringify(CONSENT_DEFAULT)});` +
  'window.__ccbConsentDefault=true;';

const win = () => window as MarketingWindow;

/** The runtime `gtag`: the page's own if the head script ran, else a classic shim. */
function gtag(...args: unknown[]): void {
  const w = win();
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== 'function') {
    const layer = w.dataLayer;
    w.gtag = function gtagShim() {
      // Classic function on purpose: gtag.js unpacks the `arguments` object itself.
      // eslint-disable-next-line prefer-rest-params
      layer.push(arguments);
    };
  }
  w.gtag(...args);
}

/** Runtime fallback for a missing <head> default — self-sufficient (skill pitfall #20). */
export function ensureConsentDefault(): void {
  if (typeof window === 'undefined') return;
  const w = win();
  if (w.__ccbConsentDefault) return;
  gtag('consent', 'default', { ...CONSENT_DEFAULT });
  w.__ccbConsentDefault = true;
}

export type MarketingConsent = {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

/**
 * Step 5 — the signals, sent on every applied answer (the caller, `apply()` in
 * `Use_Cookie_Consent.ts`, is idempotent per answer, so the dataLayer event fires once
 * per answer — skill pitfall #27). `fbq` exists only after the Pixel was loaded.
 */
export function signalConsent(consent: MarketingConsent): void {
  if (typeof window === 'undefined') return;
  ensureConsentDefault();
  const ads = consent.marketing ? 'granted' : 'denied';
  gtag('consent', 'update', {
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    analytics_storage: consent.analytics ? 'granted' : 'denied',
  });
  win().fbq?.('consent', consent.marketing ? 'grant' : 'revoke');
  win().dataLayer?.push({
    event: 'cookie_consent_update',
    cookie_analytics: consent.analytics,
    cookie_marketing: consent.marketing,
    cookie_functional: consent.functional,
  });
}

let googleLoaded = false;
let pixelLoaded = false;

/**
 * True once a marketing tag was injected in this page view — decides the reload on
 * withdrawal (an SDK in memory cannot be un-run; `fbq('consent','revoke')` from
 * `signalConsent()` stops the Pixel until the fresh document).
 */
export function hasLiveMarketing(): boolean {
  return googleLoaded || pixelLoaded;
}

/**
 * Step 4 — inject the tags only after `marketing: true`; idempotent per page view.
 * Injection is synchronous, so a later refusal has nothing to race against.
 */
export function syncMarketing(marketingGranted: boolean): void {
  if (typeof window === 'undefined' || !marketingGranted) return;
  loadGoogleAds();
  loadMetaPixel();
}

function loadGoogleAds(): void {
  if (googleLoaded || !GOOGLE_ADS_ID) return;
  googleLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_ID)}`;
  document.head.appendChild(s);
  gtag('js', new Date());
  // No `user_data`, no `allow_enhanced_conversions` — policy §2.7.
  gtag('config', GOOGLE_ADS_ID);
}

function loadMetaPixel(): void {
  if (pixelLoaded || !META_PIXEL_ID) return;
  pixelLoaded = true;
  const w = win();
  if (!w.fbq) {
    // Meta's base code, typed: calls made before fbevents.js arrives are queued as their
    // `arguments` objects and replayed by it — kept a classic function like `gtag`.
    const n = function fbq() {
      /* eslint-disable prefer-rest-params, prefer-spread */
      if (n.callMethod)
        n.callMethod.apply(n, arguments as unknown as unknown[]);
      else n.queue.push(arguments);
      /* eslint-enable prefer-rest-params, prefer-spread */
    } as Fbq;
    n.queue = [];
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  w.fbq('consent', 'grant');
  // No advanced matching object (e-mail, phone) — policy §2.7.
  w.fbq('init', META_PIXEL_ID);
  w.fbq('track', 'PageView');
}
