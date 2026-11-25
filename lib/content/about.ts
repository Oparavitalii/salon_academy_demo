import type { Localized } from '@/i18n/routing';
import { uk4 } from '@/lib/i18n/t';

import type { Pic } from './home';

/**
 * `/about` — `9_Text+Images/9_Text.md` round 4 → «/uk/about» (CA §1–§7 + E-08, E-09, E-12, E-29).
 * Order (5.0): HeroAbout · FounderStory (`.ix-fill`) · Masters · Philosophy (+ BookingChannels) ·
 * AcademyRecognition · Stats (repeat of `/`) · FinalCta. Masters without a photo → monogram card (B-91).
 */

export const heroAboutCopy = {
  eyebrow: uk4('Про Studio Demo · Варшава'),
  heading: uk4('Простір досконалої краси та професійного авторського навчання'),
  body: uk4(
    'Салон краси і навчальні курси під одним брендом. За обома стоять 20+ років практики засновниці Олени Демченко — у роботі майстринь і в програмах для учениць.',
  ),
  /** Hero buttons (owner 28.10: the about hero gets the signature layout and both doors). */
  ctaSalon: uk4('Записатися в салон'),
  ctaCourses: uk4('Обрати курс'),
  /** The photographer's edited frames of the same team / floor shots (Daryna's 30 «для всього сайту», 16.11). */
  images: [
    {
      src: 'Salon_Space/Team_03.webp',
      alt: uk4('Команда Studio Demo у салоні'),
    },
    {
      src: 'Salon_Space/Interior_03.webp',
      alt: uk4("Інтер'єр салону з вивіскою DEMO"),
    },
  ] as Pic[],
};

export const founderCopy = {
  heading: uk4('Шлях до досконалості, що починається з пристрасті до справи'),
  body: uk4(
    "Олена Демченко пройшла шлях від майстрині-практика до власниці студії у Варшаві й авторки курсів. Наша місія проста: справжня краса тримається на безпеці, турботі про здоров'я волосся і складних випадках, за які інші не беруться.",
  ),
  /** `.ix-fill` quote (7.0 §5b), split around the one italic word — the 9_Text.md lines, cut in three. */
  quoteBefore: uk4('В Україні в мене був запис на рік уперед, і я бралася за'),
  quoteEm: uk4('складні'),
  quoteAfter: uk4('випадки: нарощування, фарбування, відновлення.'),
  caption: uk4('Олена Демченко, засновниця Studio Demo'),
  /**
   * 16.11 (Dana «меняем все фотографии, которые сделал фотограф»): the phone portrait and the phone
   * photo with a graduate → the portrait shoot (BT9A3434) and the course shoot (Dana at a student's side).
   */
  portrait: {
    src: 'Masters/Dana_07.webp',
    alt: {
      uk: 'Олена Демченко, засновниця Studio Demo, у залі салону',
      pl: 'Olena Demchenko, założycielka Studio Demo, na sali salonu',
      en: 'Olena Demchenko, founder of Studio Demo, on the salon floor',
    },
  } satisfies Pic,
  second: {
    src: 'Academy/Mentor_Student_02.webp',
    alt: {
      uk: 'Олена показує учениці постановку пасма на моделі',
      pl: 'Olena pokazuje kursantce zakładanie pasma na modelce',
      en: 'Olena shows a student how to place a strand on a model',
    },
  } satisfies Pic,
};

export type Master = {
  id: string;
  name: Localized;
  role: Localized;
  /** null → monogram card (owner, 22.10, B-91 — no generated portraits). */
  photo: string | null;
  /** A second, livelier shot from the same shoot — fades in over the photo on hover / focus. */
  photo2?: string;
  monogram: string;
};

/**
 * Card photos — the portraits Daryna (SMM) picked for the cards 16.11 («Дівчата ось ці фото хотіли»,
 * Oksana: «для карток майстринь»): `photo` = her pick; `photo2` (hover) = a second frame of the same
 * master, at work where the shoot has one (Nika — 4348, Yulia — the photographer's edit with extensions).
 * 16.11 (Dana «меняем все фотографии, которые сделал фотограф»): Dana's and Maryna's hover frames were
 * phone photos → the portrait shoot: Dana at the reception under the DEMO sign (3516; the founder block
 * above has her arms-crossed frame, the card her seated one), Maryna seated with the scissors (4907).
 * 16.11 (check run «Chat_1611_Verify», R-08): Daryna's 09:40 screenshots matched to their frames by fingerprint
 * showed other frames in four of her slots → her own frames: Maryna 4817 (card) + 3696 (hover, the
 * reception under the DEMO sign), Liana 3809 (hover, the desk with the laptop), Yulia 3622 (card, full length
 * in the hall — the counter «?90 / 664» on her screenshot; 3621 was a misread, challenger round 1). Old files stay for revert.
 */
export const mastersCopy = {
  heading: uk4('Одна команда — один стандарт'),
  cta: uk4('Записатися в салон'),
  items: [
    {
      id: 'vlada',
      name: uk4('Олена'),
      role: uk4('засновниця студії'),
      photo: 'Masters/Dana_06.webp',
      photo2: 'Masters/Dana_08.webp',
      monogram: 'В',
    },
    {
      id: 'vika',
      name: uk4('Ніка'),
      role: uk4('відновлення і колір'),
      photo: 'Masters/Nika_05.webp',
      photo2: 'Masters/Nika_06.webp',
      monogram: 'В',
    },
    {
      id: 'kristina',
      name: uk4('Марина'),
      role: uk4('колористика, стрижки'),
      photo: 'Masters/Maryna_06.webp',
      photo2: 'Masters/Maryna_07.webp',
      monogram: 'К',
    },
    {
      id: 'katia',
      name: uk4('Юля'),
      role: uk4('майстриня Base'),
      photo: 'Masters/Yulia_07.webp',
      photo2: 'Masters/Yulia_05.webp',
      monogram: 'К',
    },
    {
      id: 'diana',
      name: uk4('Ліана'),
      role: uk4('майстриня Base'),
      photo: 'Masters/Liana_04.webp',
      photo2: 'Masters/Liana_06.webp',
      monogram: 'Д',
    },
  ] as Master[],
};

/**
 * «Життя студії» on `/about` (owner 08.11.2026: «Там багато фоток може їх ще десь використати з
 * фотосесії»): six frames of the shoot 03.11 — two wide (3:2), four tall (4:5). `wide` sets the
 * tile's span; the order is the desktop bento (wide · tall · tall / tall · wide · tall).
 * 16.11 (Dana: «Жизнь студии — фото с полным салоном. Это есть фотограф делала фото»): the posed
 * team / master frames → the photographer's edited frames of the salon full of clients at work.
 * 16.11 13:22 (Dana, the same message): the lead wide frame is the one she named — BT9A4115, the whole
 * hall with every chair taken (Studio_Life_13; its neighbours 4113/4114/4116/4117 are the same scene, a
 * pillar or a water jug at the edge). Studio_Life_07 left: the same hall-and-sign subject at the same 3:2.
 */
export type LifePic = Pic & { wide?: boolean };

export const studioLifeCopy = {
  heading: uk4('Життя студії'),
  sub: uk4('Команда, простір і атмосфера салону у Варшаві'),
  items: [
    {
      src: 'Salon_Space/Studio_Life_13.webp',
      alt: {
        uk: 'Повний зал салону: майстрині працюють з клієнтками, вивіска DEMO',
        pl: 'Pełna sala salonu: stylistki pracują z klientkami, szyld DEMO',
        en: 'The salon floor full of clients: stylists at work, the DEMO sign',
      },
      wide: true,
    },
    {
      src: 'Salon_Space/Studio_Life_08.webp',
      alt: {
        uk: 'Дві майстрині працюють з клієнтками в кріслах',
        pl: 'Dwie stylistki pracują z klientkami na fotelach',
        en: 'Two stylists working with clients in the chairs',
      },
    },
    {
      src: 'Salon_Space/Studio_Life_09.webp',
      alt: {
        uk: 'Майстриня у футболці «Blonde specialist» за роботою з клієнткою',
        pl: 'Stylistka w koszulce «Blonde specialist» przy pracy z klientką',
        en: 'A stylist in a «Blonde specialist» T-shirt at work with a client',
      },
    },
    {
      src: 'Salon_Space/Studio_Life_10.webp',
      alt: {
        uk: 'Зал салону під кільцевими лампами: майстрині й клієнтки за роботою',
        pl: 'Sala salonu pod okrągłymi lampami: stylistki i klientki przy pracy',
        en: 'The salon floor under the ring lights: stylists and clients at work',
      },
    },
    {
      src: 'Salon_Space/Studio_Life_11.webp',
      alt: {
        uk: 'Майстриня вкладає волосся клієнтки феном, позаду працюють інші майстрині',
        pl: 'Stylistka modeluje włosy klientki suszarką, w tle pracują inne stylistki',
        en: "A stylist blow-drying a client's hair, other stylists at work behind",
      },
      wide: true,
    },
    {
      src: 'Salon_Space/Studio_Life_12.webp',
      alt: {
        uk: 'Майстриня підбирає з клієнткою відтінок за палітрою',
        pl: 'Stylistka dobiera z klientką odcień z palety',
        en: 'A stylist choosing a shade from the colour chart with a client',
      },
    },
  ] as LifePic[],
};

/** Monogram per locale: the first letter of the localized name (Latin on /pl and /en). */
export const monogramOf = (name: string) => name.trim().charAt(0).toUpperCase();

export type Standard = { title?: Localized; body: Localized };

export const philosophyCopy = {
  heading: uk4('Чому нам довіряють: наші стандарти'),
  sub: uk4('Принципи, які вирізняють Studio Demo'),
  items: [
    {
      title: uk4('Складні випадки'),
      body: uk4(
        'Виводимо з чорного кольору, відновлюємо волосся, виправляємо невдале фарбування',
      ),
    },
    {
      title: uk4('Багатомовний сервіс'),
      body: uk4(
        'Обслуговування й консультації українською, польською і російською',
      ),
    },
    {
      body: uk4(
        'Один стандарт: усі майстрині навчені Оленою і працюють за одними схемами',
      ),
    },
    {
      body: uk4(
        'Будь-який тип волосся: донорське підбираємо під структуру Вашого',
      ),
    },
  ] as Standard[],
  cta: uk4('Записатися в салон'),
  images: [
    {
      // the photographer's edit of the same extension frame (16.11)
      src: 'Salon_Space/Extension_Work_02.webp',
      alt: uk4('Майстрині нарощують волосся клієнтці в салоні'),
    },
    {
      src: 'Salon_Works/Farb_08.webp',
      alt: uk4('Робота салону'),
    },
  ] as Pic[],
};

export const recognitionCopy = {
  heading: uk4('Навчальний напрям Demo Beauty'),
  sub: uk4(
    'Передаємо експертність, ділимося багаторічним досвідом і вирощуємо нове покоління майстрів',
  ),
  body: uk4(
    'Інтенсив у студії у Варшаві й онлайн-курс у записі. Після навчання — міжнародний сертифікат.',
  ),
  cta: uk4('Стати майстром'),
  /**
   * 16.11 (Dana «меняем все фотографии, которые сделал фотограф»): the phone photos → the course shoot 09.11
   * (no rubbish bin in frame — Dana's note on the course photos). The shoot has no certificate frame, so
   * Certificate_01 stays.
   * 16.11 evening (Oksana M-16 / M-28: too much empty space beside the photos, the big one cropped badly;
   * on a phone a slider of one size): four 4:5 frames in one row — the path of the course, theory → practice
   * with Dana → the group → the certificate; every source is 4:5, so no frame crops a photo. Mentor_Iron_01
   * (course shoot 09.11) is the added one.
   */
  images: [
    {
      src: 'Academy/Teach_Theory_03.webp',
      alt: {
        uk: 'Олена пояснює теорію біля навчального плаката про вагу капсули',
        pl: 'Olena tłumaczy teorię przy planszy o wadze kapsułki',
        en: 'Olena explains the theory by the teaching poster on capsule weight',
      },
    },
    {
      src: 'Academy/Mentor_Iron_01.webp',
      alt: {
        uk: 'Олена стежить, як учениця працює щипцями на моделі',
        pl: 'Olena obserwuje, jak kursantka pracuje szczypcami na modelce',
        en: 'Olena watches a student work with the tongs on a model',
      },
    },
    {
      src: 'Academy/Students_Sofa_01.webp',
      alt: {
        uk: 'Учениці курсу в студії під вивіскою DEMO',
        pl: 'Kursantki w studiu pod szyldem DEMO',
        en: 'Course students in the studio under the DEMO sign',
      },
    },
    {
      src: 'Academy/Certificate_01.webp',
      alt: uk4('Вручення міжнародного сертифіката випускниці'),
    },
  ] as Pic[],
};

/**
 * Stats on /about: the team photo is in the hero, so the tiles sit beside a frame of the salon at work —
 * colouring under the DEMO sign (16.11, Daryna's 30 edited frames; was the model portrait of the home hero).
 */
export const aboutStatsImage: Pic = {
  src: 'Salon_Space/Colour_Work_01.webp',
  alt: {
    uk: 'Майстриня фарбує волосся клієнтки під вивіскою DEMO',
    pl: 'Stylistka farbuje włosy klientki pod szyldem DEMO',
    en: "A stylist colouring a client's hair under the DEMO sign",
  },
};

export const aboutCtaCopy = {
  heading: uk4("Відчуйте наш сервіс або почніть свій шлях у б'юті-сфері"),
  body: uk4(
    'Оберіть те, що актуально для Вас саме зараз — довіртеся нашим майстриням у салоні або опануйте затребувану професію разом із нами',
  ),
  salon: uk4('Стати клієнткою'),
  academy: uk4('Стати майстром'),
  /** 16.11 (Dana «меняем все фотографии, которые сделал фотограф»): the phone «блонд зі спини» → the same
   * subject from the shoot (BT9A4609), the DEMO sign above.
   * 16.11 evening (Oksana M-18 «На фоні краще поставити фото салону, бо тут погано обрізається фото
   * волосся»): → the salon hall at work, the photographer's 3:2 frame Studio_Life_07 (not used elsewhere on
   * the page; «Життя студії» above opens with its neighbour 13). Blonde_Back_01 stays for revert. */
  image: {
    src: 'Salon_Space/Studio_Life_07.webp',
    alt: {
      uk: 'Зал салону Studio Demo: майстрині працюють з клієнтками',
      pl: 'Sala salonu Studio Demo: stylistki pracują z klientkami',
      en: 'The Studio Demo salon floor: stylists at work with clients',
    },
  } satisfies Pic,
};
