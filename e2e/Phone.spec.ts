import { expect, test } from '@playwright/test';

import { rejectCookies } from './Helpers';

/** A visitor on a phone: no sideways scroll, the menu opens and closes, the video first screen. */
const PAGES = [
  '/uk',
  '/uk/salon',
  '/uk/courses',
  '/uk/courses/microcapsule-extension',
  '/uk/about',
  '/uk/contacts',
  '/uk/variant_video',
];

test('no horizontal scroll on any key page', async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p);
    const [sw, iw] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      innerWidth,
    ]);
    expect(sw, p).toBeLessThanOrEqual(iw);
  }
});

test('the burger menu opens and Escape closes it', async ({ page }) => {
  await page.goto('/uk');
  await rejectCookies(page);
  const burger = page.locator('header button[aria-expanded]').first();
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
});

test('variant_video: the video plays, four tiles link to the salon, the page is not indexed', async ({
  page,
  browserName,
}) => {
  await page.goto('/uk/variant_video');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );
  // Playwright's Linux WebKit has no H.264 decoder; playback is checked on Chromium only.
  if (browserName === 'chromium')
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (document.querySelector('.hv_video') as HTMLVideoElement | null)
                ?.currentTime ?? 0,
          ),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0.3);
  const hrefs = await page
    .locator('.hv_tile')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  // since 06.11 a salon tile opens its price sheet; without JS it links to the price list
  expect(hrefs).toEqual([
    '/uk/salon#services',
    '/uk/salon#services',
    '/uk/salon#services',
    '/uk/salon#services',
  ]);
});
