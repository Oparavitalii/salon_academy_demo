import type { Localized } from '@/i18n/routing';
import { uk4 } from '@/lib/i18n/t';

/**
 * `/` — `9_Text+Images/9_Text.md` round 4 → «/uk — головна» (wireframe 21.10, E-08…E-29).
 * Block order (5.0_Sitemap 22.10): HeroHome · AboutShort · Stats · SalonTeaser `#salon` ·
 * Testimonials · AcademyTeaser `#academy` (light) · StudentWorks (light; SuccessStories hidden, Q-35).
 * Alt texts 9_Text.md does not spell out: the subject of the frame in plain words (11.0, part B).
 */

export type Pic = { src: string; alt: Localized };

/** HeroHome → Header31 (FR-28): H1, sub, two buttons; no logo, no badges. */
export const heroHomeCopy = {
  title: 'Studio Demo',
  /** Great Vibes line over the photo (Oksana «Вариант 1», 24.10). */
  script: uk4("ваш б'юті простір"),
  sub: uk4(
    "Простір досконалого догляду за волоссям у Варшаві та професійні навчальні курси для б'юті-майстрів",
  ),
  ctaSalon: uk4('Записатися в салон'),
  ctaCourse: uk4('Обрати курс'),
  /**
   * HeroHome is not rendered since HeroVideo took the first screen (31.10); the photo still follows the rule
   * «only the photographer's frames» (Dana 16.11) — wfolio «рабочий процесс» BT9A4054 instead of the phone photo.
   */
  image: {
    src: 'Hero_Bands/Choice_Salon_02.webp',
    alt: {
      uk: 'Майстриня робить укладку довгого мідного волосся на брашинг',
      pl: 'Stylistka modeluje długie miedziane włosy na szczotce',
      en: "A stylist blow-dries a client's long copper hair with a round brush",
    },
  } satisfies Pic,
};

/** AboutShort → Layout9 (≤ 60 words, FR-28, E-24). */
export const aboutShortCopy = {
  heading: uk4('Створюємо ідеальне волосся та навчаємо цього інших'),
  sub: uk4(
    'За кожним образом у нашій студії стоїть людина, яка розуміє, що таке справжня довіра',
  ),
  body: uk4(
    'За студією — 20+ років практики Олени Демченко: складні випадки, нарощування, колористика. Майстрині працюють за її стандартом; майстерність передаємо на курсах.',
  ),
  cta: uk4('Детальніше про бренд'),
  /** The team from the shoot 03.11 (B-112) — «за кожним образом стоїть людина». */
  imageBig: {
    src: 'Salon_Space/Team_03.webp',
    alt: uk4('Команда Studio Demo у салоні'),
  } satisfies Pic,
  /**
   * Maryna 17.11.2026 (group chat, on Nika's inset): «Здесь нужно поменять или на общую или Дану
   * поставить» → Dana, since the text beside it is about her 20+ years: the portrait shoot (BT9A3553, her
   * master card on `/about`), seated like the frame it replaces, the DEMO sign behind her. Not Dana_02…04 —
   * those are phone photos (Dana 16.11: only the photographer's frames; `Shoot_Photos_Anonymous.spec.ts`).
   */
  imageSmall: {
    src: 'Masters/Dana_06.webp',
    alt: {
      uk: 'Олена Демченко, засновниця студії, у кріслі салону під вивіскою DEMO',
      pl: 'Olena Demchenko, założycielka studia, na fotelu w salonie pod szyldem DEMO',
      en: 'Olena Demchenko, the studio founder, in a salon chair under the DEMO sign',
    },
  } satisfies Pic,
};

export type Stat = { value: string; label: Localized };

/**
 * Stats → Stats27 (signature) — the same tiles on `/` and `/about` (9_Text.md). «+» = «більше ніж».
 * Dana 16.11.2026: «5 ⭐ поставить вместо 5.0 / И 100000+ довольных клиентов прилетающих с разных
 * стран» — the text star ★ (not an emoji, no-emoji rule) and a fourth tile; 100000+ confirmed by the owner.
 */
export const statsCopy = {
  ghost: '20+',
  items: [
    {
      value: '20+',
      label: uk4("років у б'юті-сфері"),
    },
    {
      value: '5 ★',
      label: uk4('оцінка сервісу в Booksy'),
    },
    {
      value: '180+',
      label: uk4('відгуків клієнток у Booksy'),
    },
    {
      value: '100000+',
      // «прилетающих» restored after the check run's challenger (16.11): the label had dropped Dana's word
      label: {
        uk: 'задоволених клієнток, які прилітають з різних країн',
        pl: 'zadowolonych klientek, które przylatują z różnych krajów',
        en: 'happy clients who fly in from many countries',
      },
    },
  ] as Stat[],
  image: {
    src: 'Salon_Space/Team_03.webp',
    alt: uk4('Команда Studio Demo у салоні'),
  } satisfies Pic,
  /** `/about` only (Stats27 there carries a heading — 9_Text.md → /about → Stats). */
  aboutHeading: uk4('Досягнення Studio Demo'),
  aboutSub: uk4('Факти, які говорять гучніше за будь-які слова'),
};

export type TeaserCard = {
  title: Localized;
  body: Localized;
  price: Localized;
  image: Pic;
};

/** SalonTeaser `#salon` → Layout13: three cards with a photo (E-28) and «від» (Bk 20.10). */
export const salonTeaserCopy = {
  heading: uk4('Послуги преміальної якості для Вашого волосся у Варшаві'),
  sub: uk4(
    "Від невагомого волоскового нарощування до складного виходу з темного — втілюємо Ваші бажання та дбаємо про здоров'я кожного пасма",
  ),
  cta: uk4('Переглянути всі послуги'),
  cards: [
    {
      title: uk4('Мікрокапсульне та волоскове нарощування'),
      body: uk4('Непомітні капсули і донорське волосся під структуру Вашого'),
      price: uk4('від 500 zł'),
      image: {
        src: 'Salon_Works/Process_Daryna_01.webp', // Daryna 22.11: the process shots «там де фото нижче»
        alt: uk4('Майстриня розбирає пасма блонду в салоні'),
      },
    },
    {
      title: uk4('Складне фарбування'),
      body: uk4('Плавні розтяжки кольору, рельєфний блонд і вихід із темного'),
      price: uk4('від 550 zł'),
      // 23.11 (owner: «фото не найбільш підходящі (2 і 3 можеш знайти інші)»): the foil close-up → the way out of
      // the dark into a caramel blonde, face in the frame
      image: {
        src: 'Salon_Works/Farb_15.webp',
        alt: uk4('Вихід із темного: розтяжка кольору в карамельний блонд'),
      },
    },
    {
      title: uk4('Тотальна реконструкція та догляд'),
      body: uk4(
        'Кератинове випрямлення, ботокс для волосся та холодне відновлення',
      ),
      price: uk4('від 250 zł'),
      // 23.11: the product on the parting → a mirror-gloss result after the reconstruction
      image: {
        src: 'Salon_Works/Dohliad_03.webp',
        alt: uk4('Гладке дзеркальне волосся після реконструкції'),
      },
    },
  ] as TeaserCard[],
  /** Two process shots under the cards (Daryna 22.11: «Ці , там де фото нижче» — was the before / after pair; the keys stay). */
  pair: {
    before: {
      src: 'Salon_Works/Process_Daryna_04.webp',
      alt: uk4('Миття голови в салоні після фарбування'),
    } satisfies Pic,
    after: {
      src: 'Salon_Works/Process_Daryna_05.webp',
      alt: uk4('Укладка після процедури'),
    } satisfies Pic,
  },
};

/** Testimonials → Testimonial9 on `/` (cards: salon.ts → reviews). */
export const homeReviewsCopy = {
  heading: uk4('Результати наших клієнток'),
  sub: uk4(
    "Реальні враження жінок, які довірили нам красу, довжину та здоров'я свого волосся",
  ),
  cta: uk4('Стати клієнткою'),
  background: {
    src: 'Salon_Works/Farb_01.webp',
    alt: uk4('Корекція кольору'),
  } satisfies Pic,
};

export type Benefit = { title: Localized; body: Localized };

/** AcademyTeaser `#academy` → own · Academy_Teaser (light, rounded top + `.ix-edge`). */
export const academyTeaserCopy = {
  heading: uk4('Професійне навчання: від нуля до власного бізнесу'),
  sub: uk4(
    'Оволодійте технікою мікрокапсульного нарощування волосся з підтримкою після навчання',
  ),
  benefits: [
    {
      title: uk4('Доступність'),
      body: uk4('Матеріал зрозумілий і новачкам, і майстрам із досвідом'),
    },
    {
      title: uk4('Міжнародний сертифікат'),
      body: uk4('Міжнародний сертифікат після закінчення навчання'),
    },
    {
      title: uk4('Постачальники'),
      body: uk4(
        'Контакти перевірених постачальників волосся, матеріалів та інструментів',
      ),
    },
    {
      title: uk4('Заробіток'),
      body: uk4(
        'Портфоліо з навчання і контакти SMM-спеціаліста, таргетолога й бухгалтера для старту',
      ),
    },
    {
      title: uk4('Кабінет онлайн-курсу'),
      body: uk4(
        'Відеоуроки й онлайн-методичка онлайн-курсу — у Вашому кабінеті, вхід за паролем',
      ),
    },
  ] as Benefit[],
  /** The course shoot 09.11; 23.11 (owner: only frames with Olena, no open mouths) → Mentor_Iron_02 — the
   *  course card on this page already shows BT9A5566. */
  inset: {
    src: 'Academy/Mentor_Iron_02.webp',
    alt: {
      uk: 'Олена стежить, як учениця працює утюжком на моделі',
      pl: 'Olena obserwuje, jak kursantka pracuje prostownicą na modelce',
      en: 'Olena watches a student work with a flat iron on a model',
    },
  } satisfies Pic,
  cta: uk4('Обрати курс'),
};

const l3 = (uk: string, pl: string, en: string): Localized => ({
  uk,
  pl,
  en,
});

/**
 * StudentWorks → Gallery5 — in place of SuccessStories until there are stories (Q-35). `/` and `/courses`.
 * Not rendered since 27.10 (SuccessStories stands there); 16.11 the phone photos → the course shoot 09.11 anyway.
 */
export const studentWorksCopy = {
  heading: uk4('Навчання в Studio Demo'),
  caption: uk4('Учениці за роботою'),
  ctaHome: uk4('Стати майстром'),
  ctaCourses: uk4('Обрати свій курс'),
  images: [
    {
      src: 'Academy/Teach_Hall_01.webp',
      alt: l3(
        'Олена пояснює теорію біля плаката, учениці слухають',
        'Olena tłumaczy teorię przy planszy, kursantki słuchają',
        'Olena explains the theory at the poster while the students listen',
      ),
    },
    {
      src: 'Academy/Practice_Capsule_05.webp',
      alt: l3(
        'Постановка капсули з термозахистом на манекені',
        'Zakładanie kapsułki z osłoną termiczną na manekinie',
        'Placing a capsule with a heat shield on a mannequin',
      ),
    },
    {
      src: 'Academy/Mentor_Student_03.webp',
      alt: l3(
        'Олена підказує учениці під час нарощування на моделі',
        'Olena podpowiada kursantce podczas przedłużania na modelce',
        'Olena guides a student during extensions on a model',
      ),
    },
    {
      src: 'Academy/Teach_Talk_01.webp',
      alt: l3(
        'Олена відповідає на питання учениць мінігрупи',
        'Olena odpowiada na pytania kursantek z minigrupy',
        "Olena answers the mini-group's questions",
      ),
    },
    {
      src: 'Academy/Mentor_Iron_02.webp',
      alt: l3(
        'Олена стежить, як учениця працює утюжком на моделі',
        'Olena obserwuje, jak kursantka pracuje prostownicą na modelce',
        'Olena watches a student work with a flat iron on a model',
      ),
    },
    {
      src: 'Academy/Practice_Mannequin_01.webp',
      alt: uk4('Дві учениці відпрацьовують капсули'),
    },
  ] as Pic[],
};
