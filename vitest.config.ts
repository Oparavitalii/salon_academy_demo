import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * `npm test` — unit + integration (30.10.2026, phase 12 rule 14). Integration tests run against an
 * in-process Postgres (PGlite) built from the real migrations in `drizzle/`, so they need no
 * secrets and no network. Floors in `coverage.thresholds` are raised as the suite grows.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['lib/payments/**', 'lib/auth/**', 'lib/video/**'],
    },
  },
});
