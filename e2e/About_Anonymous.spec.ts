import { expect, type Locator, test } from '@playwright/test';

import { rejectCookies } from './Helpers';

/**
 * Oksana's design notes 16.11.2026 (Правки.pdf, B-119) — the /courses and /about part: M-12, M-13, M-16,
 * M-17, M-18, M-26, M-27, M-28 (CSS: app/styles/Studio_About.css). The file name ends in
 * `Anonymous.spec.ts`, so the «anonymous» project runs it.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/uk');
  await rejectCookies(page);
});

const look = (el: Locator) =>
  el.evaluate((e) => {
    const c = getComputedStyle(e);
    return { border: c.borderTopColor, shadow: c.boxShadow };
  });

test('/courses cards: one photo each, the pink outline + glow of the home cards on hover (Oksana M-12)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/uk/courses');
  const n = await page.locator('#catalog .catalog_item').count();
  expect(n).toBeGreaterThanOrEqual(5);
  await expect(page.locator('#catalog .catalog_thumbs')).toHaveCount(0);
  await expect(page.locator('#catalog .catalog_item img')).toHaveCount(n);
  const card = page.locator('#catalog .catalog_card').first();
  await expect(card).toHaveClass(/hv-card-border/);
  await card.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect.poll(async () => (await look(card)).shadow).toBe('none');
  const rest = (await look(card)).border;
  await card.hover();
  await expect.poll(async () => (await look(card)).shadow).toMatch(/0\.18\)/);
  await expect.poll(async () => (await look(card)).border).not.toBe(rest);
});

test('success stories (/courses and /): no shadow; the pink outline + glow on hover (Oksana M-13)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ['/uk/courses', '/uk']) {
    await page.goto(path);
    const card = page.locator('.story_card').first();
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect.poll(async () => (await look(card)).shadow, path).toBe('none');
    const rest = (await look(card)).border;
    await card.hover();
    await expect
      .poll(async () => (await look(card)).shadow, path)
      .toMatch(/0\.18\)/);
    await expect
      .poll(async () => (await look(card)).border, path)
      .not.toBe(rest);
  }
});

test('/about academy: four equal 4:5 course-shoot photos in one row; on a phone a swipe slider of one size (Oksana M-16, M-28)', async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/uk/about');
    const media = page.locator('#academy .recognition_media');
    await media.scrollIntoViewIfNeeded();
    const r = await media.evaluate((ul: HTMLElement) => {
      const tiles = [...ul.querySelectorAll<HTMLElement>('.recognition_img')];
      return {
        srcs: tiles.map((t) =>
          decodeURIComponent(t.querySelector('img')?.getAttribute('src') ?? ''),
        ),
        // layout box (offset*), not getBoundingClientRect: a photo whose reveal has not run yet still carries the
        // reveal's start transform (scale / translate), on a slow CI runner even inside the viewport
        boxes: tiles.map((t) => [t.offsetWidth, t.offsetHeight, t.offsetTop]),
        scrolls: ul.scrollWidth > ul.clientWidth + 1,
        // desktop «no slider» by layout too: scrollWidth counts a not-yet-revealed tile's start transform, so on CI
        // (3eb4885, 16.11) the row «scrolled» at 1440 although overflow is visible there and nothing can scroll
        overflowX: getComputedStyle(ul).overflowX,
        fits:
          ul.offsetParent === tiles[0]?.offsetParent &&
          Math.max(...tiles.map((t) => t.offsetLeft + t.offsetWidth)) <=
            ul.offsetLeft + ul.clientWidth + 1,
        page: document.documentElement.scrollWidth,
      };
    });
    expect(r.srcs, `@${width}`).toHaveLength(4);
    for (const s of r.srcs) expect(s, `@${width}`).toMatch(/images\/Academy\//);
    // one size, the photos' own 4:5 — nothing cropped
    expect(new Set(r.boxes.map((b) => `${b[0]}x${b[1]}`)).size).toBe(1);
    expect(r.boxes[0][1] / r.boxes[0][0]).toBeCloseTo(1.25, 1);
    if (width === 1440) {
      expect(new Set(r.boxes.map((b) => b[2])).size).toBe(1);
      expect(r.overflowX).toBe('visible');
      expect(r.fits).toBe(true);
    } else {
      expect(r.scrolls).toBe(true);
      expect(r.page).toBeLessThanOrEqual(width);
    }
  }
});

test('/about «Досягнення»: the photo runs the full height of the block; the final band is the salon (Oksana M-17, M-18)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // reduced motion: AutoReveal moves nothing, so the boxes are where the layout puts them
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/uk/about');
  const r = await page.locator('#numbers').evaluate((s) => {
    const body = s.querySelector('.stats_body')!.getBoundingClientRect();
    const fig = s.querySelector('.stats_figure')!.getBoundingClientRect();
    return {
      top: Math.round(fig.top - body.top),
      bottom: Math.round(fig.bottom - body.bottom),
    };
  });
  expect(Math.abs(r.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(r.bottom)).toBeLessThanOrEqual(1);
  await expect(page.locator('#cta .about_cta_bg img')).toHaveAttribute(
    'src',
    /Studio_Life_07/,
  );
});

test('masters on a phone: the odd last card sits in the left column, not centred (Oksana M-26)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/uk/about', '/uk/salon']) {
    await page.goto(path);
    const boxes = await page
      .locator('#masters .master_card')
      .evaluateAll((cs) =>
        cs.map((c) => {
          const b = c.getBoundingClientRect();
          return [Math.round(b.left), Math.round(b.width)];
        }),
      );
    expect(boxes.length, path).toBeGreaterThanOrEqual(5);
    const last = boxes[boxes.length - 1];
    expect(last, path).toEqual(boxes[0]);
  }
});

test('/about founder on a phone: 24 px from the photo caption to the text (Oksana M-27)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/uk/about');
  const gap = await page.evaluate(() =>
    Math.round(
      document.querySelector('.founder_text')!.getBoundingClientRect().top -
        document
          .querySelector('.founder_media .dec_polaroid')!
          .getBoundingClientRect().bottom,
    ),
  );
  expect(gap).toBeGreaterThanOrEqual(16);
  expect(gap).toBeLessThanOrEqual(32);
});
