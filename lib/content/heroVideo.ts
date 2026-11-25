import type { Localized } from '@/i18n/routing';
import { type DirectionId, directionById } from '@/lib/services/directions';

import { academyCopy, catalog } from './courses';
import { heroHomeCopy } from './home';
import { salonCopy } from './salon';
import {
  COURSE_SLUG,
  INTENSIVE_SLUG,
  RECON_COURSE_SLUG,
  RECON_INTENSIVE_SLUG,
} from './site';

/**
 * HeroVideo — Daryna's first screen (her reference video, 30.10.2026, Telegram «Oksana Design»):
 * a vertical video, a script line, four tiles 2×2. The pink ticker and the Studio | Academy switch
 * were removed 06.11 (Daryna 03.11: «Пропоную один варіан навігації залишити» — the phone bottom bar
 * «Салон / Курси» stays).
 * Since 31.10 (owner: «головну салону і курсів теж зробити як головну сайту») it is the first screen
 * of `/`, `/salon` and `/courses` on every screen size; one copy per area below.
 */
export type HeroVideoArea = 'home' | 'salon' | 'academy';

export type HeroVideoTile = {
  title: Localized;
  sub: Localized;
  image: string;
  href: string;
  /** A course tile: hidden when the course is off in /admin/courses. */
  slug?: string;
  /** A salon tile: opens this direction's price list (Daryna 03.11); `href` stays the no-JS way. */
  sheet?: DirectionId;
};

export type HeroVideoAreaCopy = {
  /** `hls`: the adaptive ladder (public/video/hls/<Name>/index.m3u8); `src`: the light MP4 fallback. */
  video: { src: string; hls?: string; poster: string; label: Localized };
  /** The script line on the video — only the academy keeps one (owner 08.11: «прибрати … ваш б'юті простір» on `/` and `/salon`). */
  script?: Localized;
  /** One line under the script (academy — Daryna 16.11: practice on real models is «страх багатьох учениць»). */
  sub?: Localized;
  /** The page's one h1 (visually hidden — the video and the tiles say it). */
  h1: Localized;
  tiles: HeroVideoTile[];
  /** The page's main action, on the video (owner 1.11: the first screen kept its button). */
  cta?: { label: Localized; href: string };
};

/** First-screen clips from the chat videos, one theme per page (owner 23.11 «По темі сторінки»): home — the studio,
 * salon — the services and the result, academy — the craft. Daryna's IMG_3061 + Dana's process clips 17.11 + the care
 * result IMG_1370; no scene repeats between pages (Pilot_Run/Archive/2026_11_23_Oksana_Round/Tools/Cut_Hero_Clips.mjs).
 * ~9 s each, 576×1024, no sound. Desktop wall: three moments. */
const homeVideo = {
  src: '/video/Hero_Home_Cut.mp4',
  poster: '/video/Hero_Home_Cut_Poster.webp',
  label: {
    uk: 'Відео: студія Studio Demo — клієнтка, фольга, зал, рецепція',
    pl: 'Wideo: studio Studio Demo — klientka, folia, sala, recepcja',
    en: 'Video: Studio Demo — a client, foil, the floor, the reception',
  },
};

const salonVideo = {
  src: '/video/Hero_Salon_Cut.mp4',
  poster: '/video/Hero_Salon_Cut_Poster.webp',
  label: {
    uk: 'Відео: нарощування, фарбування й догляд у Studio Demo',
    pl: 'Wideo: przedłużanie, koloryzacja i pielęgnacja w Studio Demo',
    en: 'Video: extensions, colour and care at Studio Demo',
  },
};

/** The four service directions on the first screen (photos 4:5) — tap opens the price list (R-03). */
const tile = (id: DirectionId) => {
  const d = directionById(id);
  return { title: d.title, sub: d.sub, image: d.image, sheet: id };
};

/** `Studio Demo — <sub>` in every language (the h1 HeroHome had). */
const homeH1 = Object.fromEntries(
  Object.entries(heroHomeCopy.sub).map(([k, v]) => [
    k,
    `${heroHomeCopy.title} — ${v}`,
  ]),
) as Localized;

/** The first catalog photo of a course — the same frame the catalog card shows (fallback: a course-shoot frame, 16.11). */
const cardImage = (slug: string) =>
  catalog.find((c) => c.slug === slug)?.images[0]?.src ??
  'Academy/Teach_Model_01.webp';

const extensions = {
  uk: 'Нарощування волосся',
  pl: 'Przedłużanie włosów',
  en: 'Hair extensions',
};
const reconstruction = {
  uk: 'Реконструкція волосся',
  pl: 'Rekonstrukcja włosów',
  en: 'Hair reconstruction',
};
const offline = {
  uk: 'Офлайн · Варшава',
  pl: 'Stacjonarnie · Warszawa',
  en: 'In person · Warsaw',
};
const online = { uk: 'Онлайн', pl: 'Online', en: 'Online' };

export const heroVideoCopy: Record<HeroVideoArea, HeroVideoAreaCopy> = {
  home: {
    video: homeVideo,
    h1: homeH1,
    tiles: (['colour', 'care', 'extensions', 'cut'] as const).map((id) => ({
      ...tile(id),
      href: '/salon#services',
    })),
  },
  salon: {
    video: salonVideo,
    h1: salonCopy.hero.heading,
    cta: { label: salonCopy.hero.ctaBook, href: '#booking' },
    tiles: (['extensions', 'colour', 'care', 'cut'] as const).map((id) => ({
      ...tile(id),
      href: '/salon#services',
    })),
  },
  academy: {
    video: {
      src: '/video/Hero_Academy_Cut.mp4',
      poster: '/video/Hero_Academy_Cut_Poster.webp',
      label: {
        uk: 'Відео: навчання в Demo Academy',
        pl: 'Wideo: szkolenie w Demo Academy',
        en: 'Video: training at Demo Academy',
      },
    },
    script: {
      uk: 'твій шлях у професію',
      pl: 'twoja droga do zawodu',
      en: 'your way into the craft',
    },
    sub: {
      uk: 'Відпрацювання технік під керівництвом досвідчених майстрів на реальних моделях',
      pl: 'Ćwiczenie technik pod okiem doświadczonych mistrzyń na prawdziwych modelkach',
      en: 'Practise the techniques on real models, guided by experienced masters',
    },
    h1: academyCopy.hero.heading,
    cta: { label: academyCopy.hero.cta, href: '#catalog' },
    // Four tiles = the two courses × offline / online (photos: the catalog cards, course shoot 09.11).
    // The personal mentoring (16.11) is not a tile: a fifth breaks the 2 × 2 / row-of-4 grid
    // (hero_video.css knows 1–4) — it is the last card of the catalog under «Обрати курс».
    tiles: [
      { slug: INTENSIVE_SLUG, title: extensions, sub: offline },
      { slug: COURSE_SLUG, title: extensions, sub: online },
      { slug: RECON_INTENSIVE_SLUG, title: reconstruction, sub: offline },
      { slug: RECON_COURSE_SLUG, title: reconstruction, sub: online },
    ].map(({ slug, title, sub }) => ({
      title,
      sub,
      image: cardImage(slug),
      href: `/courses/${slug}`,
      slug,
    })),
  },
};
