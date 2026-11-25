import type { Localized } from '@/i18n/routing';
import { uk4 } from '@/lib/i18n/t';

import type { Pic } from './home';

/**
 * `/contacts` — `9_Text+Images/9_Text.md` round 4 → «/uk/contacts» (CCt §1–§2 + E-25, E-11).
 * ContactCards (five cards; e-mail hello@example.com — Q-15, Nataliia 22.10) · Map `#map` (click-to-load,
 * «Маршрут», parking — Bk) · BookingChannels `#booking` (FR-23). No contact form (B-37).
 */

export const contactsPageCopy = {
  heading: uk4('Контакти Studio Demo'),
  /** `.dec_scribble` word of the H1 (8.0 §5): the brand word, the same in every locale. */
  scribble: uk4('Demo'),
  sub: uk4(
    "Зв'яжіться з нами зручним для Вас способом — ми завжди раді відповісти на запитання щодо процедур салону чи навчання",
  ),
};

/** Card titles — also the labels of the /salon Location block. */
export const contactLabels = {
  address: uk4('Адреса салону'),
  phone: uk4('Телефон'),
  phoneNote: uk4('Також WhatsApp, Telegram і SMS на цей номер'),
  hours: uk4('Години прийому'),
  email: uk4('Електронна пошта'),
  instagram: 'Instagram',
  salonWord: uk4('Салон'),
  coursesWord: uk4('курси'),
};

export const mapSectionCopy = {
  heading: uk4('Як нас знайти у Варшаві'),
  sub: uk4('Середмістя, lokal U1. Біля студії є паркування.'),
};

/** The storefront from the street (album «робочий процес», shoot 03.11): the DEMO sign over the
 * door and the logo with the phone on the window — what a client looks for on arrival. Shown first in
 * the /contacts strip and under the hours on /salon (owner 08.11: «проаналізуй де краще»). */
export const storefrontPhoto = {
  src: 'Salon_Space/Storefront_01.webp',
  alt: uk4('Фасад студії: вивіска DEMO над входом з вулиці'),
  caption: uk4('Вхід з вулиці — під вивіскою DEMO'),
};

/** `wide` = the storefront (a full row on phones, two columns from 768); `top` = framed from the top. */
export type StripPic = Pic & { tile?: 'wide' | 'top' };

/** Photo strip under the cards, in the order a client meets the studio: the street, the reception
 * (shoot 03.11, owner 08.11), then three works (9_Text.md → «Зображень на /contacts»). */
export const contactsPhotos: StripPic[] = [
  { src: storefrontPhoto.src, alt: storefrontPhoto.alt, tile: 'wide' },
  {
    src: 'Salon_Space/Reception_01.webp',
    alt: uk4('Рецепція салону з вивіскою DEMO'),
    tile: 'top',
  },
  ...[
    'Salon_Works/Narosh_12.webp',
    'Salon_Works/Farb_22.webp',
    'Salon_Works/Farb_06.webp',
  ].map(
    (src): StripPic => ({
      src,
      alt: uk4('Робота салону'),
    }),
  ),
];

export type ContactCardData = { id: string; title: Localized | string };
