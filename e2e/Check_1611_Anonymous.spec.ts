import { expect, test } from '@playwright/test';

import { rejectCookies } from './Helpers';

/**
 * Check run «Chat_1611_Verify» (16.11.2026), challenger round 1 — the gaps it found on the live site, fixed and pinned:
 * the rating plaque still said «5.0», the 100000+ label had dropped Dana's «прилетающих», the before/after button was
 * white only on hover (a phone has none), and the «Догляд» card cut the hair (Dana 12:33) — now her own video (B-117).
 * The file name ends in `Anonymous.spec.ts`, so the «anonymous» project runs it.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/uk');
  await rejectCookies(page);
});

test('no «5.0» rating left on / and /salon (Dana 12:56 «5 ⭐ поставить вместо 5.0»)', async ({
  page,
}) => {
  for (const path of ['/uk', '/uk/salon']) {
    await page.goto(path);
    const text = await page.locator('main').innerText();
    expect(text, path).not.toMatch(/(^|[^\d.])5\.0([^\d]|$)/);
  }
});

test('100000+ label says «прилітають» (Dana 12:56 «прилетающих с разных стран»)', async ({
  page,
}) => {
  await page.goto('/uk');
  await expect(page.locator('main')).toContainText(
    'задоволених клієнток, які прилітають з різних країн',
  );
});

test("the care card shows the whole hair — Dana's loop IMG_1370 (B-117, 12:51 «Эту работу поставить в уход»)", async ({
  page,
}) => {
  const video = page.locator('.svc_card[data-sheet="care"] video');
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute('src', /Care_Result\.mp4$/);
  await expect(video).toHaveAttribute('poster', /Care_Result_Poster\.webp$/);
  expect(await video.evaluate((v: HTMLVideoElement) => v.muted && v.loop)).toBe(
    true,
  );
});

test('the «Результати до і після» button is white at rest (Daryna 09:33 «краще білим спробувати?»)', async ({
  page,
}) => {
  await page.goto('/uk/salon');
  const btn = page.locator('#portfolio .sec_head_row .btn');
  await btn.scrollIntoViewIfNeeded();
  await expect(btn).toHaveCSS('background-color', 'rgb(251, 251, 251)');
});
