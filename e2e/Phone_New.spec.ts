import { expect, test } from '@playwright/test';

import { rejectCookies } from './Helpers';

/**
 * Phone-only blocks of 31.10–1.11.2026: the bottom bar Салон | Курси (DEMO badge gone 16.11), languages in the
 * burger, the gallery viewer over the bar, the portfolio swipe. Runs on Pixel (Chromium) and on
 * iPhone (WebKit) — the owner and the clients look at the site from an iPhone.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/uk');
  await rejectCookies(page);
});

test('bottom bar: Салон and Курси lead to their pages and mark the current one', async ({
  page,
}) => {
  const bar = page.locator('.bottom_bar');
  await expect(bar).toBeVisible();
  await bar.locator('.bottom_bar_tab--academy').click();
  await expect(page).toHaveURL(/\/uk\/courses$/);
  await expect(bar.locator('.bottom_bar_tab--academy')).toHaveAttribute(
    'aria-current',
    'page',
  );
  await bar.locator('.bottom_bar_tab--salon').click();
  await expect(page).toHaveURL(/\/uk\/salon$/);
  await expect(bar.locator('.bottom_bar_tab--salon')).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('languages live in the burger; the floating pill is gone on phones', async ({
  page,
}) => {
  await expect(page.locator('.lang_pill')).toBeHidden();
  await page.locator('header button[aria-expanded]').first().click();
  const row = page.locator('.lang_row a');
  await expect(row).toHaveCount(3);
  await row.filter({ hasText: 'PL' }).click();
  await expect(page).toHaveURL(/\/pl(\/|$)/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
});

test('the gallery viewer covers the bottom bar while it is open', async ({
  page,
}) => {
  await page.goto('/uk/courses');
  const img = page.locator('[data-gallery] img').first();
  // centre it: at the bottom edge the fixed bar would take the tap
  await img.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await img.click();
  await expect(page.locator('.lb.is-open')).toBeVisible();
  await expect(page.locator('.bottom_bar')).toBeHidden();
  await page.locator('.lb__close').click();
  await expect(page.locator('.lb.is-open')).toHaveCount(0);
  await expect(page.locator('.bottom_bar')).toBeVisible();
});

test('the first screen keeps its main button above the fold', async ({
  page,
}) => {
  for (const path of ['/uk/salon', '/uk/courses']) {
    await page.goto(path);
    await expect(page.locator('.hv_cta')).toBeInViewport();
  }
});

test('portfolio viewer: a finger swipe goes to the next photo', async ({
  page,
  browserName,
}) => {
  // Touch is synthesised through the Chrome DevTools protocol; WebKit has no equivalent here.
  test.skip(browserName !== 'chromium', 'CDP touch is Chromium-only');
  await page.goto('/uk/salon');
  const tile = page.locator('.ix-flip__link').first();
  await tile.scrollIntoViewIfNeeded();
  await tile.click();
  const stage = page.locator('.ix-flip__stage.is-open');
  await expect(stage).toContainText(/1\s*\/\s*\d+/);
  const box = (await stage.boundingBox())!;
  const y = box.y + box.height / 2;
  const x1 = box.x + box.width * 0.8;
  const x2 = box.x + box.width * 0.2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: x1, y }],
  });
  for (let i = 1; i <= 8; i++)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x1 + ((x2 - x1) * i) / 8, y }],
    });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect(stage).toContainText(/2\s*\/\s*\d+/);
});

test('after scrolling, the burger opens and the same button closes it (owner 01.11.2026)', async ({
  page,
}) => {
  for (const path of ['/uk/courses', '/uk/salon']) {
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, 2500));
    const burger = page.locator('.bm-toggle');
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    const box = await burger.boundingBox();
    expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
  }
});

test('/about on a phone: button labels never split mid-word and the hover photo stays hidden (07.11.2026)', async ({
  page,
}) => {
  await page.goto('/uk/about');
  // both first-screen buttons are clear of the bottom bar and its round badge (it covered «Обрати курс»)
  for (const btn of await page.locator('.sig_hero .btn').all()) {
    const free = await btn.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return [
        // pill ends: the bottom of each rounded end (a point in the cut-off corner is not the button)
        [r.left + r.height / 2, r.bottom - 4],
        [r.right - r.height / 2, r.bottom - 4],
      ].every(([x, y]) => el.contains(document.elementFromPoint(x, y)));
    });
    expect(free).toBe(true);
  }
  // every word of the card buttons and the booking channels sits on one line («Подзвони/ти» was the bug)
  const split = await page
    .locator('#masters .ui-card__actions .btn, .booking_btn')
    .evaluateAll((els) =>
      els.flatMap((el) => {
        const out: string[] = [];
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode())
          for (const m of (n.textContent ?? '').matchAll(/\S+/g)) {
            const r = document.createRange();
            r.setStart(n, m.index ?? 0);
            r.setEnd(n, (m.index ?? 0) + m[0].length);
            const tops = new Set(
              [...r.getClientRects()]
                .filter((x) => x.width > 0.5)
                .map((x) => Math.round(x.top)),
            );
            if (tops.size > 1) out.push(m[0]);
          }
        return out;
      }),
    );
  expect(split).toEqual([]);
  await expect(page.locator('#masters .master_photo_alt').first()).toHaveCSS(
    'opacity',
    '0',
  );
});

test('/about «Життя студії» on a phone: one swipe row, the page itself never scrolls sideways (08.11.2026)', async ({
  page,
}) => {
  await page.goto('/uk/about');
  const row = page.locator('#studio-life .life_grid');
  await row.scrollIntoViewIfNeeded();
  const m = await row.evaluate((el) => ({
    sw: el.scrollWidth,
    cw: el.clientWidth,
    // offsetTop: the layout row, not the reveal animation (tiles off-screen wait at scale 1.04)
    tops: [...el.children].map((c) => (c as HTMLElement).offsetTop),
    page: document.documentElement.scrollWidth - innerWidth,
  }));
  expect(m.sw).toBeGreaterThan(m.cw); // more frames than the screen holds
  expect(new Set(m.tops).size).toBe(1); // one row
  expect(m.page).toBeLessThanOrEqual(0);
});

test('/salon «Як проходить візит» on a phone: one swipe row of five steps; /contacts storefront spans the row (08.11.2026)', async ({
  page,
}) => {
  await page.goto('/uk/salon');
  const row = page.locator('#visit .visit_row');
  await row.scrollIntoViewIfNeeded();
  const m = await row.evaluate((el) => ({
    n: el.children.length,
    sw: el.scrollWidth,
    cw: el.clientWidth,
    tops: [...el.children].map((c) => (c as HTMLElement).offsetTop),
    page: document.documentElement.scrollWidth - innerWidth,
  }));
  expect(m.n).toBe(5);
  expect(m.sw).toBeGreaterThan(m.cw);
  expect(new Set(m.tops).size).toBe(1);
  expect(m.page).toBeLessThanOrEqual(0);
  await page.goto('/uk/contacts');
  const strip = page.locator('.contacts_strip');
  await strip.scrollIntoViewIfNeeded();
  const s = await strip.evaluate((el) => {
    const [a, b] = [...el.children] as HTMLElement[];
    return {
      w: el.clientWidth,
      a: a.offsetWidth,
      ah: a.offsetHeight,
      b: b.offsetWidth,
    };
  });
  expect(s.a).toBe(s.w); // the storefront: the full row
  expect(Math.abs(s.ah - (s.a * 9) / 16)).toBeLessThanOrEqual(2); // 16:9
  expect(s.b).toBeLessThan(s.w * 0.55); // then two per row
});

test('on a phone no hair-strand decoration is left on any page (client 16.11.2026)', async ({
  page,
}) => {
  // the 08.11 check «strands stay above the headings» went with the strands (corners and dividers)
  for (const path of [
    '/uk',
    '/uk/about',
    '/uk/salon',
    '/uk/courses',
    '/uk/contacts',
  ]) {
    await page.goto(path);
    await expect(
      page.locator('.dec_strands, .dec_divider, .dec_corner, .dec_live'),
      path,
    ).toHaveCount(0);
  }
});

/* ---- Daryna's design remarks 16.11.2026 ---- */

test('bottom bar: two equal halves, no DEMO badge, icon and label centred in each (Daryna 16.11)', async ({
  page,
}) => {
  const bar = page.locator('.bottom_bar');
  await expect(bar).toBeVisible();
  await expect(bar.locator('a')).toHaveCount(2);
  const off = await bar.evaluate((nav) => {
    const w = window.innerWidth;
    return [...nav.querySelectorAll('.bottom_bar_tab')].map((tab, i) => {
      const centre = (w / 2) * i + w / 4;
      return [
        tab.querySelector('.bottom_bar_icon')!,
        tab.querySelector('.bottom_bar_label')!,
      ].map((el) => {
        const r = el.getBoundingClientRect();
        return Math.round(Math.abs(r.left + r.width / 2 - centre));
      });
    });
  });
  for (const pair of off)
    for (const d of pair) expect(d).toBeLessThanOrEqual(2);
});

test('/courses benefits swipe sideways on a phone (Daryna 16.11: «не можу перегорнути»)', async ({
  page,
}) => {
  await page.goto('/uk/courses');
  const list = page.locator('#benefits .pb_list');
  await list.scrollIntoViewIfNeeded();
  const moved = await list.evaluate(async (el) => {
    if (el.scrollWidth <= el.clientWidth) return -1;
    el.scrollBy({
      left: el.clientWidth,
      behavior: 'instant' as ScrollBehavior,
    });
    await new Promise((r) => setTimeout(r, 300));
    return el.scrollLeft;
  });
  expect(moved).toBeGreaterThan(100);
});

test('/about on a phone: the two first-screen buttons are one size (Daryna 16.11)', async ({
  page,
}) => {
  await page.goto('/uk/about');
  const w = await page
    .locator('.sig_hero .hero_actions > .btn')
    .evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().width)),
    );
  expect(w).toHaveLength(2);
  expect(Math.abs(w[0] - w[1])).toBeLessThanOrEqual(1);
});
