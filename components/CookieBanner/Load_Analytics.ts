import { POSTHOG_KEY } from './Cookie_Registry';

/**
 * Prior blocking for PostHog: nothing is fetched or stored before the visitor
 * grants «analytics». Google Ads and Meta Pixel (category «marketing») have their
 * own loader with Consent Mode v2: `Load_Marketing.ts`.
 *
 * The posthog-js import is INJECTED, not written here: `docs/` is inside the
 * project tsconfig, and an import of a package that is not installed yet would
 * break `next build`. Phase 11 installs `posthog-js` and calls once, in a client
 * component:
 *
 *   setPostHogLoader(() => import('posthog-js').then((m) => m.default));
 */

export type PostHogLike = {
  init: (key: string, options: Record<string, unknown>) => unknown;
  opt_out_capturing: () => void;
};

type Loader = () => Promise<PostHogLike>;

let loader: Loader | null = null;
let instance: PostHogLike | null = null;
let loading: Promise<void> | null = null;

export function setPostHogLoader(fn: Loader): void {
  loader = fn;
  // The consent may have been applied before the loader arrived — load now.
  if (granted) syncAnalytics(true);
}

/** Withdrawal: stop sending at once, before the purge and the reload. */
export function stopAnalytics(): void {
  granted = false;
  instance?.opt_out_capturing();
}

/**
 * Options checked against policy §2.7 and §10. Phase 11 re-checks the names
 * against the installed posthog-js version.
 * - EU host: data stays in PostHog Cloud EU.
 * - 180 days: the same lifetime the policy and the banner promise.
 * - inputs masked: passwords and e-mails never reach a recording (§2.7).
 */
const POSTHOG_OPTIONS: Record<string, unknown> = {
  api_host: 'https://eu.i.posthog.com',
  persistence: 'localStorage+cookie',
  cookie_expiration: 180,
  session_recording: { maskAllInputs: true },
  capture_pageview: true,
  // No unload event: it would rewrite the id after a withdrawal purged it,
  // in the 200 ms before the reload. Audit CC4 compares the values.
  capture_pageleave: false,
  autocapture: true,
};

/** True while PostHog runs (or is loading) in this page view — decides the reload on withdrawal. */
export function hasLiveAnalytics(): boolean {
  return instance !== null || loading !== null;
}

/** Latest answer. A refusal that lands while the script is still loading wins. */
let granted = false;

export function syncAnalytics(analyticsGranted: boolean): void {
  if (typeof window === 'undefined') return;
  granted = analyticsGranted;
  if (!granted || instance || loading) return;
  if (!POSTHOG_KEY || !loader) return; // no key or no loader → nothing loads, by design

  loading = loader()
    .then((posthog) => {
      if (!granted) return;
      posthog.init(POSTHOG_KEY, POSTHOG_OPTIONS);
      instance = posthog;
    })
    .catch(() => {
      // A blocked script (ad blocker) is a refusal by other means. Nothing to undo.
    })
    .finally(() => {
      loading = null;
    });
}
