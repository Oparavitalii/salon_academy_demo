import { existsSync } from 'node:fs';

import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

import sitemap from '@/app/sitemap';
import type { Localized } from '@/i18n/routing';
import {
  catalog,
  courseDetails,
  courseKind,
  coursePageSlugs,
  mentoringCourse,
} from '@/lib/content/courses';
import type { Pic } from '@/lib/content/home';
import { img } from '@/lib/content/images';
import { MENTORING_SLUG } from '@/lib/content/site';
import { getCourseView } from '@/lib/courses/public';

/**
 * The academy content after 16.11: the personal mentoring course (Dana 16.11 — one format, two prices,
 * her own text) and the course shoot 09.11 photos (Q-47). Pure content checks — no DB, no server.
 */
vi.mock('@/lib/db/client', () => ({ db: {}, hasDb: false }));

const nb = (s: string) => s.replace(/\s+/g, ' ');

/** Every `{ uk, pl, en }` inside a value. */
function localized(v: unknown, out: Localized[] = []): Localized[] {
  if (Array.isArray(v)) v.forEach((x) => localized(x, out));
  else if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (['uk', 'pl', 'en'].every((k) => typeof o[k] === 'string'))
      out.push(o as Localized);
    else Object.values(o).forEach((x) => localized(x, out));
  }
  return out;
}

/** Every `{ src, alt }` photo inside a value. */
function pics(v: unknown, out: Pic[] = []): Pic[] {
  if (Array.isArray(v)) v.forEach((x) => pics(x, out));
  else if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.src === 'string' && o.alt) out.push(o as Pic);
    else Object.values(o).forEach((x) => pics(x, out));
  }
  return out;
}

describe('personal mentoring (Dana 16.11)', () => {
  it('is the last catalog card and every catalog card has a page', () => {
    expect(catalog.map((k) => k.slug).at(-1)).toBe(MENTORING_SLUG);
    expect(catalog).toHaveLength(5);
    for (const k of catalog) expect(coursePageSlugs).toContain(k.slug);
    expect(new Set(coursePageSlugs).size).toBe(coursePageSlugs.length);
  });

  it('is offline, like the intensives: the filter counts 5 · online 2 · offline 3', () => {
    expect(courseKind(MENTORING_SLUG)).toBe('offline');
    const kinds = catalog.map((k) => courseKind(k.slug));
    expect(kinds.filter((k) => k === 'online')).toHaveLength(2);
    expect(kinds.filter((k) => k === 'offline')).toHaveLength(3);
    // the two-format courses keep their kind
    for (const d of courseDetails)
      expect(courseKind(d.slug)).toBe(
        d.format === 'intensive' ? 'offline' : 'online',
      );
  });

  it('shows both prices on its page and «від 2 000 €» in the one-price slot', () => {
    const card = catalog.find((k) => k.slug === MENTORING_SLUG)!;
    expect(nb(card.price.uk)).toBe('від 2 000 €');
    expect(card.price.en).toBe('from €2,000');
    expect(nb(card.body.uk)).toContain('2 дні — 2 000 €, 3 дні — 3 000 €');
    expect(
      mentoringCourse.options.map((o) => `${o.days.uk} — ${nb(o.price.uk)}`),
    ).toEqual(['2 дні — 2 000 €', '3 дні — 3 000 €']);
    expect(mentoringCourse.options.map((o) => o.price.en)).toEqual([
      '€2,000',
      '€3,000',
    ]);
    // her six «Что вы получаете» bullets, her six directions
    expect(mentoringCourse.gets.items).toHaveLength(6);
    expect(mentoringCourse.choice.directions).toHaveLength(6);
  });

  it('is written in all three languages: uk without Russian letters, capital «Ви», no emoji', () => {
    const card = catalog.find((k) => k.slug === MENTORING_SLUG)!;
    const all = localized([mentoringCourse, card]);
    expect(all.length).toBeGreaterThan(40);
    const lowerYou = (w: string) =>
      new RegExp(`(^|[^\\p{L}])(${w})(?![\\p{L}])`, 'u');
    for (const s of all) {
      for (const l of ['uk', 'pl', 'en'] as const)
        expect(s[l].trim(), JSON.stringify(s)).not.toBe('');
      expect(s.uk, s.uk).not.toMatch(/[ыэъё]/i);
      expect(s.uk, s.uk).not.toMatch(lowerYou('ви|вас|вам|вами|ваш\\p{L}*'));
      for (const l of ['uk', 'pl', 'en'] as const)
        expect(s[l], s[l]).not.toMatch(/\p{Extended_Pictographic}/u);
    }
    // «20 лет» → «20 років» (her number, not the site's «20+»)
    expect(mentoringCourse.hero.lead.uk).toContain('20 років');
  });

  it('is in the sitemap in every language', () => {
    const urls = sitemap().map((e) => e.url);
    for (const l of ['uk', 'pl', 'en'])
      expect(urls).toContain(
        `https://example.com/${l}/courses/personal-mentoring`,
      );
  });

  it('shows without a DB (static fallback) — on a live DB it needs its row (db:sync-catalog)', async () => {
    const view = await getCourseView();
    expect(view.available.has(MENTORING_SLUG)).toBe(true);
  });
});

describe('course shoot 09.11 (Q-47)', () => {
  const photos = pics([catalog, courseDetails, mentoringCourse]);

  it('every academy photo is registered, on disk and of its registered size', async () => {
    expect(photos.length).toBeGreaterThan(40);
    for (const src of new Set(photos.map((p) => p.src))) {
      const a = img(src);
      const file = `public/images/${src}`;
      expect(existsSync(file), file).toBe(true);
      const m = await sharp(file).metadata();
      expect([m.width, m.height], file).toEqual([a.width, a.height]);
    }
  });

  it('the phone photos are gone from the cards, the microcapsule pages and the mentoring', () => {
    const phone = /Course_Practice_0|Course_Teach_01|Academy_Hero_0[12]/;
    const micro = courseDetails.filter((d) =>
      ['microcapsule-extension', 'microcapsule-intensive'].includes(d.slug),
    );
    for (const p of pics([catalog, micro, mentoringCourse]))
      expect(p.src).not.toMatch(phone);
  });

  it('the catalog cards (and the first-screen tiles) open with a shoot frame, except the online reconstruction', () => {
    const first = Object.fromEntries(
      catalog.map((k) => [k.slug, k.images[0].src]),
    );
    expect(first).toMatchObject({
      'microcapsule-intensive': 'Academy/Practice_Capsule_04.webp', // Daryna 22.11: hands at work, not the talk
      'microcapsule-extension': 'Academy/Teach_Theory_01.webp',
      'reconstruction-intensive': 'Academy/Practice_Iron_01.webp',
      [MENTORING_SLUG]: 'Academy/Mentor_Model_01.webp',
    });
  });
});
