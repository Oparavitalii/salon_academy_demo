import { expect, test } from '@playwright/test';

import { creds, rejectCookies } from './Helpers';

/**
 * The test admin: every admin page renders; the five-section menu (owner 31.10.2026 regroup) with
 * tabs for the sub-pages; any course can be previewed; the salon group saves with one button.
 */
const ADMIN = [
  '',
  '/payments',
  '/students',
  '/courses',
  '/prices',
  '/certificates',
  '/logins',
  '/settings',
];

test('every admin page answers 200 and renders without page errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const p of ADMIN) {
    const r = await page.goto(`/uk/admin${p}`);
    expect(r?.status(), p).toBe(200);
    await expect(page.locator('main'), p).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('the menu has five sections; profile and logout sit in the account menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/uk/admin');
  await rejectCookies(page);
  await expect(page.locator('.admin_nav a')).toHaveText([
    'Сьогодні',
    'Учениці',
    'Курси',
    'Оплати й сертифікати',
    'Прайс салону',
  ]);
  await expect(page.locator('h1')).toHaveText('Сьогодні');
  await page.locator('.admin_account summary').click();
  await expect(
    page.locator('.admin_account .choose_menu a[href$="/admin/settings"]'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Вийти' }).first(),
  ).toBeVisible();
});

test('sub-pages are tabs and light up their section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [p, section, tabs] of [
    ['/uk/admin/logins', 'Учениці', ['Учениці', 'Журнал входів']],
    [
      '/uk/admin/certificates',
      'Оплати й сертифікати',
      ['Оплати', 'Сертифікати'],
    ],
  ] as const) {
    await page.goto(p);
    await expect(page.locator('.admin_nav a.is_active'), p).toHaveText(section);
    await expect(page.locator('.admin_tabs a'), p).toHaveText([...tabs]);
    await expect(page.locator('.admin_tab.is_active'), p).toHaveText(tabs[1]);
  }
});

test('on a phone the admin has the site burger: every section, the current one marked (08.11.2026)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/uk/admin/logins');
  await rejectCookies(page);
  const burger = page.locator('header .bm-toggle');
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  const panel = page.locator('.bm-panel.is-open');
  await expect(panel.locator('.bm-link')).toHaveCount(7); // 5 sections · Профіль · Вийти
  await expect(panel.locator('.bm-link[aria-current="page"]')).toHaveText(
    'Учениці',
  );
  await expect(panel.locator('.lang_row a')).toHaveCount(3);
  const [sw, iw] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    innerWidth,
  ]);
  expect(sw).toBeLessThanOrEqual(iw);
  await page.keyboard.press('Escape');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.bm-panel.is-open')).toHaveCount(0);
});

test('course price and status are edited in «Курси» only', async ({ page }) => {
  await page.goto('/uk/admin/courses');
  await expect(page.locator('main form select[name="status"]')).not.toHaveCount(
    0,
  );
  await page.goto('/uk/admin/prices');
  await expect(
    page.locator('main [name="status"], main [name="price"]'),
  ).toHaveCount(0);
});

test('a salon group saves with one button', async ({ page }) => {
  await page.goto('/uk/admin/prices');
  await rejectCookies(page);
  const group = page.locator('details.svc_group').first();
  await group.locator('summary').click();
  await expect(group.locator('button[type="submit"]')).toHaveCount(1);
  await group.getByRole('button', { name: 'Зберегти групу' }).click();
  await expect(page.locator('[role="status"]')).toHaveText('Збережено.');
});

test('the login log pages by 50', async ({ page }) => {
  await page.goto('/uk/admin/logins');
  expect(await page.locator('tbody tr').count()).toBeLessThanOrEqual(50);
});

test('blocking a student asks first; «Скасувати» leaves her active', async ({
  page,
}) => {
  await page.goto(`/uk/admin/students?q=${creds('student').email}`);
  await rejectCookies(page);
  page.once('dialog', (d) => d.dismiss());
  await page.getByRole('button', { name: 'Заблокувати' }).first().click();
  await expect(page.locator('.student_card .tag_ok').first()).toBeVisible();
  await expect(page).not.toHaveURL(/msg=blocked/);
});

test('the admin previews a lesson of any course, marked as the admin view', async ({
  page,
}) => {
  await page.goto('/uk/cabinet/microcapsule-extension/1');
  await rejectCookies(page);
  await expect(page.getByText('Перегляд адміна')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Позначити переглянутим' }),
  ).toHaveCount(0);
});

test('the students list finds the test student', async ({ page }) => {
  const { email } = creds('student');
  await page.goto(`/uk/admin/students?q=${email}`);
  await expect(page.locator('main')).toContainText(email);
});

test('the admin header carries the salon logo, not the academy one (B-73)', async ({
  page,
}) => {
  await page.goto('/uk/admin');
  await expect(page.locator('.header_brand .logo-circle_white')).toHaveCount(0);
});

test('/admin/prices lists content names: no «Junior», Base rows marked (D-22)', async ({
  page,
}) => {
  await page.goto('/uk/admin/prices');
  // groups are closed <details>: innerText skips them, textContent does not
  const text = (await page.locator('main').textContent()) ?? '';
  expect(text).not.toMatch(/Junior/);
  expect(text).toContain('Тонування · Base');
});
