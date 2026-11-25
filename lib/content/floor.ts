import { isDemoMode } from '@/lib/demo/mode';
import { uk4 } from '@/lib/i18n/t';

import { contacts } from './site';

/**
 * Release floor F3 (20.10.2026, owner): while online payment is off or the price is not
 * confirmed, «Оплата незабаром» becomes a working «Записатися на курс» to the academy's
 * Instagram Direct. Online checkout returns by itself once Stripe and the prices are live.
 */
export const enrolCopy = {
  cta: uk4('Записатися на курс'),
};

/** Testimonials track arrows (F6). */
export const trackCopy = {
  prev: uk4('Попередній відгук'),
  next: uk4('Наступний відгук'),
};

export const academyDirectUrl = isDemoMode()
  ? '/checkout/demo'
  : contacts.instagramAcademy.url;
