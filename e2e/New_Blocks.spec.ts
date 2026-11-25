import { expect, test } from '@playwright/test';

import { rejectCookies } from './Helpers';

/**
 * The blocks built 31.10–1.11.2026 (owner's mobile round, UI-kit pick, video wall), on desktop.
 * Each test drives the block the way a visitor does and checks what she sees change.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/uk');
  await rejectCookies(page);
});

test('first screen: no ticker and no Studio | Academy tabs (Daryna 03.11), the main button and four tiles stay', async ({
  page,
}) => {
  for (const [path, cta] of [
    ['/uk/salon', '#booking'],
    ['/uk/courses', '#catalog'],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('.hv_ticker, .hv_tabs, .hv_tab')).toHaveCount(0);
    await expect(page.getByText(/Professional training/i)).toHaveCount(0);
    await expect(page.locator('.hv_cta')).toHaveAttribute(
      'href',
      new RegExp(`${cta}$`),
    );
    await expect(page.locator('.hv_cta')).toBeInViewport();
    await expect(page.locator('.hv_tiles > li')).toHaveCount(4);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('desktop video wall: three columns of one clip, each no wider than the clip', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/uk/salon');
  const cols = page.locator('.hv_wall .hv_video');
  await expect(cols).toHaveCount(3);
  for (const box of await cols.evaluateAll((vs) =>
    vs.map((v) => v.getBoundingClientRect().width),
  ))
    expect(box).toBeLessThanOrEqual(576);
  await expect
    .poll(() =>
      cols.evaluateAll(
        (vs) =>
          vs.filter((v) => (v as HTMLVideoElement).getAttribute('src')).length,
      ),
    )
    .toBe(3);
});

test('academy tiles open their course page', async ({ page }) => {
  await page.goto('/uk/courses');
  const hrefs = await page
    .locator('.hv_tile')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) expect(h).toMatch(/^\/uk\/courses\/[a-z-]+$/);
});

test('reviews: a counter instead of dots, the arrow moves it', async ({
  page,
}) => {
  await page.goto('/uk');
  const slider = page.locator('.review_slider').first();
  await slider.scrollIntoViewIfNeeded();
  await expect(slider.locator('.dot')).toHaveCount(0);
  const count = slider.locator('.review_count');
  await expect(count).toHaveText(/(^|\s)1\s*\/\s*\d+$/);
  await slider.locator('.review_nav .arrow').last().click();
  await expect(count).toHaveText(/(^|\s)2\s*\/\s*\d+$/);
});

test('a gallery photo opens the slideshow: arrows move, Escape closes and returns focus', async ({
  page,
}) => {
  // Oksana 16.11 (M-12): a /courses card has one photo now → a course page, whose first gallery has more than one
  await page.goto('/uk/courses/microcapsule-intensive');
  const img = page.locator('[data-gallery] img').first();
  await img.scrollIntoViewIfNeeded();
  await img.click();
  const lb = page.locator('.lb.is-open');
  await expect(lb).toBeVisible();
  const count = lb.locator('.lb__count');
  await expect(count).toHaveText(/(^|\s)1\s*\/\s*\d+$/);
  await page.keyboard.press('ArrowRight');
  await expect(count).toHaveText(/(^|\s)2\s*\/\s*\d+$/);
  await page.keyboard.press('Escape');
  await expect(lb).toHaveCount(0);
});

test('the salon portfolio viewer opens and the arrow key moves it', async ({
  page,
}) => {
  await page.goto('/uk/salon');
  const tile = page.locator('.ix-flip__link').first();
  await tile.scrollIntoViewIfNeeded();
  await tile.click();
  const stage = page.locator('.ix-flip__stage.is-open');
  await expect(stage).toBeVisible();
  await expect(stage).toContainText(/1\s*\/\s*\d+/);
  await page.keyboard.press('ArrowRight');
  await expect(stage).toContainText(/2\s*\/\s*\d+/);
  await page.keyboard.press('Escape');
  await expect(stage).toBeHidden();
});

test('/courses benefits: four flat cards with their photos, no 3D canvas (Daryna 16.11)', async ({
  page,
}) => {
  await page.goto('/uk/courses');
  const cards = page.locator('#benefits .pb_card');
  await expect(cards).toHaveCount(4);
  await expect(page.locator('#benefits .pb_card img.pb_img')).toHaveCount(4);
  await expect(page.locator('#benefits canvas')).toHaveCount(0);
});

test('/about founder story folds to the key sentence and back', async ({
  page,
}) => {
  await page.goto('/uk/about');
  const box = page.locator('.tr-tldr');
  await box.scrollIntoViewIfNeeded();
  await box.locator('[data-mode="short"]').click();
  await expect(box).toHaveClass(/is-short/);
  await expect(box.locator('.tr-tldr__more')).toBeHidden();
  await box.locator('[data-mode="full"]').click();
  await expect(box.locator('.tr-tldr__more')).toBeVisible();
});

test('/about masters: five portrait cards from the shoot, no round avatar; hover shows the second photo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/uk/about');
  const cards = page.locator('#masters .master_card');
  await expect(cards).toHaveCount(5);
  await expect(page.locator('#masters .ui-card__avatar')).toHaveCount(0);
  await cards.first().scrollIntoViewIfNeeded();
  for (let i = 0; i < 5; i++) {
    const photo = cards.nth(i).locator('.master_photo');
    const box = await photo.boundingBox();
    expect(Math.abs((box?.width ?? 0) / (box?.height ?? 1) - 0.8)).toBeLessThan(
      0.02,
    );
    const main = photo.locator('img').first();
    await expect(main).toHaveAttribute('alt', /\S/);
    await expect
      .poll(() => main.evaluate((im: HTMLImageElement) => im.naturalWidth))
      .toBeGreaterThan(0);
  }
  const second = cards.nth(1).locator('.master_photo_alt');
  await expect(second).toHaveCSS('opacity', '0');
  await cards.nth(1).hover();
  await expect(second).toHaveCSS('opacity', '1');
});

test('home services switch on scroll: the third service brings its own photo (sx-pin, owner 23.11)', async ({
  page,
}) => {
  await page.goto('/uk');
  const steps = page.locator('.salon_pin .sx-pin__step');
  const panels = page.locator('.salon_pin .sx-pin__panel');
  await expect(steps).toHaveCount(3);
  await steps.nth(2).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(panels.nth(2)).toHaveClass(/is-active/);
  await expect(panels.nth(0)).not.toHaveClass(/is-active/);
  await expect(panels.nth(2).locator('img')).toHaveAttribute(
    'src',
    /Dohliad_03/,
  );
});

test('the header logo has no circle in the default skin', async ({ page }) => {
  // dark salon header → the light-ink mark; light academy header → the dark-ink mark (06.11)
  for (const [path, cls] of [
    ['/uk', 'logo_mark_light'],
    ['/uk/courses', null],
  ] as const) {
    await page.goto(path);
    const shown = page.locator('header .logo_mark:visible');
    await expect(shown).toHaveCount(1);
    if (cls) await expect(shown).toHaveClass(new RegExp(cls));
    else await expect(shown).not.toHaveClass(/logo_mark_light/);
    await expect(page.locator('header .logo_disc').first()).toBeHidden();
  }
});

test('?skin=classic switches to the dark design and ?skin=new back', async ({
  page,
}) => {
  await page.goto('/uk?skin=classic');
  await expect(page.locator('html')).toHaveClass(/skin_classic/);
  await page.goto('/uk/salon');
  await expect(page.locator('html')).toHaveClass(/skin_classic/);
  await page.goto('/uk?skin=new');
  await expect(page.locator('html')).not.toHaveClass(/skin_classic/);
});

test('the phone bottom bar is not shown on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/uk');
  await expect(page.locator('.bottom_bar')).toBeHidden();
});

// ---- Daryna's edits 03.11.2026 (built 06.11) -------------------------------------------------

test('a salon tile opens its price list over the page; Esc and ✕ close it', async ({
  page,
}) => {
  const url = page.url();
  const tile = page.locator('.hv_tile[data-sheet="colour"]');
  await tile.click();
  const sheet = page.locator('dialog.svc_sheet[open]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.svc_sheet_title')).toHaveText(/фарбування/i);
  expect(await sheet.locator('.svc_sheet_row').count()).toBeGreaterThan(10);
  await expect(sheet.locator('.svc_sheet_price').first()).toContainText('zł');
  expect(page.url()).toBe(url);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.svc_sheet[open]')).toHaveCount(0);
  await page.locator('.hv_tile[data-sheet="care"]').click();
  await expect(sheet.locator('.svc_sheet_title')).toHaveText(/догляд/i);
  await sheet.locator('.svc_sheet_close').click();
  await expect(page.locator('dialog.svc_sheet[open]')).toHaveCount(0);
});

test('the price sheet shows the same prices as /salon', async ({ page }) => {
  await page.goto('/uk/salon');
  const salon = await page
    .locator('#panel-microcapsule .row_price')
    .evaluateAll((rs) =>
      rs.map(
        (r) =>
          r.querySelector('.row_value, .row_note')?.textContent?.trim() ?? '-',
      ),
    );
  await page.locator('.hv_tile[data-sheet="extensions"]').click();
  const sheet = await page
    .locator('dialog.svc_sheet[open] .svc_sheet_row')
    .evaluateAll((rs) =>
      rs.map(
        (r) => r.querySelector('.svc_sheet_price')?.textContent?.trim() ?? '-',
      ),
    );
  expect(salon.length).toBeGreaterThan(0);
  expect(sheet).toEqual(salon);
});

// ---- Dana's edits 16.11.2026: «від» prices, the fourth stats tile -----------------------------

test('every salon price reads «від …» once, before the whole range, in every language; the consultation rows stay (Dana 16.11)', async ({
  page,
}) => {
  for (const [l, from] of [
    ['uk', 'від'],
    ['pl', 'od'],
    ['en', 'from'],
  ] as const) {
    await page.goto(`/${l}/salon`);
    const prices = (
      await page.locator('#services .row_value').allTextContents()
    ).map((p) => p.trim());
    expect(prices.length).toBeGreaterThan(40);
    const bad = prices.filter(
      (p) => !p.startsWith(`${from} `) || p.split(from).length !== 2,
    );
    expect(bad, `${l}: rows without one leading «${from}»`).toEqual([]);
  }
  await page.goto('/uk/salon');
  await expect(page.locator('#services .row_note').first()).toHaveText(
    'ціну називаємо на консультації',
  );
  // the direction sheets show the same rows (`rowsOf`), so they carry «від» as well
  await page.locator('.hv_tile[data-sheet="care"]').click();
  const sheet = (
    await page
      .locator('dialog.svc_sheet[open] .svc_sheet_price:not(.is_note)')
      .allTextContents()
  ).map((p) => p.trim());
  expect(sheet.length).toBeGreaterThan(5);
  expect(sheet.filter((p) => !/^від \d/.test(p))).toEqual([]);
});

test('«Чоловіча тривала завивка» costs «від 400 zł» (Dana 16.11 «И химия от 400»; prod DB via migration 0006)', async ({
  page,
}) => {
  await page.goto('/uk/salon');
  const row = page.locator('#services .row_price').filter({
    has: page.locator('.row_name', { hasText: /^Чоловіча тривала завивка$/ }),
  });
  await expect(row).toHaveCount(1);
  await expect(row.locator('.row_value')).toHaveText(/^від 400( zł)?$/);
});

test('stats: four tiles 20+ · 5 ★ · 180+ · 100000+, rows without a gap, every numeral on one line inside its card at 390 and 1440 (Dana 16.11)', async ({
  page,
}) => {
  for (const [path, id] of [
    ['/uk', '#stats'],
    ['/uk/about', '#numbers'],
  ] as const) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator(`${id} .stat_num`)).toHaveText([
        '20+',
        '5 ★',
        '180+',
        '100000+',
      ]);
      await expect(page.locator(`${id} .stat_label`).nth(3)).toHaveText(
        'задоволених клієнток, які прилітають з різних країн',
      );
      const r = await page.locator(`${id} .stats`).evaluate((ul) => {
        const cards = [...ul.querySelectorAll<HTMLElement>('.stat')];
        const perRow = new Map<number, number>();
        for (const c of cards)
          perRow.set(c.offsetTop, (perRow.get(c.offsetTop) ?? 0) + 1);
        return {
          perRow: [...perRow.values()],
          numerals: cards.map((c) => {
            const n = c.querySelector<HTMLElement>('.stat_num')!;
            return {
              text: n.textContent,
              oneLine:
                n.getBoundingClientRect().height <
                parseFloat(getComputedStyle(n).fontSize) * 1.6,
              inside: n.scrollWidth <= n.clientWidth + 1,
            };
          }),
        };
      });
      // 2 × 2 or one row of four — never three and an orphan
      expect([[2, 2], [4]], `${path} @${width}`).toContainEqual(r.perRow);
      for (const n of r.numerals)
        expect(n, `${path} @${width}`).toMatchObject({
          oneLine: true,
          inside: true,
        });
    }
  }
});

test('SERVICES carousel: arrows scroll the row, a card opens its direction', async ({
  page,
}) => {
  const car = page.locator('#services-carousel');
  await car.scrollIntoViewIfNeeded();
  await expect(car.locator('.svc_card')).toHaveCount(5);
  const track = car.locator('.svc_carousel_track');
  const next = car.locator('.svc_arrow').nth(1);
  if (await next.isEnabled()) {
    const x0 = await track.evaluate((t) => t.scrollLeft);
    await next.click();
    await expect
      .poll(() => track.evaluate((t) => t.scrollLeft))
      .toBeGreaterThan(x0);
  }
  const card = car.locator('.svc_card[data-sheet="brows"]');
  await card.evaluate((e) =>
    e.scrollIntoView({ block: 'center', inline: 'center' }),
  );
  await card.click();
  await expect(
    page.locator('dialog.svc_sheet[open] .svc_sheet_title'),
  ).toHaveText(/брови/i);
});

test('SERVICES carousel: five photos of one size on one line, no card lifted by the reveal (Dana 16.11)', async ({
  page,
}) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/uk');
    const car = page.locator('#services-carousel');
    await car.scrollIntoViewIfNeeded();
    // «Фото пожалуйста поставьте на одной высоте»: AutoReveal leaves the row alone (data-rv-skip)
    await expect(car.locator('.svc_carousel_track [data-rv]')).toHaveCount(0);
    const frames = await car.locator('.svc_card_media').evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return [r.top, r.width, r.height].map(Math.round).join(' ');
      }),
    );
    expect(frames, `@${width}`).toHaveLength(5);
    expect(new Set(frames).size, `@${width}: ${frames.join(' | ')}`).toBe(1);
  }
});

test('ABOUT US plays its own clip once in view, the button pauses it', async ({
  page,
  browserName,
}) => {
  const block = page.locator('.about_video');
  const video = block.locator('video');
  await expect(video).not.toHaveAttribute('src', /.+/);
  await block.scrollIntoViewIfNeeded();
  // Dana 17.11: the process cut in one uniform replaces the reel cut «в разной одежде»
  await expect(video).toHaveAttribute('src', /About_Process\.mp4$/);
  await expect(video).not.toHaveAttribute('src', /About_Salon/);
  await expect(video).toHaveAttribute('poster', /About_Process_Poster\.webp$/);
  await expect(block.locator('h2')).toHaveText(/про нас/i);
  if (browserName === 'chromium') {
    await expect
      .poll(() => video.evaluate((v) => (v as HTMLVideoElement).paused))
      .toBe(false);
    await block.locator('.about_video_toggle').click();
    await expect
      .poll(() => video.evaluate((v) => (v as HTMLVideoElement).paused))
      .toBe(true);
  }
});

/* ---- Inbox 08.11.2026 (owner's five points) ---- */

/* The strand checks of 08.11 (no strand over a heading) are gone with the strands: 16.11 the corners
   went (Daryna «ці білі елементи виглядають дивно»), then the dividers (Dana «их нужно прямые
   попробовать сделать (или чем то заменить)»; the owner: the client wants the hair decoration removed). */

/** The sections a `StrandDivider` stood between until 16.11 — now direct neighbours. */
const FORMER_DIVIDERS = [
  ['/uk', '.stats_sec', '.salon_teaser'],
  ['/uk/about', '.philosophy_sec', '.recognition_sec'],
  ['/uk/salon', '.services_sec', '.portfolio_sec'],
  ['/uk/courses', '.platform_sec', '.catalog_sec'],
  ['/uk/contacts', '.contacts_sec', '.location_sec'],
] as const;

test('no hair-strand decoration on any page; the sections it parted meet at the normal spacing (client 16.11)', async ({
  page,
}) => {
  // reduced motion: AutoReveal moves nothing, so the boxes are where the layout puts them
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [path, above, below] of FORMER_DIVIDERS) {
    await page.goto(path);
    await expect(
      page.locator('.dec_strands, .dec_divider, .dec_corner, .dec_live'),
      path,
    ).toHaveCount(0);
    const gap = await page.evaluate(
      ([a, b]) => {
        const A = document.querySelector(a)!.getBoundingClientRect();
        const B = document.querySelector(b)!.getBoundingClientRect();
        return Math.round(B.top - A.bottom);
      },
      [above, below],
    );
    // no strip between them: the space is the two sections' own padding (.sec, layout.css)
    expect(gap, `${path}: ${above} → ${below}`).toBe(0);
  }
});

test('the first screens of / and /salon have no script line; /courses keeps its own (owner 08.11)', async ({
  page,
}) => {
  for (const path of ['/uk', '/uk/salon', '/pl', '/pl/salon', '/en/salon']) {
    await page.goto(path);
    await expect(page.locator('.hv_screen')).toBeVisible();
    await expect(page.locator('.hv_script'), path).toHaveCount(0);
  }
  await page.goto('/uk/courses');
  await expect(page.locator('.hv_script')).toHaveText('твій шлях у професію');
});

test('/salon shows the five masters right above the booking channels; their button lands there (owner 08.11)', async ({
  page,
}) => {
  await page.goto('/uk/salon');
  const masters = page.locator('#masters');
  await expect(masters.locator('.master_card')).toHaveCount(5);
  // «Як записатися» follows the cards inside the same block — nothing between them
  const next = await masters.evaluate(
    (s) => s.querySelector('.masters_grid')?.nextElementSibling?.id ?? '',
  );
  expect(next).toBe('booking');
  await expect(masters.locator('#booking .booking_btn')).not.toHaveCount(0);
  await expect(page.locator('#booking')).toHaveCount(1);
  await masters.locator('.sec_head_row .btn').click();
  await expect(page).toHaveURL(/#booking$/);
  await expect(page.locator('#booking')).toBeInViewport();
});

test('shoot photos in four more places: /about «Життя студії», /contacts reception, the course author, home «Про нас» (owner 08.11)', async ({
  page,
}) => {
  const loaded = async (sel: string, src: RegExp) => {
    const im = page.locator(sel);
    await im.scrollIntoViewIfNeeded();
    await expect(im).toHaveAttribute('src', src);
    await expect(im).toHaveAttribute('alt', /\S/);
    await expect
      .poll(() => im.evaluate((e: HTMLImageElement) => e.naturalWidth))
      .toBeGreaterThan(0);
  };
  await page.goto('/uk/about');
  const life = page.locator('#studio-life');
  await expect(life.locator('h2')).toHaveText('Життя студії');
  await expect(life.locator('.life_tile img')).toHaveCount(6);
  for (let i = 0; i < 6; i++)
    await loaded(
      `#studio-life .life_tile:nth-child(${i + 1}) img`,
      /Studio_Life_(0[89]|1[0-3])/, // 16.11: the salon full of clients (Dana; 13 = BT9A4115, her 13:22 pick)
    );
  // the bento: the wide frames take two columns, every tile in a row is the same height
  const boxes = await life
    .locator('.life_tile')
    // offset*: the layout, not the reveal animation (a tile still waiting sits at scale 1.04)
    .evaluateAll((els) =>
      els.map((e) => [
        (e as HTMLElement).offsetTop,
        (e as HTMLElement).offsetHeight,
      ]),
    );
  expect(new Set(boxes.slice(0, 3).map((b) => b.join())).size).toBe(1);
  expect(new Set(boxes.slice(3).map((b) => b.join())).size).toBe(1);
  await page.goto('/uk/contacts');
  await loaded('.contacts_strip li:nth-child(2) img', /Reception_01/);
  await page.goto('/uk/courses/microcapsule-extension');
  await loaded('.author_img_1 img', /Dana_05/);
  await page.goto('/uk');
  // Maryna 17.11: Nika's inset → Dana (the text beside it is about her)
  await loaded('.about_short_small', /Dana_06/);
  await expect(page.locator('.about_short_small')).not.toHaveAttribute(
    'src',
    /Nika_04/,
  );
});

test('album «робочий процес» (owner 08.11): the visit steps on /salon, the storefront on /contacts and /salon, shoot frames instead of the phone photos on /about', async ({
  page,
}) => {
  const loaded = async (sel: string, src: RegExp) => {
    const im = page.locator(sel);
    await im.scrollIntoViewIfNeeded();
    await expect(im).toHaveAttribute('src', src);
    await expect(im).toHaveAttribute('alt', /\S/);
    await expect
      .poll(() => im.evaluate((e: HTMLImageElement) => e.naturalWidth))
      .toBeGreaterThan(0);
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/uk/salon');
  // the steps sit between the works and the reviews
  const order = await page.evaluate(() =>
    ['#portfolio', '#visit', '.reviews_sec'].map(
      (s) => document.querySelector(s)?.getBoundingClientRect().top ?? -1,
    ),
  );
  expect(order[0]).toBeGreaterThan(0);
  expect(order[0]).toBeLessThan(order[1]);
  expect(order[1]).toBeLessThan(order[2]);
  const visit = page.locator('#visit');
  await expect(visit.locator('h2')).toHaveText('Як проходить візит');
  await expect(visit.locator('.visit_step')).toHaveCount(5);
  await expect(visit.locator('.visit_num').first()).toHaveText('01/');
  for (let i = 1; i <= 5; i++)
    await loaded(`#visit .visit_step:nth-child(${i}) img`, /Visit_0\d/);
  // from 1200 px all five in one row, the same width
  const boxes = await visit
    .locator('.visit_photo')
    .evaluateAll((els) =>
      els.map((e) => [
        (e as HTMLElement).offsetTop,
        (e as HTMLElement).offsetWidth,
      ]),
    );
  expect(new Set(boxes.map((b) => b.join())).size).toBe(1);
  await loaded('#location .location_door img', /Storefront_01/);
  await expect(page.locator('#location figcaption')).toHaveText(
    'Вхід з вулиці — під вивіскою DEMO',
  );
  await page.goto('/uk/contacts');
  await loaded('.contacts_strip li:first-child img', /Storefront_01/);
  // the storefront spans two of six columns and keeps the row's height
  const [wide, tile] = await page
    .locator('.contacts_strip li')
    .evaluateAll((els) =>
      els
        .slice(0, 2)
        .map((e) => [
          (e as HTMLElement).offsetWidth,
          (e as HTMLElement).offsetHeight,
        ]),
    );
  expect(wide[0]).toBeGreaterThan(tile[0] * 1.9);
  expect(Math.abs(wide[1] - tile[1])).toBeLessThanOrEqual(1);
  await expect(page.locator('.contacts_strip li')).toHaveCount(5);
  await page.goto('/uk/about');
  // the hero inset shows only in ?skin=classic (the default skin hides the decor), so: the file only
  await expect(page.locator('.sig_hero_inset img')).toHaveAttribute(
    'src',
    /Interior_03/, // 16.11: the photographer's edit
  );
  await loaded('.philosophy_img_1 img', /Extension_Work_02/); // 16.11: the photographer's edit
  await expect(
    page.locator('img[src*="Salon_Interior_01"], img[src*="Process_03"]'),
  ).toHaveCount(0);
});

/* ---- Daryna's design remarks 16.11.2026 (Telegram, «Demo Beauty») ---- */

test('header: the logo alone, no «STUDIO DEMO» beside it (Daryna 16.11)', async ({
  page,
}) => {
  for (const path of ['/uk', '/uk/about', '/uk/courses']) {
    await page.goto(path);
    const brand = page.locator('header .header_brand').first();
    await expect(brand.locator('img.logo_mark:visible').first()).toBeVisible();
    await expect(brand.locator('.header_brand_text')).toHaveCount(0);
    await expect(brand).toHaveAttribute('aria-label', /.+/);
  }
});

test('buttons: deep grey fill, no pink outline; white on hover in dark sections (Daryna 16.11)', async ({
  page,
}) => {
  await page.goto('/uk/salon');
  const cta = page.locator('.hv_cta');
  const look = () =>
    cta.evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.backgroundColor, cs.borderTopColor];
    });
  expect(await look()).toEqual(['rgb(38, 35, 34)', 'rgb(38, 35, 34)']);
  const pf = page.locator('#portfolio .sec_head_row .btn');
  await pf.scrollIntoViewIfNeeded();
  await pf.hover();
  await expect(pf).toHaveCSS('background-color', 'rgb(251, 251, 251)');
});

test('/about: the new first-screen head, two buttons of one size (Daryna 16.11)', async ({
  page,
}) => {
  await page.goto('/uk/about');
  await expect(page.locator('h1')).toHaveText(
    'Простір досконалої краси та професійного авторського навчання',
  );
  const w = await page
    .locator('.sig_hero .hero_actions > .btn')
    .evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().width)),
    );
  expect(w).toHaveLength(2);
  expect(Math.abs(w[0] - w[1])).toBeLessThanOrEqual(1);
});

test('/courses: smaller script head with the «real models» line; card buttons of one width, no stack shadow (Daryna 16.11)', async ({
  page,
}) => {
  await page.goto('/uk/courses');
  await expect(page.locator('.hv_sub')).toHaveText(
    'Відпрацювання технік під керівництвом досвідчених майстрів на реальних моделях',
  );
  const size = await page
    .locator('.hv_script')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeLessThanOrEqual(40);
  await expect(page.locator('.catalog_item.hv-depth-stack')).toHaveCount(0);
  const rows = await page
    .locator('.catalog_actions')
    .evaluateAll((els) =>
      els.map((a) =>
        [...a.querySelectorAll('.btn')].map((b) =>
          Math.round(b.getBoundingClientRect().width),
        ),
      ),
    );
  expect(rows.length).toBeGreaterThan(0);
  for (const r of rows.filter((x) => x.length === 2))
    expect(Math.abs(r[0] - r[1])).toBeLessThanOrEqual(1);
});
