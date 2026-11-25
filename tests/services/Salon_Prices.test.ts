import { describe, expect, it } from 'vitest';

import { serviceGroups } from '@/lib/content/salon';
import { fromPrice, rowsOf } from '@/lib/services/rows';

/**
 * Salon price rows — /salon `#services` and the direction sheets both use `rowsOf` (Dana 16.11.2026
 * «Все цены нужно указать от / И химия от 400»). Every price reads «від …» once, before the whole
 * range, whether it comes from the content or from /admin/prices typed without «від»; pl / en
 * read «от» / «od» / «from»; the consultation rows keep their note. Pure: no DB — the admin value is
 * passed in the way /salon passes it.
 */
const all = serviceGroups.flatMap((g) => g.services);
const byId = (id: string) => {
  const s = all.find((x) => x.id === id);
  if (!s) throw new Error(`no service ${id}`);
  return s;
};
const admin = (masterPrice: string | null, topPrice: string | null = null) => ({
  masterPrice,
  topPrice,
  duration: null,
});

describe('fromPrice', () => {
  it('puts «від» once before the whole range', () => {
    expect(fromPrice('400 / 500 / 600 / 700 zł')).toBe(
      'від 400 / 500 / 600 / 700 zł',
    );
    expect(fromPrice('350 zł')).toBe('від 350 zł');
  });

  it('does not double a «from» that is already there, in any language', () => {
    for (const v of [
      'від 400 zł',
      'Від 400 zł',
      'от 400 zł',
      'od 400 zł',
      'from 400 zł',
    ])
      expect(fromPrice(v)).toBe(v);
  });

  it('leaves empty values and free text alone', () => {
    expect(fromPrice(null)).toBeNull();
    expect(fromPrice('')).toBe('');
    expect(fromPrice('за домовленістю')).toBe('за домовленістю');
  });
});

describe('rowsOf', () => {
  it('every content price reads «від …» once, in all three languages', () => {
    for (const [locale, from] of [
      ['uk', 'від'],
      ['pl', 'od'],
      ['en', 'from'],
    ] as const) {
      const prices = all
        .flatMap((s) => rowsOf(s, undefined, locale))
        .filter((r) => r.price && !r.priceIsNote)
        .map((r) => r.price as string);
      expect(prices.length).toBeGreaterThan(50);
      expect(
        prices.filter(
          (p) => !p.startsWith(`${from} `) || p.split(from).length !== 2,
        ),
      ).toEqual([]);
    }
  });

  it('men’s perm is «від 400 zł» by default (was 350 zł)', () => {
    const perm = byId('perm-men');
    expect(rowsOf(perm, undefined, 'uk')[0].price).toBe('від 400 zł');
    expect(rowsOf(perm, undefined, 'pl')[0].price).toBe('od 400 zł');
    expect(rowsOf(perm, undefined, 'en')[0].price).toBe('from 400 zł');
  });

  it('an /admin/prices value wins and gets «від»; one typed with «від» is not doubled', () => {
    const perm = byId('perm-men');
    expect(rowsOf(perm, admin('350 zł'), 'uk')[0].price).toBe('від 350 zł');
    expect(rowsOf(perm, admin('від 400 zł'), 'uk')[0].price).toBe('від 400 zł');
    const [keratin] = rowsOf(
      byId('keratin'),
      admin('400 / 500 / 600 / 700 zł'),
      'en',
    );
    expect(keratin.price).toBe('from 400 / 500 / 600 / 700 zł');
    expect(rowsOf(perm, admin(null), 'uk')[0].price).toBeNull();
  });

  it('the TOP row and the first-visit price read «від» too; the «+» surcharges stay as they are', () => {
    const [master, top] = rowsOf(byId('ext-100'), undefined, 'uk');
    expect(master.price).toBe('від 1 100 zł');
    expect(top.price).toBe('від 1 200 zł');
    expect(master.meta).toContain('перший візит від 990 zł');
    expect(master.meta).toContain('у 4 руки +200 zł');
    expect(top.meta).toContain('перший візит від 1 100 zł');
    expect(rowsOf(byId('ext-100'), undefined, 'en')[0].meta).toContain(
      'from 990 zł',
    );
    expect(
      rowsOf(byId('ext-100'), admin('1 100 zł', '1 200 zł'), 'uk')[1].price,
    ).toBe('від 1 200 zł');
  });

  it('the consultation rows keep their note, whatever the admin holds', () => {
    const [row] = rowsOf(byId('women-cut'), admin('200 zł'), 'uk');
    expect(row.priceIsNote).toBe(true);
    expect(row.price).toBe('ціну називаємо на консультації');
  });
});
