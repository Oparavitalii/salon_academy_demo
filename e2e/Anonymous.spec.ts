import { expect, test } from '@playwright/test';

import { rejectCookies, TRACKERS } from './Helpers';

/** A visitor without an account: every public page in every language, consent, protected areas. */
const PAGES = [
  '',
  '/salon',
  '/courses',
  '/courses/microcapsule-extension',
  '/courses/microcapsule-intensive',
  '/courses/personal-mentoring', // 16.11 (Dana) — its own page, one h1 like the rest
  '/about',
  '/contacts',
  '/privacy',
  '/login',
];
const LOCALES = ['uk', 'pl', 'en'] as const;

for (const l of LOCALES)
  test(`every public page answers 200 in «${l}» with one h1 and the right lang`, async ({
    page,
  }) => {
    for (const p of PAGES) {
      const r = await page.goto(`/${l}${p}`);
      expect(r?.status(), `/${l}${p}`).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', l);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });

test('no tracker is contacted before consent, nor after «Відхилити всі»', async ({
  page,
}) => {
  const hits: string[] = [];
  page.on('request', (r) => {
    if (TRACKERS.test(r.url())) hits.push(r.url());
  });
  await page.goto('/uk');
  await expect(page.locator('.cookie_banner')).toBeVisible();
  await rejectCookies(page);
  await expect(page.locator('.cookie_banner')).toBeHidden();
  await page.goto('/uk/courses');
  await page.mouse.wheel(0, 3000);
  expect(hits).toEqual([]);
});

test('the footer «cookie settings» reopens the choice', async ({ page }) => {
  await page.goto('/uk');
  await rejectCookies(page);
  await page.locator('.cookie_settings_link').first().click();
  await expect(
    page.locator('.cookie_settings__dialog, .cookie_settings').first(),
  ).toBeVisible();
});

// A redirect is checked by its Location header, not followed: the app builds absolute URLs from
// APP_URL, which on a local run may point at another port (Skill_Test hard rule 9).
test('the cabinet and the admin send an anonymous visitor to the login page', async ({
  request,
}) => {
  for (const p of [
    '/uk/cabinet',
    '/uk/admin/payments',
    '/uk/admin/students',
    '/uk/cabinet/microcapsule-extension/1',
  ]) {
    const r = await request.get(p, { maxRedirects: 0 });
    expect([302, 303, 307], p).toContain(r.status());
    expect(new URL(r.headers()['location'], 'http://x').pathname, p).toBe(
      '/uk/login',
    );
  }
});

test('a wrong password keeps you on the login page with an error', async ({
  page,
}) => {
  await page.goto('/uk/login');
  await rejectCookies(page);
  await page.locator('input[name="email"]').fill('nobody@studio-demo.test');
  await page.locator('input[name="password"]').fill('wrong-password-1');
  await page.locator('form button[type="submit"]').first().click();
  await expect(page.locator('[role="alert"]').first()).toBeVisible();
  await expect(page).toHaveURL(/\/uk\/login/);
});

test('the material download refuses an anonymous visitor', async ({
  request,
}) => {
  const r = await request.get(
    '/api/materials/00000000-0000-0000-0000-000000000000/0',
  );
  expect(r.status()).toBe(401);
});

test('a course page shows its price and a call to action', async ({ page }) => {
  await page.goto('/uk/courses/microcapsule-extension');
  await rejectCookies(page);
  await expect(page.locator('main')).toContainText('€');
  const cta = page.locator('main a.btn').first();
  await expect(cta).toBeVisible();
  expect(await cta.getAttribute('href')).toBeTruthy();
});

test('the language changes the text, not only the URL', async ({ page }) => {
  await page.goto('/uk/courses');
  const uk = await page.locator('h1').innerText();
  await page.goto('/pl/courses');
  expect(await page.locator('h1').innerText()).not.toBe(uk);
});

test('the payment webhook refuses an unsigned request', async ({ request }) => {
  const r = await request.post('/api/webhooks/payments', { data: '{}' });
  expect([400, 503]).toContain(r.status());
});

test('a public page sets no Auth.js cookie for an anonymous visitor (D-12)', async ({
  request,
}) => {
  for (const p of ['/uk', '/uk/salon', '/uk/courses', '/uk/login']) {
    const r = await request.get(p, { maxRedirects: 0 });
    const cookies = r
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value);
    expect(
      cookies.filter((c) => /authjs\./.test(c)),
      p,
    ).toEqual([]);
  }
});

test('the www host answers 301 to the same path on the bare domain (D-13)', async ({
  request,
}) => {
  const r = await request.get('/uk/salon?x=1', {
    headers: { host: 'www.example.com' },
    maxRedirects: 0,
  });
  expect(r.status()).toBe(301);
  expect(r.headers().location).toBe('https://example.com/uk/salon?x=1');
});

test('checkout success without a confirmed payment says «waiting», not «received» (D-14)', async ({
  page,
}) => {
  await page.goto('/uk/checkout/success?session_id=cs_test_unknown_e2e');
  await expect(page.locator('h1')).toHaveText('Чекаємо підтвердження оплати');
  await expect(page).toHaveTitle(/Чекаємо підтвердження оплати/);
  // the messages bundle in the page source holds every string; check what is shown
  await expect(page.locator('main')).not.toContainText('Оплату отримано');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  // D-18 blocked: Next 16 serves every 404 under app/[locale] as the __next_error__ shell
  // (Pilot_Run R-04 findings). Unskip when the 404 is rendered on the server.
  test.fixme('the 404 page is styled (D-18)', async ({ page }) => {
    const r = await page.goto('/uk/no-such-page');
    expect(r?.status()).toBe(404);
    expect(
      await page.evaluate(() => document.styleSheets.length),
    ).toBeGreaterThan(0);
  });
});
