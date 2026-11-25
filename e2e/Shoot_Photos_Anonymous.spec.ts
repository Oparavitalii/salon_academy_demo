import { expect, type Page, test } from '@playwright/test';

import { rejectCookies } from './Helpers';

/**
 * B-118 — Dana 16.11 13:24: «мы меняем все фотографии, которые сделал фотограф». No page renders a phone
 * photo any more; her two picks stand where she asked: BT9A4180 in «Стрижки» (13:20) and BT9A4115 as the
 * first «Життя студії» frame (13:22). Kept on purpose (no shoot frame of it): Certificate_01, the students
 * of the stories (Story_*), the portfolio of client results (Salon_Works/*).
 * The file name ends in `Anonymous.spec.ts`, so the «anonymous» project runs it.
 */
const PHONE =
  /Graduates_0|Course_Practice_0|Course_Teach_0|Course_Capsule_0|Course_Correction_0|Academy_Hero_0|Choice_Salon_01|Choice_Academy_01|Salon_Hero_0|Salon_Interior_01|Salon_Wide_01|Masters\/(Dana_0[234]|Maryna_0[23]|Nika_0[23]|Yulia_0[23]|Liana_0[23])\./;

const PAGES = [
  '/uk',
  '/uk/salon',
  '/uk/about',
  '/uk/courses',
  '/uk/contacts',
  '/uk/courses/microcapsule-extension',
  '/uk/courses/microcapsule-intensive',
  '/uk/courses/hair-reconstruction',
  '/uk/courses/reconstruction-intensive',
  '/uk/courses/personal-mentoring',
];

/** Every image path the page asks for: src, srcset (next/image URLs decoded), <source>, video posters. */
const imagePaths = (page: Page) =>
  page.evaluate(() => {
    const out = new Set<string>();
    const add = (s: string | null) => {
      if (s) out.add(decodeURIComponent(s));
    };
    document.querySelectorAll('img').forEach((i) => {
      add(i.getAttribute('src'));
      (i.getAttribute('srcset') ?? '')
        .split(',')
        .forEach((s) => add(s.trim().split(' ')[0]));
    });
    document
      .querySelectorAll('source[srcset]')
      .forEach((s) =>
        (s.getAttribute('srcset') ?? '')
          .split(',')
          .forEach((x) => add(x.trim().split(' ')[0])),
      );
    document
      .querySelectorAll('video[poster]')
      .forEach((v) => add(v.getAttribute('poster')));
    return [...out].filter(Boolean);
  });

test.beforeEach(async ({ page }) => {
  await page.goto('/uk');
  await rejectCookies(page);
});

test('no page renders a phone photo — only the shoot frames (Dana 16.11)', async ({
  page,
}) => {
  for (const path of PAGES) {
    await page.goto(path);
    const phone = (await imagePaths(page)).filter((s) => PHONE.test(s));
    expect(phone, path).toEqual([]);
  }
});

test('«Стрижки»: the carousel card is BT9A4180, the first-screen tile its neighbour 4181; «Догляд» tile is a shoot frame', async ({
  page,
}) => {
  const src = (sel: string) =>
    page
      .locator(sel)
      .first()
      .evaluate((e: HTMLImageElement) =>
        decodeURIComponent(e.currentSrc || e.src),
      );
  await expect(page.locator('.svc_card[data-sheet="cut"] img')).toHaveCount(1);
  expect(await src('.svc_card[data-sheet="cut"] img')).toMatch(/Cut_Work_01/);
  expect(await src('.hv_tile[data-sheet="cut"] img')).toMatch(/Cut_Work_02/);
  // Daryna 22.11 (via Oksana 23.11): «Догляд», «Фарбування», «Там де нарощення» — her three photos on the tiles
  expect(await src('.hv_tile[data-sheet="care"] img')).toMatch(
    /Dohliad_Daryna_01/,
  );
  expect(await src('.hv_tile[data-sheet="colour"] img')).toMatch(
    /Farb_Daryna_01/,
  );
  expect(await src('.hv_tile[data-sheet="extensions"] img')).toMatch(
    /Narosh_Daryna_01/,
  );
  await page.goto('/uk/salon');
  expect(await src('.hv_tile[data-sheet="cut"] img')).toMatch(/Cut_Work_02/);
});

test("/about masters: Daryna's 09:40 frames — Maryna 4817 + 3696, Liana 3809, Yulia 3622 (not the frames put there before)", async ({
  page,
}) => {
  await page.goto('/uk/about');
  const srcs = await page
    .locator('#masters .master_card')
    .evaluateAll((cards) =>
      cards.map((c) =>
        [...c.querySelectorAll('img')].map((i) =>
          decodeURIComponent(i.getAttribute('src') ?? ''),
        ),
      ),
    );
  const all = srcs.flat().join(' ');
  expect(all).toMatch(/Masters\/Maryna_06\./);
  expect(all).toMatch(/Masters\/Maryna_07\./);
  expect(all).toMatch(/Masters\/Liana_06\./);
  expect(all).toMatch(/Masters\/Yulia_07\./);
  expect(all).not.toMatch(
    /Masters\/(Maryna_0[45]|Liana_05|Yulia_04|Yulia_06)\./,
  );
});

test('/courses: every catalog card photo is a course-shoot frame (Dana 13:00 «Тут тоже есть новые фото, мы заменим»)', async ({
  page,
}) => {
  await page.goto('/uk/courses');
  const srcs = await page
    .locator('#catalog .catalog_item img')
    .evaluateAll((imgs) =>
      imgs.map((i) => decodeURIComponent(i.getAttribute('src') ?? '')),
    );
  // one photo per card since Oksana 16.11 (M-12: the two thumbs under the photo are gone)
  const cards = await page.locator('#catalog .catalog_item').count();
  expect(cards).toBeGreaterThanOrEqual(5);
  expect(srcs.length).toBe(cards);
  expect(srcs.filter((s) => !/images\/Academy\//.test(s))).toEqual([]);
  // the first-screen tile of the online reconstruction course shows its card photo — Olena with a student, mouths closed
  // since 23.11 (owner: no frames of that student alone)
  await expect(
    page.locator('.hv_tile img[src*="Recon_Card_04"]').first(),
  ).toHaveCount(1);
});

test('/about «Життя студії»: BT9A4115 (the hall full of masters) is the first, wide frame', async ({
  page,
}) => {
  await page.goto('/uk/about');
  const first = page.locator('#studio-life .life_tile').first();
  await expect(first).toHaveClass(/life_tile_wide/);
  const img = first.locator('img');
  await expect(img).toHaveAttribute('src', /Studio_Life_13/);
  await expect
    .poll(() => img.evaluate((e: HTMLImageElement) => e.naturalWidth))
    .toBeGreaterThan(0);
});
