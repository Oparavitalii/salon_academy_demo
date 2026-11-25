import { COURSE_SLUG, INTENSIVE_SLUG } from '@/lib/content/site';

/**
 * Conditional course prices (owner, chat 19.10.2026): seeded into `course_tiers` with
 * `price_is_placeholder = true`; the owner replaces them in /admin/courses. Also the public
 * fallback when the database is unreachable at build or run time. PLN, minor units (grosze).
 */
export const SEED_PRICES: Record<string, Record<string, number>> = {
  [COURSE_SLUG]: { basic: 99000, middle: 149000, mentoring: 249000 },
  [INTENSIVE_SLUG]: { intensive: 350000 },
};

/** 149000 → «1 490 zł» (PLN, no decimals when whole). */
export function formatPln(minor: number): string {
  const zl = minor / 100;
  const whole = Number.isInteger(zl);
  const [int, frac] = zl.toFixed(whole ? 0 : 2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped}${frac ? `,${frac}` : ''} zł`;
}
