import { expect, test } from '@playwright/test';

import { rejectCookies } from './Helpers';

/** The test student: cabinet → her course → a lesson → «переглянуто»; the admin area is closed. */
test('the cabinet shows her course and its lessons open', async ({ page }) => {
  await page.goto('/uk/cabinet');
  await rejectCookies(page);
  await expect(page.locator('main')).toContainText(/мікрокапсульн/i);
  await page.goto('/uk/cabinet/microcapsule-extension');
  await page
    .locator('a[href$="/cabinet/microcapsule-extension/1"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/microcapsule-extension\/1$/);
  await expect(page.locator('h1')).toBeVisible();
});

test('marking a lesson watched shows «Переглянуто»', async ({ page }) => {
  await page.goto('/uk/cabinet/microcapsule-extension/2');
  await rejectCookies(page);
  const btn = page.getByRole('button', { name: 'Позначити переглянутим' });
  if (await btn.isVisible()) await btn.click();
  await expect(page.getByText('Переглянуто', { exact: true })).toBeVisible();
});

test('a course she does not hold is a 404, not a lesson', async ({ page }) => {
  const r = await page.goto('/uk/cabinet/hair-reconstruction/1');
  expect(r?.status()).toBe(404);
});

// Redirects are checked by their Location header (Skill_Test hard rule 9).
test('the admin area sends her back to her cabinet', async ({ page }) => {
  for (const p of [
    '/uk/admin/payments',
    '/uk/admin/students',
    '/uk/admin/prices',
  ]) {
    const r = await page.request.get(p, { maxRedirects: 0 });
    expect([302, 303, 307], p).toContain(r.status());
    expect(new URL(r.headers()['location'], 'http://x').pathname, p).toBe(
      '/uk/cabinet',
    );
  }
});

test('her settings page shows her own e-mail, read-only', async ({ page }) => {
  await page.goto('/uk/cabinet/settings');
  await expect(page.locator('main input[readonly]').first()).toHaveValue(
    /@studio-demo\.(example|test)$/,
  );
});

// Owner 02.11.2026: the cabinet has its own sections; «Допомога» and the footer keep her inside it.
test('the cabinet has four sections and help stays inside it', async ({
  page,
}) => {
  await page.goto('/uk/cabinet/help');
  await rejectCookies(page);
  const nav = page.locator('header .admin_nav a');
  await expect(nav).toHaveText([
    'Мої курси',
    'Сертифікати',
    'Допомога',
    'Налаштування',
  ]);
  await expect(page.locator('header .admin_nav a.is_active')).toHaveText(
    'Допомога',
  );
  await expect(page.locator('a[href$="/contacts"]')).toHaveCount(0);
  await expect(page.locator('main a[href*="instagram.com"]')).toBeVisible();
  await page.goto('/uk/cabinet/certificates');
  await expect(page.locator('h1')).toHaveText(/сертифікати/i);
});

test('a certificate PDF that is not hers is a 404', async ({ page }) => {
  const r = await page.request.get(
    '/api/cabinet/certificates/00000000-0000-0000-0000-000000000000',
  );
  expect(r.status()).toBe(404);
});
