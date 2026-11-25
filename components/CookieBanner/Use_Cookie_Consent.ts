'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import {
  CONSENT_KEY,
  MARKETING_COOKIE,
  POSTHOG_OPT_OUT_KEY,
  POSTHOG_STORAGE_KEY,
  TRACKING_STORAGE_KEYS,
} from './Cookie_Registry';
import {
  hasLiveAnalytics,
  stopAnalytics,
  syncAnalytics,
} from './Load_Analytics';
import {
  hasLiveMarketing,
  signalConsent,
  syncMarketing,
} from './Load_Marketing';

/**
 * Consent state for the React mode of `Web_Cookie_Consent_Banner`, cut down to
 * this site: four categories (necessary, functional = Google Maps, analytics =
 * PostHog, marketing = Google Ads + Meta Pixel in Basic consent mode,
 * `Load_Marketing.ts`). Version 2 (20.10.2026) added «functional», version 3
 * (27.10.2026) added «marketing»: an older record no longer counts, the banner
 * asks again.
 *
 * Kept from the template, on purpose:
 * - the record carries `version` and `timestamp`; older than 180 days or
 *   another version = no answer, the banner asks again;
 * - three states: undefined (not read / storage blocked → no banner, nothing
 *   loads), null (no answer → ask), object (an answer that counts);
 * - withdraw() ERASES the record (art. 7(3) RODO) — the next visit asks again;
 * - a withdrawal in another tab reaches this tab through the `storage` event;
 * - storage is never read during render: the server snapshot keeps hydration
 *   identical for SSG pages.
 */

export const CONSENT_VERSION = '3';
export const CONSENT_MAX_AGE_DAYS = 180;
const CHANGED_EVENT = 'demo:cookie-consent-changed';
export const OPEN_SETTINGS_EVENT = 'demo:cookie-open-settings';

/** `functional` is read by `components/MapEmbed` (same key, same version). */
export type Consent = {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};
type StoredConsent = Consent & {
  necessary: true;
  version: string;
  timestamp: string;
};

const DENY_ALL: Consent = {
  analytics: false,
  functional: false,
  marketing: false,
};
const ACCEPT_ALL: Consent = {
  analytics: true,
  functional: true,
  marketing: true,
};
/** MapEmbed's «clicked in this tab» flag — dropped on withdrawal. */
const MAP_SESSION_KEY = 'demo_map_shown';

// ── Storage snapshot ────────────────────────────────────────────────────
// useSyncExternalStore needs a stable value, so the snapshot is the raw string.
const SERVER = '__server__';
const UNAVAILABLE = '__unavailable__';

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_KEY);
  } catch {
    return UNAVAILABLE;
  }
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY || e.key === null) onChange();
  };
  window.addEventListener(CHANGED_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGED_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

type Parsed = { answer: StoredConsent | null | undefined; stale: boolean };

function parse(raw: string | null): Parsed {
  if (raw === SERVER || raw === UNAVAILABLE) {
    return { answer: undefined, stale: false };
  }
  if (raw === null) return { answer: null, stale: false };
  try {
    const record = JSON.parse(raw) as Partial<StoredConsent>;
    if (record.version !== CONSENT_VERSION || !record.timestamp) {
      return { answer: null, stale: true };
    }
    const age = Date.now() - new Date(record.timestamp).getTime();
    // Written as «not fresh» so a corrupt timestamp (NaN) fails closed.
    if (!(age < CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)) {
      return { answer: null, stale: true };
    }
    return { answer: record as StoredConsent, stale: false };
  } catch {
    return { answer: null, stale: true };
  }
}

function notify(): void {
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

function write(consent: Consent): void {
  const record: StoredConsent = {
    analytics: consent.analytics,
    functional: consent.functional,
    marketing: consent.marketing,
    necessary: true,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    // Blocked store: the choice still applies to this page view.
  }
  apply(record);
  notify();
}

function erase(): void {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Nothing stored means nothing to remove.
  }
}

// ── Purge ───────────────────────────────────────────────────────────────
// Every domain a cookie of this page could carry, computed from the real host:
// host-only (''), then each level from the host itself up to the registrable
// domain, bare and dotted. `www.example.com` → '', www.example.com,
// .www.example.com, example.com, .example.com (the widest — where
// Google Ads and Meta put `_gcl_*` / `_fbp`). The www prefix is never stripped.
function cookieDomains(host: string): string[] {
  const labels = host.split('.');
  const domains = [''];
  for (let i = 0; i <= labels.length - 2; i += 1) {
    const domain = labels.slice(i).join('.');
    domains.push(domain, `.${domain}`);
  }
  return domains;
}

function expireCookies(match: RegExp): void {
  const past = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0]?.trim() ?? '')
    .filter((name) => match.test(name));
  for (const name of names) {
    for (const d of cookieDomains(window.location.hostname)) {
      document.cookie =
        `${name}=; expires=${past}; path=/` + (d ? `; domain=${d}` : '');
    }
  }
}

/** PostHog names its cookie `ph_<project key>_posthog`. */
const ANALYTICS_COOKIE = /^(ph_.+_posthog|__ph_opt_in_out_.+)$/;

function purgeAnalytics(): void {
  expireCookies(ANALYTICS_COOKIE);
  // Same id in localStorage — art. 399 PKE covers any storage on the device.
  // Exact key, never a prefix: this storage is shared with the whole origin.
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      store.removeItem(POSTHOG_STORAGE_KEY);
      store.removeItem(POSTHOG_OPT_OUT_KEY);
      // Session / window ids in sessionStorage: add their exact names after
      // the production audit (posthog-js is not installed yet).
    } catch {
      // Blocked storage — nothing was written there either.
    }
  }
}

/**
 * Google Ads `_gcl_*`, Meta `_fbp` / `_fbc` on every domain level, and the Pixel's
 * referrer pair in localStorage (exact keys). `IDE` / `fr` live on Google's and
 * Meta's domains — this origin cannot reach them (policy §10 says so).
 */
function purgeMarketing(): void {
  expireCookies(MARKETING_COOKIE);
  try {
    for (const key of TRACKING_STORAGE_KEYS.marketing) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Blocked storage — nothing was written there either.
  }
}

// ── Apply ───────────────────────────────────────────────────────────────
let lastApplied: string | null = null;
let reloadScheduled = false;

function scheduleReload(): void {
  if (reloadScheduled) return;
  reloadScheduled = true;
  window.setTimeout(() => window.location.reload(), 200);
}

/**
 * Idempotent per answer: the same answer is never applied twice (pitfall #27) —
 * so the Consent Mode update and the `cookie_consent_update` event go out once
 * per answer. `functional` needs no loader: MapEmbed listens to CHANGED_EVENT.
 * Order on a grant: signals first, then the tags, so gtag.js reads «granted».
 * «No answer yet» (DENY_ALL, no timestamp) sends no signal — the <head> default
 * already says «denied»; only a stored answer or a withdrawal (`announce`) does.
 */
function apply(
  answer: Consent & { timestamp?: string },
  announce = Boolean(answer.timestamp),
): void {
  const key = [
    answer.analytics,
    answer.functional,
    answer.marketing,
    answer.timestamp ?? '',
  ].join('|');
  if (key === lastApplied) return;
  lastApplied = key;

  if (!answer.analytics) stopAnalytics();
  if (announce) signalConsent(answer);
  syncAnalytics(answer.analytics);
  syncMarketing(answer.marketing);
  if (!answer.analytics) purgeAnalytics();
  if (!answer.marketing) purgeMarketing();
  // A running SDK cannot be un-run; only a fresh document is clean.
  if (
    (!answer.analytics && hasLiveAnalytics()) ||
    (!answer.marketing && hasLiveMarketing())
  ) {
    scheduleReload();
  }
}

// ── Hook ────────────────────────────────────────────────────────────────
export function useCookieConsent() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => SERVER);
  const { answer, stale } = useMemo(() => parse(raw), [raw]);

  // A stale record (expired or older version) is no decision: drop it and
  // purge what it allowed. No reload — nothing was loaded on its basis.
  useEffect(() => {
    if (!stale) return;
    erase();
    purgeAnalytics();
    purgeMarketing();
    notify();
  }, [stale]);

  // Re-apply on load and on every change, including «no answer» after a
  // withdrawal in another tab. `undefined` = not read yet → do nothing.
  useEffect(() => {
    if (answer === undefined) return;
    apply(answer ?? DENY_ALL);
  }, [answer]);

  const acceptAll = useCallback(() => write(ACCEPT_ALL), []);
  const rejectAll = useCallback(() => write(DENY_ALL), []);
  const save = useCallback((consent: Consent) => write(consent), []);

  const withdraw = useCallback(() => {
    apply(DENY_ALL, true);
    // Not redundant: apply() is a no-op if DENY_ALL ran already.
    purgeAnalytics();
    purgeMarketing();
    erase();
    // Google's own cookies sit on google.com — this origin cannot delete them
    // (policy §10 says so); we drop our flag so the map is gated again.
    try {
      window.sessionStorage.removeItem(MAP_SESSION_KEY);
    } catch {
      // Blocked storage — nothing was written there either.
    }
    notify();
  }, []);

  return {
    /** undefined = unknown yet · null = no answer · object = answer that counts */
    stored: answer,
    // D-05: also on the server and during hydration (raw = SERVER), so the banner is in the HTML and
    // paints with the page; `html.cc-known` (Consent_Known_Script) hides it pre-paint for a stored answer.
    showBanner: answer === null || raw === SERVER,
    acceptAll,
    rejectAll,
    save,
    withdraw,
  };
}

/** For the footer link: opens the settings modal from anywhere. */
export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
