import { expect, test } from '@playwright/test';

import { rejectCookies } from './Helpers';

/**
 * The academy after 16.11: the personal mentoring course (Dana 16.11) and the course shoot 09.11 photos
 * (Q-47). The file name ends in `Anonymous.spec.ts`, so the «anonymous» project runs it. The catalog shows
 * only courses that are «available» in the DB — CI gets the mentoring row from `db:seed`; a live DB from
 * `db:sync-catalog -- --apply`.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/uk');
  await rejectCookies(page);
});

test('/courses: the mentoring is the fifth card — offline, «від 2 000 €», both prices in its text, books on its page', async ({
  page,
}) => {
  await page.goto('/uk/courses');
  const items = page.locator('#catalog .catalog_item');
  await expect(items).toHaveCount(5);
  const card = items.last();
  await expect(card).toHaveAttribute('data-kind', 'offline');
  await expect(card).toContainText('Особисте наставництво | VIP-навчання');
  await expect(card.locator('.catalog_price')).toHaveText(/^від\s2\s000\s€$/);
  await expect(card.locator('.catalog_text')).toContainText(
    /2 дні — 2\s000\s€, 3 дні — 3\s000\s€/,
  );
  await expect(card.locator('.catalog_actions a').first()).toHaveAttribute(
    'href',
    /\/courses\/personal-mentoring#price$/,
  );
  // «Усі 5 · Онлайн 2 · Офлайн у Варшаві 3»
  const counts = await page.locator('#catalog .filter_count').allTextContents();
  expect(counts.map((c) => c.trim())).toEqual(['5', '2', '3']);
  // the first screen keeps its four course tiles (the mentoring is not a tile)
  await expect(page.locator('.hv_tiles > li')).toHaveCount(4);
});

test("/courses/personal-mentoring: Dana's text, no format switch, both prices, every button books via the channels", async ({
  page,
}) => {
  await page.goto('/uk/courses/personal-mentoring');
  await expect(page.locator('h1')).toHaveText('Особисте наставництво');
  await expect(page.locator('.course_hero .eyebrow')).toHaveText(
    'VIP-навчання',
  );
  await expect(page.locator('.course_hero .lede')).toContainText(
    '20 років професійного досвіду на 2 або 3 дні',
  );
  // one format — no FormatSwitch, no «Офлайн-інтенсив» in the h1
  await expect(page.locator('nav.switch')).toHaveCount(0);
  // both prices in the hero and in the price card
  for (const scope of ['.course_hero', '#price .price_card']) {
    const prices = await page
      .locator(`${scope} .course_hero_price`)
      .allInnerTexts();
    expect(prices.map((p) => p.replace(/\s+/g, ' ').trim())).toEqual([
      expect.stringMatching(/^2 дні\s*2 000 €$/i),
      expect.stringMatching(/^3 дні\s*3 000 €$/i),
    ]);
  }
  await expect(page.locator('#program .check_list li')).toHaveCount(6);
  await expect(page.locator('#inclusions .inclusion')).toHaveCount(6);
  // one option per span (16.11: the line ran under the photo at 1440)
  await expect(page.locator('#final .final_price > span')).toHaveText([
    /2 дні — 2\s000\s€/,
    /3 дні — 3\s000\s€/,
  ]);
  const cut = await page.locator('#final').evaluate((sec) => {
    const p = sec.querySelector('.final_price')!.getBoundingClientRect();
    const f = sec.querySelector('.final_figure')?.getBoundingClientRect();
    return f && f.width > 0 && f.left > p.left ? p.right - f.left : 0;
  });
  expect(cut).toBeLessThanOrEqual(0);
  // every in-page button goes to the price card; the card opens the booking channels
  const hrefs = await page
    .locator('main a.btn')
    .evaluateAll((els) => els.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(4);
  for (const h of hrefs) expect(['#price', '#inclusions']).toContain(h);
  const book = page.locator('#price details.price_book');
  await book.locator('summary').click();
  await expect(book).toHaveAttribute('open', '');
  await expect(book.locator('.booking a').first()).toBeVisible();
  // the photos are the shoot frames and they load
  const hero = page.locator('.course_hero_img_1 img');
  await expect(hero).toHaveAttribute('src', /Mentor_Student_01/);
  await expect
    .poll(() => hero.evaluate((e: HTMLImageElement) => e.naturalWidth))
    .toBeGreaterThan(0);
  // no emoji in the copy (Dana's text is plain)
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
});

test('/courses/personal-mentoring in pl / en: the translated h1 and both prices', async ({
  page,
}) => {
  for (const [l, h1, two] of [
    ['pl', 'Mentoring indywidualny', /2 dni/],
    ['en', 'Personal mentoring', /€2,000/],
  ] as const) {
    await page.goto(`/${l}/courses/personal-mentoring`);
    await expect(page.locator('h1')).toHaveText(h1);
    await expect(page.locator('#price .price_card')).toContainText(two);
  }
});

test('course shoot 09.11 (Q-47): the academy cards, tiles and benefits show the shoot, not the phone photos', async ({
  page,
}) => {
  await page.goto('/uk/courses');
  const srcs = async (sel: string) =>
    page
      .locator(sel)
      .evaluateAll((els) =>
        els.map(
          (e) =>
            (e as HTMLImageElement).currentSrc || e.getAttribute('src') || '',
        ),
      );
  const phone = /Course_Practice_0|Course_Teach_01|Academy_Hero_0[12]/;
  // `.catalog_thumb` is gone (Oksana 16.11, M-12: one photo per card)
  for (const sel of [
    '#catalog .catalog_media img',
    '.hv_tiles img',
    '#benefits .pb_img',
  ]) {
    const list = await srcs(sel);
    expect(list.length, sel).toBeGreaterThan(0);
    for (const s of list) expect(s, sel).not.toMatch(phone);
  }
  expect((await srcs('#benefits .pb_img')).join(' ')).toMatch(
    /Students_Group_01/,
  );
  for (const path of [
    '/uk/courses/microcapsule-extension',
    '/uk/courses/microcapsule-intensive',
  ]) {
    await page.goto(path);
    const all = await page
      .locator('main img')
      .evaluateAll((els) =>
        els.map(
          (e) =>
            (e as HTMLImageElement).currentSrc || e.getAttribute('src') || '',
        ),
      );
    for (const s of all) expect(s, path).not.toMatch(phone);
  }
});
