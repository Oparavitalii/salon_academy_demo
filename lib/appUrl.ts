/** Public base URL for e-mails and Stripe return links (no trailing slash). */
export function appUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    'http://localhost:3000'
  ).replace(/\/+$/, '');
}

/**
 * Public site origin for SEO (metadataBase, canonical, hreflang, sitemap, robots) — no trailing
 * slash. Baked in at build time: the Fly Docker build has no secrets, so the fallback is the real
 * production domain, never localhost (B-33). APP_URL is not used here: locally it is localhost.
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com').replace(
    /\/+$/,
    '',
  );
}
