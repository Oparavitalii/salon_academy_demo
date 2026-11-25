import { existsSync, readFileSync } from 'node:fs';

import type { Page } from '@playwright/test';

/**
 * Test accounts: env first, else the git-ignored dev credentials file, else the public demo accounts
 * (DEMO_MODE=1 seeds them — lib/demo/seed.ts). Never printed.
 */
export function creds(role: 'admin' | 'student') {
  const up = role.toUpperCase();
  const email = process.env[`E2E_${up}_EMAIL`];
  const password = process.env[`E2E_${up}_PASSWORD`];
  if (email && password) return { email, password };
  const file = '.dev_test_credentials.json';
  if (!existsSync(file))
    return {
      email: `${role}@studio-demo.example`,
      password: 'demo-studio-2026',
    };
  const j = JSON.parse(readFileSync(file, 'utf8'));
  return {
    email: j[role].email as string,
    password: j[role].password as string,
  };
}

/**
 * Answers the cookie banner with «Відхилити всі» if it is shown. Waits for hydration first
 * (`html.fx-js` is set by FxKit once the page is live) — WebKit hydrates later than Chromium and an
 * earlier click is lost. Retries until the banner is gone.
 */
export async function rejectCookies(page: Page) {
  await page
    .waitForFunction(
      () => document.documentElement.classList.contains('fx-js'),
      null,
      {
        timeout: 15_000,
      },
    )
    .catch(() => {});
  const btn = page.locator('.cookie_banner [data-cc="reject"]').first();
  for (let i = 0; i < 20; i++) {
    if (!(await btn.isVisible().catch(() => false))) return;
    await btn.click().catch(() => {});
    await page.waitForTimeout(300);
  }
}

/** Hosts that must never be contacted before consent. */
export const TRACKERS =
  /google-analytics|googletagmanager|googleadservices|doubleclick|facebook\.net|facebook\.com\/tr|posthog|clarity\.ms|hotjar/;
