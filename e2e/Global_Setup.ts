import { mkdirSync } from 'node:fs';

import { expect, test as setup } from '@playwright/test';

import { creds, rejectCookies } from './Helpers';

mkdirSync('e2e/.auth', { recursive: true });

for (const role of ['admin', 'student'] as const) {
  setup(`log in as the test ${role}`, async ({ page }) => {
    const { email, password } = creds(role);
    await page.goto('/uk/login');
    await rejectCookies(page);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('form button[type="submit"]').first().click();
    await expect(page).toHaveURL(
      role === 'admin' ? /\/uk\/admin$/ : /\/uk\/cabinet/,
    );
    await page.context().storageState({ path: `e2e/.auth/${role}.json` });
  });
}
