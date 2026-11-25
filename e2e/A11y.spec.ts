import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { rejectCookies } from './Helpers';

/**
 * Accessibility (axe-core, WCAG 2.1 A/AA) on the public pages. Fails on «serious» and «critical»
 * findings; «moderate» and «minor» are listed in the report, not blocking. The hero videos and the
 * ticker (removed 06.11) are decorative motion — excluded from the scan so a frame mid-animation cannot flake it.
 */
// Reveal-on-scroll fades would be scanned mid-fade (a false contrast failure): motion off.
test.use({ reducedMotion: 'reduce' });

const PAGES = [
  '/uk',
  '/uk/salon',
  '/uk/courses',
  '/uk/courses/microcapsule-intensive',
  '/uk/courses/microcapsule-extension',
  '/uk/courses/personal-mentoring', // its own page (Dana 16.11)
  '/uk/about',
  '/uk/contacts',
  '/uk/privacy',
];

for (const path of PAGES)
  test(`no serious accessibility problems on ${path}`, async ({ page }) => {
    await page.goto(path);
    await rejectCookies(page);
    await page.waitForTimeout(600);
    const res = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.hv_video')
      .analyze();
    const bad = res.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map(
        (v) =>
          `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes
            .slice(0, 3)
            .map((n) => n.target.join(' '))
            .join(' | ')}`,
      );
    expect(bad, bad.join('\n')).toEqual([]);
  });
