import { execFileSync } from 'node:child_process';

import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const LOCALES = 'uk|pl|en';

const nextConfig: NextConfig = {
  // Fly.io: a self-contained server in .next/standalone, so the Docker image ships no node_modules.
  output: 'standalone',
  outputFileTracingExcludes: {
    '*': ['.git/**'],
  },
  // The public demo's embedded Postgres (lib/demo/db.ts) loads its WebAssembly at runtime — keep it
  // a plain Node package instead of bundling it.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Phase 12 challenger (19.10): no `X-Powered-By: Next.js` fingerprint.
  poweredByHeader: false,
  // No generated AGENTS.md in the repository.
  agentRules: false,
  // 30.10.2026: the image optimizer on Fly stalls at random (Dohliad_*, Narosh_05, w=256–1080) —
  // a stalled request leaves an empty frame and Safari never fires `load` on `/uk`. Every photo in
  // public/images is already a sized WebP (≤ 300 KB, 8 MB in all), so files are served as they are.
  images: { unoptimized: true },
  // Security headers (wave 2, security round 2): no framing (clickjacking on login / admin
  // forms), no MIME sniffing, no full URLs (reset tokens!) leaked in Referer to other origins.
  // Cabinet, admin, checkout and password pages are never cached by a shared cache.
  async headers() {
    const noStore = [{ key: 'Cache-Control', value: 'private, no-store' }];
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // HTTPS only for a year (TLS is terminated by the host). No full CSP yet:
          // inline scripts (rv-js, next-intl, Next runtime) need nonces first.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      ...[
        'cabinet',
        'admin',
        'change-password',
        'reset-password',
        'checkout',
        'login',
      ].map((p) => ({
        source: `/:locale(${LOCALES})/${p}/:path*`,
        headers: noStore,
      })),
      { source: '/api/:path*', headers: noStore },
    ];
  },
  async redirects() {
    return [
      // 5_Sitemap: /salon/services is gone — its TabBar + pricing live on /salon#services.
      // Runs before proxy.ts, so /uk/salon/services → 308 /uk/salon#services in one hop.
      {
        source: `/:locale(${LOCALES})/salon/services`,
        destination: '/:locale/salon#services',
        permanent: true,
      },
      // Owner 28.10: «Послуги» became «Ціни» (salon + course prices) in the admin.
      {
        source: `/:locale(${LOCALES})/admin/services`,
        destination: '/:locale/admin/prices',
        permanent: true,
      },
      // Owner 28.10: the public /prices page was a misreading — the prices live in the admin.
      {
        source: `/:locale(${LOCALES})/prices`,
        destination: '/:locale/salon#services',
        permanent: false,
      },
      // 5_Sitemap 19.10 (B-37 «так»): FAQ lives inside the pages; /faq → the academy FAQ.
      {
        source: `/:locale(${LOCALES})/faq`,
        destination: '/:locale/courses#faq',
        permanent: true,
      },
    ];
  },
};

export default function config(phase: string): NextConfig {
  // Build-time legal check (T-12): print the Phase-9 marker count per locale. Warn only.
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.LEGAL_MARKERS_CHECKED) {
    // Next loads the config in more than one process; the flag is inherited, so it prints once.
    process.env.LEGAL_MARKERS_CHECKED = '1';
    try {
      execFileSync(process.execPath, ['scripts/check-legal-markers.mjs'], {
        stdio: 'inherit',
      });
    } catch {
      console.warn('legal markers: check script failed to run (ignored)');
    }
  }
  return withNextIntl(nextConfig);
}
