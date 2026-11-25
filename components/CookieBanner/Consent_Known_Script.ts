import {
  CONSENT_KEY,
  CONSENT_MAX_AGE_DAYS,
  CONSENT_VERSION,
} from '@/lib/content/map';

/**
 * D-05 (01.11.2026): the banner is server-rendered so it paints with the page — before, it appeared
 * only after hydration and was the phone LCP element (9–10 s under Lighthouse throttling).
 * This inline <head> script runs before first paint and marks `<html>` with `cc-known` when a valid
 * answer is stored (same version + age rules as `parse()` in Use_Cookie_Consent.ts), so a visitor
 * who already decided never sees the banner flash. Blocked storage → no class → the hook hides the
 * banner after hydration, as before.
 */
export const CONSENT_KNOWN_SCRIPT =
  'try{var r=localStorage.getItem(' +
  JSON.stringify(CONSENT_KEY) +
  ');if(r){var c=JSON.parse(r);' +
  'if(c&&c.version===' +
  JSON.stringify(CONSENT_VERSION) +
  '&&c.timestamp&&Date.now()-new Date(c.timestamp).getTime()<' +
  String(CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) +
  ")document.documentElement.classList.add('cc-known')}}catch(e){}";
