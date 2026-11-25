import type { Localized } from '@/i18n/routing';

/**
 * Salon directions (Daryna 03.11.2026): a tile or a carousel card opens the full list of the
 * direction's services with prices («натиснути на Фарбування або Догляд, щоб відкривався повний
 * перелік відповідних послуг із цінами»). One direction = one or more groups of `serviceGroups`;
 * the rows are the same as on `/salon` (`rowsOf` + the prices edited in the admin) — built
 * server-side in `directionSheets.ts`; this file is data only (safe to import anywhere).
 */
export type DirectionId = 'extensions' | 'colour' | 'care' | 'cut' | 'brows';

export type Direction = {
  id: DirectionId;
  title: Localized;
  sub: Localized;
  /** Hero tile photo (4:5). */
  image: string;
  /**
   * Carousel photo — a different frame, so the home page does not repeat the first screen. Dana 16.11
   * («много обрезаных волос и сверху пространство»): frames with the whole length in the 4:5 card —
   * head near the top edge, the ends inside (Narosh_10, Farb_25, Blonde_Back_01).
   */
  cardImage: string;
  /**
   * A short silent loop shown in the carousel card instead of the photo (the photo stays as the data fallback).
   * B-117 · Dana 16.11 12:51 «Эту работу поставить в уход» (IMG_1370.MOV): 6 s at 1:14, 720×960, H.264, no sound.
   */
  cardVideo?: { src: string; poster: string };
  groups: string[];
};

export const directions: Direction[] = [
  {
    id: 'extensions',
    title: {
      uk: 'Нарощування',
      pl: 'Przedłużanie',
      en: 'Extensions',
    },
    sub: {
      uk: 'мікрокапсули · волоскове',
      pl: 'mikrokapsułki · włos po włosie',
      en: 'micro-capsules · strand by strand',
    },
    image: 'Salon_Works/Narosh_Daryna_01.webp', // Daryna 22.11 «Там де нарощення» (was Narosh_08)
    cardImage: 'Salon_Works/Narosh_10.webp',
    groups: ['microcapsule'],
  },
  {
    id: 'colour',
    title: {
      uk: 'Фарбування',
      pl: 'Koloryzacja',
      en: 'Colouring',
    },
    sub: {
      uk: 'AirTouch · балаяж · тонування',
      pl: 'AirTouch · balayage · tonowanie',
      en: 'AirTouch · balayage · toning',
    },
    image: 'Salon_Works/Farb_Daryna_01.webp', // Daryna 22.11 «Фарбування» (IMG_5369; was Farb_15)
    cardImage: 'Salon_Works/Farb_25.webp',
    groups: ['one-tone', 'complex', 'blond'],
  },
  {
    id: 'care',
    title: { uk: 'Догляд', pl: 'Pielęgnacja', en: 'Hair care' },
    sub: {
      uk: 'кератин · ботокс · реконструкція',
      pl: 'keratyna · botoks · rekonstrukcja',
      en: 'keratin · botox · reconstruction',
    },
    // 16.11 (Dana «меняем все фотографии, которые сделал фотограф»): the tile was a phone portrait
    // (Salon_Hero_03) → the photographer's frame of washing at the basin (BT9A4587).
    // 16.11 check run «Chat_1611_Verify» (R-21, Dana 12:33 «много обрезаных волос»): the card's Dohliad_07 cut the hair at
    // both ends → Blonde_Back_01 (BT9A4609: the head near the top, the ends inside, a shoot frame), until the client's video.
    image: 'Salon_Works/Dohliad_Daryna_01.webp', // Daryna 22.11 «Догляд» (was Care_Wash_01)
    cardImage: 'Salon_Space/Blonde_Back_01.webp',
    cardVideo: {
      src: '/video/Care_Result.mp4',
      poster: '/video/Care_Result_Poster.webp',
    },
    groups: ['repair', 'care'],
  },
  {
    id: 'cut',
    title: { uk: 'Стрижки', pl: 'Strzyżenie', en: 'Haircuts' },
    sub: {
      uk: 'стрижка · укладка · чубчик',
      pl: 'cięcie · stylizacja · grzywka',
      en: 'cut · styling · fringe',
    },
    // Dana 16.11 13:20 «Вот этот кадр в стрижки поставите пожалуйста» → the card is that frame (BT9A4180:
    // the master behind the client with finished waves); the first-screen tile is its neighbour BT9A4181,
    // cut closer on the two of them, so the home page does not show one frame twice.
    image: 'Salon_Space/Cut_Work_02.webp',
    cardImage: 'Salon_Space/Cut_Work_01.webp',
    groups: ['cut', 'styling'],
  },
  {
    id: 'brows',
    title: {
      uk: 'Брови та вії',
      pl: 'Brwi i rzęsy',
      en: 'Brows & lashes',
    },
    sub: {
      uk: 'корекція · фарбування · ламінування',
      pl: 'regulacja · henna · laminacja',
      en: 'shaping · tinting · lamination',
    },
    image: 'Salon_Works/Brows_01.webp',
    cardImage: 'Salon_Works/Brows_01.webp',
    groups: ['brows'],
  },
];

export const directionById = (id: DirectionId) =>
  directions.find((d) => d.id === id)!;

/** The ✕ of the price sheet. */
export const sheetClose: Localized = {
  uk: 'Закрити',
  pl: 'Zamknij',
  en: 'Close',
};
