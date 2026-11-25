import type { Localized } from '@/i18n/routing';
import { uk4 } from '@/lib/i18n/t';

/**
 * Header, footer, contacts, booking channels — `9_Text+Images/9_Text.md` round 4 (22.10.2026) →
 * «Наскрізні». RU / PL / EN: the `ru · pl · en` lines of 9_Text.md → `lib/i18n/dict/*.json`.
 * Facts (E-25, 2.2_Brif_Full 21.10): phone +48 555 010 010 (also WhatsApp, Telegram, SMS), address
 * «ul. Przykładowa 1/lokal U1, 00-001 Warszawa», hours Mon–Sun 10:00–20:00.
 */

export type NavItem = { label: Localized; href: string };

export const brand = {
  name: 'Studio Demo',
  city: uk4('Варшава'),
  logoAltSalon: 'Studio Demo',
  logoWord: 'DEMO',
};

/** The real logo files (`docs/2_Brif/References/Logo/`) → WebP 480×480. Salon on the site, academy in the cabinet (CON-05). */
export const logos = {
  black: '/images/Logo/Logo_Black_Hair.webp',
  white: '/images/Logo/Logo_White_Hair.webp',
  /** Salon logo without the circle: transparent PNG 481×360 (Logo_White_Hair_3.jpg, ring cut) — light site header. */
  mark: '/images/Logo/Salon_Mark.png',
  /** The same mark with light ink (black lines → #fbfbfb, pink kept) — the dark salon header (06.11). */
  markLight: '/images/Logo/Salon_Mark_Light.png',
  markWidth: 481,
  markHeight: 360,
};

/** Address — the client's form (E-25), the same in every locale (a Polish address). */
export const address = {
  /** 9_Text.md → Footer / Location / ContactCards. */
  full: 'ul. Przykładowa 1/lokal U1, 00-001 Warszawa',
  line: 'Przykładowa 1/lokal U1, 00-001 Warszawa',
  card: 'Przykładowa 1/lokal U1, Warszawa',
  streetShort: 'ul. Przykładowa 1/lokal U1',
  postal: '00-001 Warszawa',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=ul.+Przykladowa+1,+00-001+Warszawa',
};

const PHONE = '+48 555 010 010';
const PHONE_E164 = '48555010010';

export const contacts = {
  instagramSalon: {
    handle: '@studio.demo',
    url: 'https://www.instagram.com/',
  },
  instagramAcademy: {
    handle: '@studio.demo.academy',
    url: 'https://www.instagram.com/',
  },
  booksy: 'https://booksy.com/',
  /** Decisions 22.10 «Telegram на кнопках запису»: the work number; confirmation Q-37 (non-blocking). */
  telegram: `https://t.me/+${PHONE_E164}` as string | null,
  whatsapp: `https://wa.me/${PHONE_E164}`,
  sms: `sms:+${PHONE_E164}`,
  phone: { label: PHONE, href: `tel:+${PHONE_E164}` },
  /** Q-15 (e-mail part) — Nataliia 22.10 17:16, Oksana's copy 26.10: the studio's mailbox. */
  email: 'hello@example.com' as string | null,
};

/** 9_Text.md → Footer «графік» (≤20). */
export const hoursShort = uk4('пн–нд 10:00–20:00');

/** 9_Text.md → Location / ContactCards «графік» (≤70). */
export const hoursLong = uk4('Понеділок — неділя: 10:00–20:00');

export const COURSE_SLUG = 'microcapsule-extension';
export const INTENSIVE_SLUG = 'microcapsule-intensive';
/** Course 2 — hair reconstruction, online + offline (Oksana's copy 26.10, owner 27.10). */
export const RECON_COURSE_SLUG = 'hair-reconstruction';
export const RECON_INTENSIVE_SLUG = 'reconstruction-intensive';
/** Personal mentoring — offline, one student, 2 or 3 days (Dana 16.11: «личное наставничество»). */
export const MENTORING_SLUG = 'personal-mentoring';

/** Header сайту — 9_Text.md → Наскрізні (nav ≤20). «Курси», not «Академія» (Decisions 22.10). */
export const siteNav: NavItem[] = [
  { label: uk4('Салон'), href: '/salon' },
  { label: uk4('Курси'), href: '/courses' },
  { label: uk4('Про нас'), href: '/about' },
  {
    label: uk4('Контакти'),
    href: '/contacts',
  },
];

/** Where «Записатися в салон» lands when the page has no channels block of its own (5.0 Navigation). */
export const BOOKING_HREF = '/contacts#booking';

export const footerCopy = {
  about: uk4(
    'Studio Demo — салон краси та академія нарощування волосся у Варшаві',
  ),
  route: uk4('Маршрут'),
  instagramSalon: uk4('Instagram салону'),
  privacy: uk4('Політика конфіденційності'),
  copyright: uk4('© 2026 Studio Demo. Усі права захищені.'),
  copyrightShort: '© 2026 Studio Demo',
  /** Column labels — screen-reader headings of the footer columns (our UI words). */
  navTitle: uk4('Навігація'),
  contactsTitle: uk4('Контакти'),
  docsTitle: uk4('Документи'),
};

/** BookingChannels → Contact24 — 9_Text.md → Наскрізні (FR-23). */
export const bookingCopy = {
  heading: uk4('Як записатися'),
  body: uk4(
    'Через Booksy або напряму: в Instagram, телефоном чи в месенджері. Якщо Ви прилітаєте з-за кордону і не користуєтеся Booksy — напишіть у будь-який месенджер.',
  ),
  call: uk4('Подзвонити'),
  caption: uk4('+48 555 010 010 · пн–нд 10:00–20:00'),
};

export type Channel = {
  id: 'booksy' | 'instagram' | 'phone' | 'whatsapp' | 'telegram' | 'sms';
  label: Localized | string;
  href: string;
};

/** Six channels in the 9_Text.md order. Telegram drops out when `contacts.telegram` is null (Q-37). */
export const bookingChannels: Channel[] = [
  { id: 'booksy', label: 'Booksy', href: contacts.booksy },
  { id: 'instagram', label: 'Instagram', href: contacts.instagramSalon.url },
  { id: 'phone', label: bookingCopy.call, href: contacts.phone.href },
  { id: 'whatsapp', label: 'WhatsApp', href: contacts.whatsapp },
  ...(contacts.telegram
    ? [{ id: 'telegram' as const, label: 'Telegram', href: contacts.telegram }]
    : []),
  { id: 'sms', label: 'SMS', href: contacts.sms },
];

/** Scribble (8.0 §5 `.dec_scribble`) — the one word of a heading that carries the pink swash. */
export type ScribbleWord = Localized;
