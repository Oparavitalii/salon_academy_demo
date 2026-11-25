import type { Localized } from '@/i18n/routing';
import { isDemoMode } from '@/lib/demo/mode';
import { uk4 } from '@/lib/i18n/t';

import {
  type FaqSection,
  intensiveFaq,
  onlineFaq,
  reconIntensiveFaq,
  reconOnlineFaq,
} from './faq';
import type { Pic } from './home';
import {
  COURSE_SLUG,
  INTENSIVE_SLUG,
  MENTORING_SLUG,
  RECON_COURSE_SLUG,
  RECON_INTENSIVE_SLUG,
} from './site';

/** A string written in all three languages here (new copy stays out of the uk-keyed dict). */
const l3 = (uk: string, pl: string, en: string): Localized => ({
  uk,
  pl,
  en,
});

/**
 * Photos of the course shoot 09.11 (wfolio «Обучение», Q-47) — they replace the phone photos of the
 * academy (Dana 16.11 about the catalog cards: «Тут тоже есть новые фото, мы заменим»). Crops:
 * `Pilot_Run/Tools/_tmp/Acad_Prep.mjs`; the woman in the white blouse is Olena. Alts say what the
 * frame shows — practice frames are not tied to one course.
 */
const theoryAlt = uk4('Олена пояснює теорію ученицям');
const practiceAlt = uk4('Практика нарощування на моделі');
const posterAlt = l3(
  'Олена біля навчального плаката про розстановку капсул',
  'Olena przy planszy o rozmieszczeniu kapsułek',
  'Olena by the teaching poster on capsule placement',
);
const mentorAlt = l3(
  'Олена поруч з ученицею під час практики на моделі',
  'Olena obok kursantki podczas praktyki na modelce',
  'Olena beside a student during practice on a model',
);
const teachModelAlt = l3(
  'Олена пояснює учениці техніку на моделі',
  'Olena tłumaczy kursantce technikę na modelce',
  'Olena explains the technique to a student on a model',
);
const shoot = {
  // 23.11 (owner, on the online reconstruction card: «прибрати фото з цьою ученицею а тільки залишити де є
  // Олена»): the frames where that student works alone (Recon_Card_01/02, Practice_Dry_01/02, Practice_Iron_03,
  // Practice_Mannequin_02, Student_Mannequin_01) are out; Olena-with-student frames take their places.
  teachModel: { src: 'Academy/Teach_Model_01.webp', alt: teachModelAlt },
  teachMannequin: {
    src: 'Academy/Teach_Mannequin_01.webp',
    alt: l3(
      'Олена показує ученицям роботу на манекені',
      'Olena pokazuje kursantkom pracę na manekinie',
      'Olena shows students how to work on a mannequin',
    ),
  },
  theory: { src: 'Academy/Teach_Theory_01.webp', alt: theoryAlt },
  poster: { src: 'Academy/Teach_Theory_02.webp', alt: posterAlt },
  capsule: { src: 'Academy/Practice_Capsule_01.webp', alt: practiceAlt },
  capsuleClose: {
    src: 'Academy/Practice_Capsule_02.webp',
    alt: l3(
      'Шаблон для пасма й затискачі під час нарощування',
      'Szablon do pasma i klipsy podczas przedłużania',
      'A strand template and clips during extensions',
    ),
  },
  capsuleTool: { src: 'Academy/Practice_Capsule_03.webp', alt: practiceAlt },
  iron: {
    src: 'Academy/Practice_Iron_01.webp',
    alt: l3(
      'Олена працює утюжком на моделі під час навчання',
      'Olena pracuje prostownicą na modelce podczas szkolenia',
      'Olena works with a flat iron on a model during training',
    ),
  },
  ironClose: {
    src: 'Academy/Practice_Iron_02.webp',
    alt: l3(
      'Робота утюжком по пасмах на живій моделі',
      'Praca prostownicą na pasmach żywej modelki',
      'Flat-iron work section by section on a live model',
    ),
  },
  // 16.11 (Dana: «где не видно мусорки»): Practice_Wash_01 (BT9A5356) showed the pedal bin by the basin → a
  // close frame at the same basin (BT9A5360).
  wash: {
    src: 'Academy/Practice_Wash_02.webp',
    alt: l3(
      'Миття голови моделі біля мийки на навчанні',
      'Mycie głowy modelki przy myjni na szkoleniu',
      "Washing a model's hair at the basin during training",
    ),
  },
  // 16.11 (check run «Chat_1611_Verify», R-29 — Dana 13:00 on the catalog cards «Тут тоже есть новые фото, мы
  // заменим»): the online reconstruction card was still on client-result photos → course-shoot frames with a model
  // (Prep_Shoot_7_Recon.mjs: BT9A5386, 5491, 5527).
  // 23.11: the online reconstruction card is wide — a 4:5 frame lost the heads there → a 4:3 cut of BT9A5566
  reconCard: {
    src: 'Academy/Recon_Card_04.webp',
    alt: l3(
      'Олена стежить, як учениця працює щипцями на моделі',
      'Olena obserwuje, jak kursantka pracuje szczypcami na modelce',
      'Olena watches a student work with the tongs on a model',
    ),
  },
  reconSection: {
    src: 'Academy/Recon_Card_03.webp',
    alt: l3(
      'Розподіл волосся моделі на пасма',
      'Podział włosów modelki na pasma',
      "Sectioning a model's hair",
    ),
  },
  // 23.11 (owner: «чи не відкритий рот»): the frames where Olena talked mid-word were re-cut from calm frames of
  // the same scenes (Pilot_Run/Tools/_tmp/Prep_Closed_Mouth.mjs): Mentor_Iron_01 ← BT9A5566, Mentor_Student_02 ←
  // BT9A5538, Teach_Model_01/02 ← BT9A5450, Mentor_Model_01 ← BT9A5211 (a mannequin, hence its own alt).
  mentor: {
    src: 'Academy/Mentor_Model_01.webp',
    alt: l3(
      'Олена поруч з ученицею під час практики на манекені',
      'Olena obok kursantki podczas ćwiczeń na manekinie',
      'Olena beside a student practising on a mannequin',
    ),
  },
  mentorWide: {
    src: 'Academy/Mentor_Model_02.webp',
    alt: l3(
      'Олена й учениця за роботою на моделі',
      'Olena i kursantka przy pracy na modelce',
      'Olena and a student working on a model',
    ),
  },
  mentorWatch: {
    src: 'Academy/Mentor_Model_03.webp',
    alt: l3(
      'Учениця працює на моделі, Олена стежить поруч',
      'Kursantka pracuje na modelce, Olena czuwa obok',
      'A student works on a model while Olena watches',
    ),
  },
  students: {
    src: 'Academy/Students_Group_01.webp',
    alt: l3(
      'Учениці на занятті в студії',
      'Kursantki na zajęciach w studiu',
      'Students at a class in the studio',
    ),
  },
  // 4:5 — course heroes, author, polaroids
  mentorTall: { src: 'Academy/Mentor_Student_01.webp', alt: mentorAlt },
  mentorShow: {
    src: 'Academy/Mentor_Student_02.webp',
    alt: l3(
      'Олена показує учениці постановку пасма на моделі',
      'Olena pokazuje kursantce zakładanie pasma na modelce',
      'Olena shows a student how to place a strand on a model',
    ),
  },
  theoryTall: { src: 'Academy/Teach_Theory_03.webp', alt: theoryAlt },
  posterTall: { src: 'Academy/Teach_Theory_04.webp', alt: posterAlt },
  teachModelTall: { src: 'Academy/Teach_Model_02.webp', alt: teachModelAlt },
  capsuleTall: { src: 'Academy/Practice_Capsule_04.webp', alt: practiceAlt },
  mannequinPair: {
    src: 'Academy/Practice_Mannequin_01.webp',
    alt: uk4('Дві учениці відпрацьовують капсули'),
  },
  result: {
    src: 'Academy/Practice_Result_01.webp',
    alt: l3(
      'Модель після нарощування на навчанні',
      'Modelka po przedłużaniu na szkoleniu',
      'A model after extensions at the training',
    ),
  },
  // 16.11, round 2 (Dana: «мы меняем все фотографии, которые сделал фотограф») — the last phone photos of the
  // course pages → the shoot (`Pilot_Run/Tools/_tmp/Prep_Shoot_5_Academy.mjs`), 4:5. Dana's picks: BT9A5253
  // (studentMannequin), BT9A5236 (capsuleShield), BT9A5653 (hall; a bin lid behind a shoulder retouched out).
  capsuleShield: {
    src: 'Academy/Practice_Capsule_05.webp',
    alt: l3(
      'Постановка капсули з термозахистом на манекені',
      'Zakładanie kapsułki z osłoną termiczną na manekinie',
      'Placing a capsule with a heat shield on a mannequin',
    ),
  },
  hall: {
    src: 'Academy/Teach_Hall_01.webp',
    alt: l3(
      'Олена пояснює теорію біля плаката, учениці слухають',
      'Olena tłumaczy teorię przy planszy, kursantki słuchają',
      'Olena explains the theory at the poster while the students listen',
    ),
  },
  talk: {
    src: 'Academy/Teach_Talk_01.webp',
    alt: l3(
      'Олена відповідає на питання учениць мінігрупи',
      'Olena odpowiada na pytania kursantek z minigrupy',
      "Olena answers the mini-group's questions",
    ),
  },
  mentorGuide: {
    src: 'Academy/Mentor_Student_03.webp',
    alt: l3(
      'Олена підказує учениці під час нарощування на моделі',
      'Olena podpowiada kursantce podczas przedłużania na modelce',
      'Olena guides a student during extensions on a model',
    ),
  },
  mentorIron: {
    src: 'Academy/Mentor_Iron_01.webp',
    alt: l3(
      'Олена стежить, як учениця працює щипцями на моделі',
      'Olena obserwuje, jak kursantka pracuje szczypcami na modelce',
      'Olena watches a student work with the tongs on a model',
    ),
  },
  ironWork: {
    src: 'Academy/Practice_Iron_04.webp',
    alt: l3(
      'Робота утюжком по пасмах моделі під час навчання',
      'Praca prostownicą na pasmach modelki podczas szkolenia',
      "Flat-iron work on a model's hair during training",
    ),
  },
  mentorIronWatch: {
    src: 'Academy/Mentor_Iron_02.webp',
    alt: l3(
      'Олена стежить, як учениця працює утюжком на моделі',
      'Olena obserwuje, jak kursantka pracuje prostownicą na modelce',
      'Olena watches a student work with a flat iron on a model',
    ),
  },
} satisfies Record<string, Pic>;

/**
 * `/courses` and the two course pages (one template, FR-22) — `9_Text+Images/9_Text.md` round 4
 * (CC, CK, CK2 + client edits E-08…E-31). Prices (E-31, Decisions 22.10 «Ціни курсів: 990 € і
 * 590 €»): ONE price per course — intensive «990 €», online «590 €» — printed from this copy in the
 * catalog, the course hero, the intensive PriceCard and both FinalCta. No packages: the tier block
 * (BASIC · MIDDLE · MENTORING) is not rendered. Buying is unchanged: every online «Придбати / Стати
 * майстром» goes to the academy's Instagram Direct as «Записатися на курс»; the intensive's
 * «Забронювати місце» opens the booking channels (Stripe — B-93). No anchor to `#tiers` (F6).
 */

/* ---------------- /courses ---------------- */

export const academyCopy = {
  /** HeroAcademy → Header31. */
  hero: {
    eyebrow: uk4('Нарощування й реконструкція · Варшава й онлайн'),
    heading: uk4('Професійні курси: навчайтеся і заробляйте'),
    body: uk4(
      'Авторські програми з нарощування волосся та інших напрямів від Олени Демченко',
    ),
    cta: uk4('Обрати курс'),
    // Not rendered since HeroVideo took the first screen (31.10) — only `heading` / `cta` are read; the photos
    // follow the course shoot anyway (16.11), so nothing phone-made is left to come back.
    image: shoot.teachModelTall satisfies Pic,
    /** `.dec_polaroid_sm` around the heading (8.0 §5). */
    polaroids: [shoot.mentorGuide, shoot.capsuleShield] as Pic[],
  },
  /** PlatformBenefits → Features9 — the international certificate first (FR-26). */
  platform: {
    heading: uk4('Переваги навчання в Studio Demo'),
    sub: uk4(
      'Зрозумілий матеріал, міжнародний сертифікат і підтримка на шляху до нової професії',
    ),
    items: [
      {
        title: uk4('Міжнародний сертифікат'),
        body: uk4(
          "Після навчання Ви отримуєте міжнародний сертифікат на своє ім'я.",
        ),
      },
      // «Навчання 4 мовами» removed 28.10 (owner: 4 languages is not a privilege) — the suppliers line instead.
      {
        title: uk4('Постачальники'),
        body: uk4(
          'Контакти перевірених постачальників волосся, матеріалів та інструментів',
        ),
      },
      {
        title: uk4('Особистий кабінет учениці'),
        body: uk4(
          'Відеоуроки й онлайн-методичка онлайн-курсу в одному місці, вхід за e-mail і паролем',
        ),
      },
      // «Миттєвий доступ» shows only with online payment on (Q-02) → its replacement «Група учениць».
      {
        title: uk4('Група учениць'),
        body: uk4(
          'Спілкування з майстрами і курсантками: питання й підтримка після навчання',
        ),
      },
    ],
    image: {
      src: 'Academy/Certificate_01.webp',
      alt: uk4('Вручення міжнародного сертифіката випускниці'),
    } satisfies Pic,
  },
  /** CourseCatalog `#catalog` → own · Course_Grid. */
  catalog: {
    heading: uk4('Наші навчальні програми'),
    sub: uk4(
      "Оберіть свій формат навчання — глибокі офлайн-інтенсиви у Варшаві або зручні онлайн-програми для старту та розвитку в б'юті-сфері",
    ),
    details: uk4('Детальніше'),
  },
};

/** `.dec_tape` words on /courses (8.0 §5: «переваги курсу») — the benefit titles, repeated. */
export const coursesTapeWords: Localized[] = academyCopy.platform.items.map(
  (i) => i.title,
);

export type CatalogCard = {
  slug: string;
  status: 'available' | 'coming_soon';
  title: Localized;
  format: Localized;
  body: Localized;
  images: Pic[];
  /** The one price of the course (E-31). */
  price: Localized;
  /** Main button: label + target (the intensive → its `#price`; online → Direct, B-89). */
  primary: { label: Localized; href: string };
  /**
   * «Передзапис» marker (owner 27.10: the online reconstruction lessons are not recorded yet). The card
   * and its page stay visible with the price; `status` stays 'available' — 'coming_soon' hides it.
   */
  soon?: Localized;
};

/**
 * Online / offline of a catalog course — the intensives (slug `*-intensive`) and, since 16.11, the
 * personal mentoring (in the Warsaw studio) are the offline ones. Also the DB `courses.kind` (seed / sync).
 */
export function courseKind(slug: string): 'online' | 'offline' {
  return slug.endsWith('intensive') || slug === MENTORING_SLUG
    ? 'offline'
    : 'online';
}

/** Format filter over the course lists on `/` and `/courses` (owner 28.10). */
export const courseFilterCopy = {
  label: uk4('Формат навчання'),
  all: uk4('Усі курси'),
  online: uk4('Онлайн'),
  offline: uk4('Офлайн у Варшаві'),
  badgeOnline: uk4('Онлайн'),
  badgeOffline: uk4('Офлайн · Варшава'),
};

/** Online buttons while prices and tiers wait (Q-02, Q-10) — `floor.ts` → academyDirectUrl. */
export const enrolLabel = uk4('Записатися на курс');

const signUpIntensive = uk4('Записатися на інтенсив');

/** The «скоро» course (online reconstruction, owner 27.10): every buy / enrol button → Direct. */
export const notifyLabel = uk4('Повідомити про старт');
export const soonLabel = uk4('Передзапис');

/** Course prices — client 22.10 (E-31): one price per course, euro. EN writes «€990» (dict). */
export const coursePrice = {
  intensive: uk4('990 €'),
  online: uk4('590 €'),
  /** Course 2 — reconstruction (Oksana's copy 26.10, owner 27.10 «хай буде 4»). */
  reconIntensive: uk4('790 €'),
  reconOnline: uk4('490 €'),
};
/** Label before the price in the course hero (9_Text → HeroCourse «вартість»). */
export const priceLabel = uk4('Вартість');

/**
 * Personal mentoring — two prices (Dana 16.11: «2дня -2000€ / 3дня-3000€»). The catalog card (and the
 * admin's price table) has one price slot, so it says «від 2 000 €»; the course page shows both options.
 * No-break spaces keep «2 000 €» on one line.
 */
const NB = ' ';
export const mentoringOptions: { days: Localized; price: Localized }[] = [
  {
    days: l3('2 дні', '2 dni', '2 days'),
    price: l3(`2${NB}000${NB}€`, `2${NB}000${NB}€`, '€2,000'),
  },
  {
    days: l3('3 дні', '3 dni', '3 days'),
    price: l3(`3${NB}000${NB}€`, `3${NB}000${NB}€`, '€3,000'),
  },
];
const mentoringFrom = l3(
  `від 2${NB}000${NB}€`,
  `od 2${NB}000${NB}€`,
  'from €2,000',
);
/** Dana's own heading 16.11: «ЛИЧНОЕ НАСТАВНИЧЕСТВО | VIP-ОБУЧЕНИЕ». */
const mentoringTitle = l3(
  'Особисте наставництво | VIP-навчання',
  'Mentoring indywidualny | Szkolenie VIP',
  'Personal mentoring | VIP training',
);
/** «Вы бронируете…» (Dana) — so the button books, like the intensives' «Забронювати місце». */
const mentoringBook = l3(
  'Забронювати наставництво',
  'Zarezerwuj mentoring',
  'Book your mentoring',
);

/**
 * Production: the academy's Instagram Direct (sales went through Direct while online checkout was
 * being switched on). PUBLIC DEMO: the demo checkout page, so the Stripe → webhook flow can be tried.
 */
export const ACADEMY_DIRECT = isDemoMode()
  ? '/checkout/demo'
  : 'https://www.instagram.com/';

/** Catalog — the intensive first (CC §3). «Скоро» cards (colouring, keratin) stay hidden (FR-09). */
export const catalog: CatalogCard[] = [
  {
    slug: INTENSIVE_SLUG,
    status: 'available',
    title: uk4(
      'Офлайн-інтенсив з мікрокапсульного нарощування волосся (у Варшаві)',
    ),
    format: uk4('Офлайн · 2 дні · мінігрупа до 4 осіб'),
    body: uk4(
      'Індивідуальне навчання: у кожної учениці своя модель, майстер стежить за кожним етапом і одразу виправляє помилки. Капсуляція, нарощування на моделі і міжнародний сертифікат.',
    ),
    // Course shoot 09.11 instead of the phone photos (16.11); [0] is also the academy first-screen tile.
    // Daryna 22.11 «Там скільки гарних фото, а тут взяли де говорить»: [0] is hands placing a capsule, not the talk.
    images: [shoot.capsuleTall, shoot.teachModel, shoot.teachMannequin],
    price: coursePrice.intensive,
    primary: {
      label: signUpIntensive,
      href: `/courses/${INTENSIVE_SLUG}#price`,
    },
  },
  {
    slug: COURSE_SLUG,
    status: 'available',
    title: uk4('Онлайн-курс з мікрокапсульного нарощування волосся'),
    format: uk4('Онлайн · 16 відеоуроків'),
    body: uk4(
      'Записані відеоуроки з озвучкою чотирма мовами, онлайн-методичка, база постачальників і група учениць. Навчання у власному темпі в особистому кабінеті.',
    ),
    images: [shoot.theory, shoot.poster, shoot.capsuleClose],
    price: coursePrice.online,
    primary: { label: enrolLabel, href: ACADEMY_DIRECT },
  },
  // Course 2 — reconstruction (Oksana's copy 26.10; photos — the studio's own care results).
  {
    slug: RECON_INTENSIVE_SLUG,
    status: 'available',
    title: uk4(
      'Офлайн-інтенсив з реконструкції та відновлення волосся (у Варшаві)',
    ),
    format: uk4('Офлайн · 2 дні · мінігрупа 2–6 осіб'),
    body: uk4(
      'Холодне відновлення, 3 види кератину, 2 види ботоксу та Aqua Coco — практика на живих моделях під контролем 2–3 майстрів. Міжнародний сертифікат.',
    ),
    // Live models at the course shoot 09.11 (16.11) instead of the salon's own care results.
    images: [shoot.iron, shoot.wash, shoot.ironClose],
    price: coursePrice.reconIntensive,
    primary: {
      label: signUpIntensive,
      href: `/courses/${RECON_INTENSIVE_SLUG}#price`,
    },
  },
  {
    slug: RECON_COURSE_SLUG,
    status: 'available',
    title: uk4('Онлайн-курс з реконструкції та відновлення волосся'),
    format: uk4('Онлайн · відеоуроки + чат підтримки'),
    soon: soonLabel,
    body: uk4(
      'Відеоуроки з демонстрацією 4 процедур реконструкції, детальна методичка і підтримка викладачів у чаті. Навчання у власному темпі.',
    ),
    images: [shoot.reconCard, shoot.mentorIronWatch, shoot.reconSection],
    price: coursePrice.reconOnline,
    primary: { label: notifyLabel, href: ACADEMY_DIRECT },
  },
  // Personal mentoring (Dana 16.11) — last: the one-to-one offer after the group courses. Booked like an
  // intensive (its page `#price` opens the booking channels); the card shows «від 2 000 €», the body both.
  {
    slug: MENTORING_SLUG,
    status: 'available',
    title: mentoringTitle,
    format: l3(
      'Офлайн · 2 або 3 дні · індивідуально',
      'Stacjonarnie · 2 lub 3 dni · indywidualnie',
      'In person · 2 or 3 days · one-to-one',
    ),
    body: l3(
      `Індивідуальне навчання з Оленою Демченко: Ви самі обираєте напрями — нарощування волосся, складні фарбування, колористику, кератин, ботокс чи відновлення волосся. 2 дні — 2${NB}000${NB}€, 3 дні — 3${NB}000${NB}€.`,
      `Szkolenie indywidualne z Oleną Demchenko: sama Pani wybiera kierunki — przedłużanie włosów, złożone koloryzacje, kolorystykę, keratynę, botoks lub regenerację włosów. 2 dni — 2${NB}000${NB}€, 3 dni — 3${NB}000${NB}€.`,
      'One-to-one training with Olena Demchenko: you choose the topics — hair extensions, complex colouring, colour theory, keratin, botox or hair restoration. 2 days — €2,000, 3 days — €3,000.',
    ),
    images: [shoot.mentor, shoot.mentorWide, shoot.mentorWatch],
    price: mentoringFrom,
    primary: { label: mentoringBook, href: `/courses/${MENTORING_SLUG}#price` },
  },
];

/* ---------------- /courses/[slug] ---------------- */

export type ProgramRow = {
  title: Localized;
  body: Localized;
  subs: Localized[];
};

/**
 * Tier data kept for the test checkout (DB seed, `lib/courses/public.ts`); no tier block renders (E-31:
 * one price per course). Fix round 22.10: the dead `Tiers` component and its visible labels are gone.
 */
export type Tier = {
  id: string;
  /** DB name of the tier (seed only, never shown). */
  name: string;
  featured?: boolean;
};

export type CourseDay = { title: Localized; points: Localized[]; image: Pic };

export type CourseDetail = {
  slug: string;
  format: 'online' | 'intensive';
  /** The same course in the other format — the FormatSwitch in the hero links the pair. */
  sibling: string;
  /** Program rows are the recorded lessons — `db:seed` creates cabinet lessons from them. */
  programIsLessons?: boolean;
  /** The `#price` card — intensives (booking channels) and, from Oksana's copy 26.10, online (Direct). */
  priceCard?: PriceCardCopy;
  /** «Передзапис» marker — the first hero chip (see `CatalogCard.soon`). */
  soon?: Localized;
  /** The one price (E-31) — hero, FinalCta, PriceCard. */
  price: Localized;
  metaTitle: Localized;
  metaDescription: Localized;
  hero: {
    eyebrow: Localized;
    title: Localized;
    sub: Localized;
    tags: Localized[];
    images: Pic[];
  };
  audience: {
    heading: Localized;
    sub: Localized;
    segments: { title: Localized; body: Localized }[];
    skills: Localized[];
    image: Pic;
    /** Oksana's copy 26.10: the Audience button scrolls to the program; falls back to `cta`. */
    cta?: { label: Localized; href: string };
  };
  programHeading: Localized;
  programSub: Localized;
  /** Online: 16 lesson rows · intensive: the two days (title + points as `subs`) — also the DB seed. */
  program: ProgramRow[];
  /** Intensive only: Day 1 / Day 2 with a photo each (FR-27). */
  days?: CourseDay[];
  inclusions: {
    heading: Localized;
    sub: Localized;
    /** Each item; `sub` = a second line under it (intensive item 5 + 5a, E-27). */
    items: { text: Localized; sub?: Localized }[];
    note?: Localized;
    image?: Pic;
  };
  author: { heading: Localized; sub: Localized; images: Pic[] };
  gallery: { heading: Localized; caption: Localized; images: Pic[] };
  faq: FaqSection;
  final: {
    heading: Localized;
    sub: Localized;
    guarantee: Localized;
    image: Pic;
  };
  /**
   * Every «Придбати курс» / «Стати майстром» / «Записатися на інтенсив» of the page — also the
   * hero's primary button (Oksana «Придбати курс»; no Stripe yet, B-93).
   */
  cta: { label: Localized; href: string };
  tiers: Tier[];
};

/** Shared lines of both course pages. */
export const courseCopy = {
  switchOnline: uk4('Онлайн-курс'),
  switchIntensive: uk4('Офлайн-інтенсив'),
  switchLabel: uk4('Формат курсу'),
  programCta: uk4('Програма навчання'),
  authorFacts: [
    uk4('20+ років практики: нарощування, фарбування і відновлення волосся'),
    uk4('В Україні — запис на рік уперед і складні випадки'),
    uk4('Усі майстрині студії навчені нею і працюють за одним стандартом'),
  ],
  authorCtaLabel: uk4('Стати майстром'),
  /** `.dec_ghost_num` behind Author (8.0 §5) — the number from the copy. */
  ghost: '20+',
  skillsLabel: uk4('Що Ви вмітимете'),
};

export type PriceCardCopy = {
  heading: Localized;
  sub: Localized;
  price: Localized;
  name: Localized;
  format: Localized;
  place: Localized;
  cta: Localized;
  /** Set → the button is a link (online → Direct); unset → it opens the booking channels. */
  href?: string;
  image: Pic;
};

/** PriceCard `#price` → Pricing4 (intensive): price 990 € (E-31); «Забронювати місце» opens the channels (Q-03, B-93). */
export const priceCardCopy: PriceCardCopy = {
  heading: uk4('Вартість інтенсиву'),
  sub: uk4(
    'Фіксована ціна за повне 2-денне занурення у професію та практичне відпрацювання у студії. Найближчу дату називаємо в повідомленні.',
  ),
  price: coursePrice.intensive,
  name: uk4('Офлайн-інтенсив „Від новачка до профі“'),
  format: uk4('2 дні · мінігрупа до 4 осіб · практика на моделях'),
  place: uk4('Studio Demo, Варшава'),
  cta: uk4('Забронювати місце'),
  // 23.11: Teach_Model_01 and the intensive's Teach_Model_02 are one frame now (BT9A5450) → Olena at the mannequin
  image: shoot.teachMannequin,
};

const fromAnywhere = uk4('З будь-якої точки світу');
const studyPriceHeading = uk4('Вартість навчання');

/** Online microcapsules — Oksana's copy 26.10 §6 (one card instead of tiers); 16 lessons, the group (Q-10). */
const onlinePriceCard: PriceCardCopy = {
  heading: studyPriceHeading,
  sub: uk4('Фіксована ціна за 16 онлайн-уроків і доступ до групи учениць'),
  price: coursePrice.online,
  name: uk4('Онлайн-курс з мікрокапсульного нарощування волосся'),
  format: uk4('16 онлайн-уроків у записі'),
  place: fromAnywhere,
  cta: enrolLabel,
  href: ACADEMY_DIRECT,
  image: shoot.theory,
};

const programCourseCta = { label: uk4('Програма курсу'), href: '#program' };
const programIntensiveCta = {
  label: uk4('Програма інтенсиву'),
  href: '#program',
};

const p = (title: Localized, body: string, subs: string[]): ProgramRow => ({
  title,
  body: uk4(body),
  subs: subs.map((x) => uk4(x)),
});

/** The 16 recorded lessons (Decisions 20.10): titles — 9_Text.md; bodies and sub-points unchanged. */
const onlineProgram: ProgramRow[] = [
  p(
    uk4('Вступ: інструменти й матеріали'),
    'Апарат для капсуляції, апарат для нарощування, кератин і все, що потрібно на старті.',
    ['Апарати', 'Кератин', 'Матеріали'],
  ),
  p(
    uk4('Зрізи волосся'),
    'Які бувають донорські зрізи і яке волосся краще обрати для нарощування. Випадки з практики.',
    ['Зрізи', 'Донорське волосся', 'Випадки з практики'],
  ),
  p(
    uk4('Підбір за структурою і фарбування'),
    'Як підібрати донорське волосся за структурою і правильно його фарбувати.',
    ['Структура', 'Фарбування'],
  ),
  p(
    uk4('Підбір відтінку'),
    'Детальний підбір донорського волосся за відтінками.',
    ['Відтінки'],
  ),
  p(
    uk4('Робота з кардою'),
    'Як працювати з кардою, змішувати волосся і готувати його до капсуляції.',
    ['Карда', 'Змішування', 'Підготовка'],
  ),
  p(
    uk4('Робота з кератином'),
    'Змішування кератину під колір волосся і детальна капсуляція пасом на практиці.',
    ['Кератин', 'Колір', 'Капсуляція'],
  ),
  p(
    uk4('Капсуляція: детальний розбір'),
    'Капсуляція крок за кроком, з розбором деталей.',
    ['Капсуляція'],
  ),
  p(
    uk4('Діагностика клієнтки'),
    'Як оцінити волосся клієнтки перед нарощуванням: детальний розбір.',
    ['Діагностика'],
  ),
  p(
    uk4('Загущення і подовження'),
    'Як отримати ефект загущення або подовження: детальний розбір.',
    ['Загущення', 'Подовження'],
  ),
  p(
    uk4('З чого почати нарощування'),
    "Проділ, маківка і точка об'єму — з них починається робота.",
    ['Проділ', 'Маківка', "Точка об'єму"],
  ),
  p(
    uk4('Проділ і відтяжка'),
    'Правильний проділ для нарощування і відтяжка пасом.',
    ['Проділ', 'Відтяжка'],
  ),
  p(uk4('Процес нарощування'), 'Правильна постановка капсули на практиці.', [
    'Постановка капсули',
    'Практика',
  ]),
  p(uk4('Чищення апарата'), 'Як детально почистити апарат.', [
    'Догляд за апаратом',
  ]),
  p(uk4('Зняття капсул'), 'Детальне і правильне зняття капсул.', ['Зняття']),
  p(
    uk4('Підготовка до корекції'),
    'Підготовка волосся до корекції, вичісування пасом на практиці і капсуляція пасма.',
    ['Корекція', 'Вичісування', 'Капсуляція'],
  ),
  p(uk4('Підсумки курсу'), 'Вердикт і загальні підсумки.', ['Підсумки']),
];

const gallery9 = (): Pic[] => [
  // 16.11: every phone photo → the course shoot 09.11 (round 2: the four graduate snapshots too — theory in the
  // hall, a mannequin, a model, the result); the certificate handing and Tetiana's own photo stay (the shoot has
  // no certificate frames). The last one is a close-up, since a lone last polaroid on a phone is cut to 16:10
  // (refine.css § 9).
  // 23.11 (owner, on the online reconstruction card: «прибрати фото з цьою ученицею а тільки залишити де є
  // Олена»): the frames where that student works alone (Recon_Card_01/02, Practice_Dry_01/02, Practice_Iron_03,
  // Practice_Mannequin_02, Student_Mannequin_01) are out; Olena-with-student frames take their places.
  shoot.hall,
  shoot.mentorShow,
  shoot.mentorIron,
  shoot.result,
  shoot.mentorTall,
  shoot.mannequinPair,
  {
    src: 'Academy/Certificate_01.webp',
    alt: uk4('Вручення міжнародного сертифіката випускниці'),
  },
  {
    src: 'Academy/Story_Graduate_02.webp',
    alt: uk4('Олена вручає Тетяні сертифікат у салоні Studio Demo'),
  },
  shoot.capsuleTall,
];

/** Both course pages' author block — Olena from the studio shoot 03.11 (owner 08.11). */
const vladaPortrait: Pic = {
  src: 'Masters/Dana_05.webp',
  alt: uk4('Олена Демченко, засновниця Studio Demo'),
};

const certificate = uk4('Міжнародний сертифікат');
const fromZero = uk4('З нуля — до майстра з нарощування волосся');
const microTitle = uk4('Мікрокапсульне нарощування');

const onlineCourse: CourseDetail = {
  slug: COURSE_SLUG,
  format: 'online',
  sibling: INTENSIVE_SLUG,
  programIsLessons: true,
  priceCard: onlinePriceCard,
  price: coursePrice.online,
  metaTitle: uk4('Онлайн-курс мікрокапсульного нарощування — Studio Demo'),
  metaDescription: uk4(
    'Записані відеоуроки з озвучкою чотирма мовами, онлайн-методичка і група учениць. Навчання у власному темпі в особистому кабінеті.',
  ),
  hero: {
    eyebrow: uk4('Авторський курс'),
    title: microTitle,
    sub: fromZero,
    tags: [
      uk4('Онлайн'),
      uk4('Для початківців'),
      uk4('Для діючих майстрів'),
      certificate,
    ],
    // course shoot 09.11 instead of the phone photos (16.11)
    images: [shoot.theoryTall, shoot.capsuleTall],
  },
  audience: {
    heading: uk4('Для кого створена ця навчальна програма'),
    sub: uk4(
      'Знайдіть свою відправну точку і подивіться, що Ви вмітимете після курсу',
    ),
    segments: [
      {
        title: uk4('Для початківців'),
        body: uk4(
          "Ви ніколи не працювали з волоссям, але хочете освоїти б'юті-професію з нуля",
        ),
      },
      {
        title: {
          // homonym (Skill_Coding trap): the audience title is shorter than the hero tag in ru / pl
          uk: 'Для діючих майстрів',
          pl: 'Dla stylistek',
          en: 'For working stylists',
        },
        body: uk4(
          'Ви вже працюєте з волоссям і хочете додати нарощування до прайсу та підняти свій дохід',
        ),
      },
      {
        title: uk4('Для роботи в ЄС'),
        body: uk4(
          'Ви переїхали до Європи або шукаєте професію, з якою можна працювати в різних країнах',
        ),
      },
    ],
    skills: [
      uk4('Підбір донорського волосся за структурою і відтінком'),
      uk4('Робота з кератином і капсуляція пасом'),
      uk4('Діагностика волосся клієнтки перед нарощуванням'),
      uk4('Проділ, відтяжка і постановка капсули'),
      uk4('Корекція і зняття капсул'),
    ],
    image: shoot.teachMannequin,
    cta: programCourseCta,
  },
  programHeading: uk4('Програма навчання'),
  programSub: uk4('16 відеоуроків: теорія і практика крок за кроком'),
  program: onlineProgram,
  inclusions: {
    heading: uk4('Що включено у вартість навчання'),
    sub: uk4(
      'Усе необхідне для комфортного опанування професії та впевненого старту',
    ),
    items: [
      {
        text: uk4('16 відеоуроків з теорією і практикою'),
      },
      {
        text: uk4('Онлайн-методичка'),
      },
      {
        text: uk4('Група учениць для питань і підтримки'),
      },
      // + 4 items from Oksana's copy §6 (Decisions 22.10 «Онлайн-курс: один тариф «все включено»»)
      {
        text: uk4('Перевірена база постачальників волосся та інструментів'),
      },
      {
        text: uk4('Аналіз помилок і корекція техніки'),
      },
      {
        text: uk4('Прямий контакт і підтримка від Олени'),
      },
      {
        text: uk4('Допомога зі стартом роботи з клієнтами'),
      },
      {
        text: uk4('Озвучка уроків чотирма мовами'),
      },
      {
        text: uk4('Особистий кабінет учениці'),
      },
      { text: certificate },
    ],
  },
  author: {
    heading: uk4('Ваш викладач — Олена Демченко'),
    sub: uk4(
      "Практикуючий експерт із 20+ роками досвіду в б'юті-сфері та засновниця Studio Demo",
    ),
    images: [vladaPortrait, shoot.posterTall],
  },
  gallery: {
    heading: uk4('Навчання в Studio Demo'),
    caption: uk4('Учениці за роботою'),
    images: gallery9(),
  },
  faq: onlineFaq,
  final: {
    heading: uk4("Почніть свій шлях до б'юті-професії вже сьогодні"),
    sub: uk4(
      '16 уроків, онлайн-методичка і група — навчайтеся у своєму темпі з будь-якої країни',
    ),
    // «Доступ на e-mail одразу після оплати» needs online payment (Q-02) → the floor line.
    guarantee: uk4('Про старт і доступ — пишіть у Direct'),
    image: shoot.students,
  },
  cta: { label: enrolLabel, href: ACADEMY_DIRECT },
  tiers: [
    { id: 'basic', name: 'BASIC' },
    { id: 'middle', name: 'MIDDLE', featured: true },
    { id: 'mentoring', name: 'MENTORING' },
  ],
};

const day1 = uk4('День 1 — капсуляція на моделі');
const day1Points = [
  uk4('Структура волосся: пухнасте, пряме — і як під неї підбирати'),
  uk4('Підбір і змішування відтінків, непомітний перехід'),
  uk4('Підбір і змішування кератину'),
  uk4('Діагностика голови моделі'),
  uk4('Підбір і підготовка волосся під модель'),
  uk4(
    'Повноцінна капсуляція: після першого дня Ви вже вмієте працювати майстром-капсулятором',
  ),
];
const day2 = uk4('День 2 — нарощування на моделі');
const day2Points = [
  uk4('Нарощування на голові-манекені з натуральним волоссям'),
  uk4(
    'Нарощування на тій самій моделі волоссям, яке Ви підготували в перший день',
  ),
  uk4('Миття і сушіння голови'),
  uk4('Постановка капсул'),
  uk4('Укладка і підрізання кінчиків — цього теж навчаємо'),
];

const intensiveCourse: CourseDetail = {
  slug: INTENSIVE_SLUG,
  format: 'intensive',
  sibling: COURSE_SLUG,
  priceCard: priceCardCopy,
  price: coursePrice.intensive,
  metaTitle: uk4('Офлайн-інтенсив з нарощування у Варшаві — Studio Demo'),
  metaDescription: uk4(
    'Індивідуальне навчання: у кожної учениці своя модель, майстер стежить за кожним етапом і одразу виправляє помилки. Капсуляція, нарощування на моделі і міжнародний сертифікат.',
  ),
  hero: {
    eyebrow: uk4('Інтенсив: від новачка до профі'),
    title: microTitle,
    sub: fromZero,
    tags: [
      uk4('Офлайн у Варшаві'),
      uk4('Для новачків'),
      uk4('Для майстрів із досвідом'),
      certificate,
    ],
    // course shoot 09.11 instead of the phone photos (16.11); the second one (was a graduate's phone
    // photo with her certificate) — Dana's pick BT9A5236, a capsule going in on the mannequin
    images: [shoot.teachModelTall, shoot.capsuleShield],
  },
  audience: {
    heading: uk4('Для кого створений цей офлайн-інтенсив'),
    sub: uk4(
      'Оберіть свій рівень і дізнайтеся, яких результатів Ви досягнете за 2 дні в нашій студії',
    ),
    segments: [
      {
        title: uk4('Для новачків'),
        body: uk4(
          "Ви хочете впевнено стартувати в б'юті-сфері з нуля і одразу почати працювати на якісній практиці",
        ),
      },
      {
        title: uk4('Для досвідчених'),
        body: uk4(
          'Ви вже працюєте, але хочете підвищити дохід, підняти середній чек та освоїти нові техніки',
        ),
      },
      {
        title: uk4('Для практиків'),
        body: uk4(
          'Ви хочете додати мікрокапсульне нарощування до свого прайсу або вийти на сильніший рівень',
        ),
      },
    ],
    skills: [
      uk4('Повноцінна капсуляція вже після першого дня'),
      uk4('Кожен етап — від діагностики до укладки'),
      uk4('Підбір волосся і відтінку під структуру клієнтки'),
      uk4('Контакти перевірених постачальників і підрядників'),
      uk4('Портфоліо з навчання для пошуку перших клієнток'),
    ],
    image: shoot.capsule,
    cta: programIntensiveCta,
  },
  programHeading: uk4('Покрокова програма 2-денного інтенсиву'),
  programSub: uk4(
    'Мінігрупа до 4 осіб, у кожної своя модель. Теорію пояснюємо прямо під час роботи, помилки виправляємо одразу.',
  ),
  program: [
    { title: day1, body: day1Points[0], subs: day1Points },
    { title: day2, body: day2Points[0], subs: day2Points },
  ],
  days: [
    { title: day1, points: day1Points, image: shoot.theory },
    { title: day2, points: day2Points, image: shoot.capsuleTool },
  ],
  inclusions: {
    heading: uk4('Що включено в інтенсив'),
    sub: uk4(
      'Повний комплект знань, підтримка та інструменти для швидкого запуску Вашої справи',
    ),
    // Six items (FR-27): 1, 2, 3, 4, 5 + 5a in one item (E-27), 6.
    items: [
      {
        text: uk4('2 дні в студії: мінігрупа до 4 осіб, у кожної своя модель'),
      },
      {
        text: uk4('Методичка'),
      },
      {
        text: uk4('Їжа, вода й напої під час навчання'),
      },
      {
        text: uk4('Портфоліо: знімаєте модель і процес для пошуку клієнток'),
      },
      {
        text: uk4('Telegram-група з майстрами і курсантками'),
        sub: uk4('Контакти постачальників, SMM, таргетолога й бухгалтера'),
      },
      { text: certificate },
    ],
    /** The note under the list (V-18479, «прийнято 22.10»). */
    note: uk4(
      'З собою — лише гарний настрій і бажання вчитися. Усе інше даємо ми.',
    ),
    image: {
      src: 'Academy/Certificate_01.webp',
      alt: uk4('Вручення міжнародного сертифіката випускниці'),
    },
  },
  author: {
    heading: uk4('Ваш наставник — Олена Демченко'),
    sub: uk4("Засновниця Studio Demo з 20+ роками досвіду в б'юті-сфері"),
    // the phone photo under the DEMO sign → Olena guiding a student at the course shoot (16.11)
    images: [shoot.mentorGuide, vladaPortrait],
  },
  gallery: {
    heading: uk4('Процес навчання'),
    caption: uk4('Навчання у Варшаві'),
    images: gallery9(),
  },
  faq: intensiveFaq,
  final: {
    heading: uk4('Зробіть крок до нової професії у Варшаві'),
    sub: uk4(
      '2 дні практики, авторська техніка мікрокапсульного нарощування і міжнародний сертифікат',
    ),
    guarantee: uk4('Мінігрупа до 4 осіб · своя модель'),
    // the graduates' phone photo → the mini-group with Olena at the course shoot (16.11)
    image: shoot.talk,
  },
  cta: { label: signUpIntensive, href: '#price' },
  tiers: [{ id: 'intensive', name: 'Інтенсив', featured: true }],
};

/* ---------------- Course 2 — hair reconstruction ---------------- */

const reconTitle = uk4('Реконструкція та відновлення волосся');

const careGallery = (): Pic[] => [
  {
    src: 'Salon_Works/Dohliad_01.webp',
    alt: uk4('Кератин: 5 місяців після процедури'),
  },
  {
    src: 'Salon_Works/Dohliad_02.webp',
    alt: uk4('Волосся після кератинового відновлення: дзеркальний блиск'),
  },
  {
    src: 'Salon_Works/Dohliad_03.webp',
    alt: uk4('Волосся після кератину і фарбування'),
  },
  // the phone photo of a dark-hair result → the photographer's frame (wfolio «рабочий процесс» BT9A4611, 16.11)
  {
    src: 'Salon_Space/Smooth_Result_01.webp',
    alt: l3(
      'Довге гладке світле волосся після процедури в салоні',
      'Długie, gładkie jasne włosy po zabiegu w salonie',
      'Long, smooth blonde hair after a treatment at the salon',
    ),
  },
  {
    src: 'Salon_Works/Dohliad_07.webp',
    alt: uk4('Волосся після кератинового відновлення: дзеркальний блиск'),
  },
  {
    src: 'Salon_Works/Dohliad_06.webp',
    alt: uk4('Робота майстрів Studio Demo'),
  },
  {
    src: 'Salon_Space/Extension_Work_01.webp',
    alt: uk4('Майстрині нарощують волосся клієнтці в салоні'),
  },
  {
    src: 'Salon_Space/Interior_02.webp',
    alt: uk4("Інтер'єр салону з вивіскою DEMO"),
  },
];

/** Gallery of course 2: the studio's own care results, not graduates' work (no such photos yet). */
const careGalleryCopy = {
  heading: uk4('Результати реконструкції в Studio Demo'),
  caption: uk4('Роботи майстрів студії'),
};

const reconOnlineCourse: CourseDetail = {
  slug: RECON_COURSE_SLUG,
  format: 'online',
  sibling: RECON_INTENSIVE_SLUG,
  // Owner 27.10: lessons not recorded yet — «Передзапис», every button → Direct, no cabinet lessons.
  soon: soonLabel,
  priceCard: {
    heading: studyPriceHeading,
    sub: uk4(
      "Фіксована ціна за повний онлайн-курс та доступ до чату зі зворотним зв'язком",
    ),
    price: coursePrice.reconOnline,
    name: uk4('Онлайн-курс з реконструкції та відновлення волосся'),
    format: uk4('Навчальні відеоуроки + чат підтримки'),
    place: fromAnywhere,
    cta: notifyLabel,
    href: ACADEMY_DIRECT,
    image: {
      src: 'Salon_Works/Dohliad_06.webp',
      alt: uk4('Робота майстрів Studio Demo'),
    },
  },
  price: coursePrice.reconOnline,
  metaTitle: uk4('Онлайн-курс з реконструкції волосся — Studio Demo'),
  metaDescription: uk4(
    'Онлайн-уроки з холодного відновлення, кератину, ботоксу та Aqua Coco: методичка, підтримка викладачів і міжнародний сертифікат.',
  ),
  hero: {
    eyebrow: uk4('Авторський курс'),
    title: reconTitle,
    sub: uk4('З нуля до майстра з гарячих та холодних технік догляду'),
    tags: [
      uk4('Онлайн'),
      uk4('Для початківців'),
      uk4('Для діючих майстрів'),
      certificate,
    ],
    images: [
      {
        src: 'Salon_Works/Dohliad_02.webp',
        alt: uk4('Волосся після кератинового відновлення: дзеркальний блиск'),
      },
      // the phone photo → Olena teaching the flat iron at the course shoot (16.11)
      shoot.mentorIron,
    ],
  },
  audience: {
    heading: uk4('Для кого створена ця навчальна програма'),
    sub: uk4(
      'Знайдіть свою відправну точку і подивіться, що Ви вмітимете після курсу',
    ),
    segments: [
      {
        title: uk4('Для початківців'),
        body: uk4(
          "Ви ніколи не працювали з волоссям, але хочете опанувати затребувану б'юті-професію з нуля у власному темпі без прив'язки до географії",
        ),
      },
      {
        title: {
          uk: 'Для діючих майстрів',
          pl: 'Dla stylistek',
          en: 'For working stylists',
        },
        body: uk4(
          'Ви вже працюєте з волоссям, але прагнете розширити спектр послуг, освоїти нові склади та підняти середній чек',
        ),
      },
      {
        title: uk4('Для роботи в ЄС'),
        body: uk4(
          'Ви переїхали до Європи або шукаєте професію, з якою можна працювати в різних країнах',
        ),
      },
    ],
    skills: [
      uk4(
        'Точна діагностика ступеня пошкодження волосся та правильний підбір складів під будь-який тип',
      ),
      uk4(
        'Володіння 4 напрямками: холодне відновлення, 3 види кератину, 2 види ботоксу та склад нового покоління Aqua Coco',
      ),
      uk4(
        'Постановка руки: правильна робота утюжком, вигладжування, розподіл складу та корекція без перевантаження',
      ),
      uk4(
        'Готова база перевірених постачальників матеріалів та складів у Європі',
      ),
      uk4('Розуміння, як сформувати свій прайс та залучити перших клієнтів'),
    ],
    image: {
      src: 'Salon_Works/Dohliad_03.webp',
      alt: uk4('Волосся після кератину і фарбування'),
    },
    cta: programCourseCta,
  },
  programHeading: uk4('Програма навчання'),
  programSub: uk4(
    'Покрокові онлайн-уроки: теорія, демонстрація технік та відеорозбори від діагностики до фінального результату',
  ),
  program: [
    p(
      uk4('Формат навчання'),
      'Повний комплекс уроків у високій якості: теорія і практичні відеодемонстрації.',
      ['Теорія', 'Відеодемонстрації'],
    ),
    p(
      uk4('Покрокові інструкції'),
      'Глибока діагностика, підготовка волосся, робота з різними ступенями пошкодження, підбір кератину (слабкий / середній / сильний), ботоксу (класичний / концентрат) та складів Aqua Coco.',
      ['Діагностика', 'Кератин', 'Ботокс', 'Aqua Coco'],
    ),
    p(
      uk4('Практичні складові'),
      'Постановка руки на відео, розбір техніки вигладжування, контролю руху, розподілу складів, правил корекції відрослих зон та усунення частих помилок.',
      ['Постановка руки', 'Вигладжування', 'Корекція'],
    ),
  ],
  inclusions: {
    heading: uk4('Що включено у вартість навчання'),
    sub: uk4(
      'Усе необхідне для комфортного опанування професії та впевненого старту',
    ),
    items: [
      {
        text: uk4(
          'Відеоуроки з детальною теорією та демонстрацією всіх 4 процедур реконструкції',
        ),
      },
      {
        text: uk4(
          'Детальна методичка, до якої можна повертатися під час роботи',
        ),
      },
      { text: uk4("Підтримка та зворотний зв'язок у чаті з викладачами") },
      {
        text: uk4(
          'Перевірена база постачальників складів, матеріалів та інструментів',
        ),
      },
      {
        text: uk4(
          'Секрети створення контенту для соцмереж і залучення перших клієнтів',
        ),
      },
      { text: certificate },
    ],
    image: {
      src: 'Academy/Certificate_01.webp',
      alt: uk4('Вручення міжнародного сертифіката випускниці'),
    },
  },
  author: {
    heading: uk4('Ваш викладач — Олена Демченко'),
    sub: uk4(
      "Практикуючий експерт із 20+ роками досвіду в б'юті-сфері та засновниця Studio Demo",
    ),
    // the phone photo → Olena teaching at the course shoot 09.11 (16.11)
    images: [vladaPortrait, shoot.theoryTall],
  },
  gallery: { ...careGalleryCopy, images: careGallery() },
  faq: reconOnlineFaq,
  final: {
    heading: uk4("Почніть свій шлях до б'юті-професії вже сьогодні"),
    sub: uk4(
      'Відеоуроки, методичка і підтримка викладачів — навчайтеся у своєму темпі з будь-якої країни',
    ),
    guarantee: uk4('Про старт і доступ — пишіть у Direct'),
    image: {
      src: 'Salon_Works/Dohliad_06.webp',
      alt: uk4('Майстриня за роботою в салоні'),
    },
  },
  cta: { label: notifyLabel, href: ACADEMY_DIRECT },
  tiers: [{ id: 'online', name: 'Онлайн', featured: true }],
};

const reconDay1 = uk4('День 1 — холодне відновлення та кератин');
const reconDay1Points = [
  uk4(
    'Глибока діагностика: визначення ступеня пошкодження волосся та підбір догляду',
  ),
  uk4('Підготовка та відновлення волосся перед іншими процедурами'),
  uk4('Практичне відпрацювання холодного відновлення на моделі'),
  uk4(
    'Все про кератин: принципи роботи, підбір під тип волосся (слабкий, середній, сильний склад)',
  ),
  uk4('Практичне відпрацювання кератинового випрямлення на живій моделі'),
];
const reconDay2 = uk4('День 2 — ботокс, Aqua Coco та постановка руки');
const reconDay2Points = [
  uk4(
    'Ботокс для волосся: класичний склад та ботокс-концентрат — відпрацювання на моделі',
  ),
  uk4(
    "Aqua Coco — склад нового покоління: робота без їдкого диму, збереження дисульфідних зв'язків, робота з сильним завитком",
  ),
  uk4(
    'Техніка та постановка руки: робота утюжком, контроль руху, вигладжування та рівномірний розподіл',
  ),
  uk4('Корекція процедур: робота з відрослим корінням та корекція по довжині'),
];

const reconPriceCard: PriceCardCopy = {
  heading: uk4('Вартість інтенсиву'),
  sub: uk4(
    'Фіксована ціна за 2 дні повної практики на живих моделях у студії. Найближчу дату називаємо в повідомленні.',
  ),
  price: coursePrice.reconIntensive,
  name: uk4('Офлайн-інтенсив з реконструкції та відновлення волосся'),
  format: uk4('2 дні · мінігрупа 2–6 осіб · практика на живих моделях'),
  place: priceCardCopy.place,
  cta: priceCardCopy.cta,
  image: {
    src: 'Salon_Works/Dohliad_06.webp',
    alt: uk4('Робота майстрів Studio Demo'),
  },
};

const reconIntensiveCourse: CourseDetail = {
  slug: RECON_INTENSIVE_SLUG,
  format: 'intensive',
  sibling: RECON_COURSE_SLUG,
  priceCard: reconPriceCard,
  price: coursePrice.reconIntensive,
  metaTitle: uk4(
    'Офлайн-інтенсив з реконструкції волосся у Варшаві — Studio Demo',
  ),
  metaDescription: uk4(
    'Холодне відновлення, 3 види кератину, 2 види ботоксу та Aqua Coco — практика на живих моделях під контролем 2–3 майстрів. Міжнародний сертифікат.',
  ),
  hero: {
    eyebrow: uk4('Інтенсив: від новачка до профі'),
    title: reconTitle,
    sub: uk4(
      '2 дні максимальної практики на живих моделях під наглядом 2–3 майстрів',
    ),
    tags: [
      uk4('Офлайн у Варшаві'),
      uk4('Для новачків'),
      uk4('Для майстрів із досвідом'),
      certificate,
    ],
    images: [
      {
        src: 'Salon_Works/Dohliad_01.webp',
        alt: uk4('Кератин: 5 місяців після процедури'),
      },
      {
        src: 'Salon_Works/Dohliad_03.webp',
        alt: uk4('Волосся після кератину і фарбування'),
      },
    ],
  },
  audience: {
    heading: uk4('Для кого створений цей офлайн-інтенсив'),
    sub: uk4(
      'Оберіть свій рівень і дізнайтеся, яких результатів Ви досягнете за 2 дні в нашій студії',
    ),
    segments: [
      {
        title: uk4('Для новачків'),
        body: uk4(
          "Ви хочете впевнено стартувати в б'юті-сфері з нуля і одразу почати працювати на якісній практиці",
        ),
      },
      {
        title: uk4('Для досвідчених'),
        body: uk4(
          'Ви вже працюєте з волоссям, але прагнете розширити спектр послуг, освоїти нові склади та підняти середній чек',
        ),
      },
      {
        title: uk4('Для практиків'),
        body: uk4(
          'Ви хочете додати процедури гарячої та холодної реконструкції до свого прайсу або вийти на сильніший, експертний рівень',
        ),
      },
    ],
    skills: [
      uk4(
        'Впевнена робота з будь-якими типами та ступенями пошкодження волосся без страху',
      ),
      uk4(
        'Відпрацювання 4 напрямків: холодне відновлення, кератин (3 види), ботокс (2 види), Aqua Coco',
      ),
      uk4(
        'Поставлена рука, правильна техніка вигладжування та розподілу складів без перевантаження',
      ),
      uk4('Портфоліо робіт і контент для соцмереж, створені під час навчання'),
      uk4(
        'Контакти перевірених постачальників, а також SMM-фахівця, таргетолога й бухгалтера',
      ),
    ],
    // the phone photo → flat-iron practice on a live model at the course shoot (16.11)
    image: shoot.ironWork,
    cta: programIntensiveCta,
  },
  programHeading: uk4('Покрокова програма 2-денного інтенсиву'),
  programSub: uk4(
    'Повне занурення в практику: Ви відпрацьовуєте всі склади на живих моделях під особистим контролем 2–3 майстрів у мінігрупі від 2 до 6 осіб',
  ),
  program: [
    { title: reconDay1, body: reconDay1Points[0], subs: reconDay1Points },
    { title: reconDay2, body: reconDay2Points[0], subs: reconDay2Points },
  ],
  days: [
    {
      title: reconDay1,
      points: reconDay1Points,
      image: {
        src: 'Salon_Works/Dohliad_02.webp',
        alt: uk4('Волосся після кератинового відновлення: дзеркальний блиск'),
      },
    },
    {
      title: reconDay2,
      points: reconDay2Points,
      image: {
        src: 'Salon_Works/Dohliad_06.webp',
        alt: uk4('Майстриня за роботою в салоні'),
      },
    },
  ],
  inclusions: {
    heading: uk4('Що включено в інтенсив'),
    sub: uk4(
      'Повний комплект знань, підтримка та інструменти для швидкого запуску Вашої справи',
    ),
    items: [
      {
        text: uk4(
          '2 дні практики на живих моделях у мінігрупі (2–6 осіб) під керівництвом 2–3 майстрів',
        ),
      },
      {
        text: uk4(
          'Друкована методичка з усією необхідною інформацією для роботи після курсу',
        ),
      },
      {
        text: uk4(
          'Портфоліо та фото- і відеоконтент для соцмереж, зроблений під час навчання',
        ),
      },
      {
        text: uk4('Контакти перевірених постачальників складів та матеріалів'),
      },
      {
        text: uk4(
          'Контакти SMM-фахівця, таргетолога та бухгалтера для швидкого запуску й залучення клієнтів',
        ),
      },
      { text: certificate },
    ],
    note: uk4(
      'З собою — лише гарний настрій. Матеріали, склади, інструменти, каву й напої даємо ми.',
    ),
    image: {
      src: 'Academy/Certificate_01.webp',
      alt: uk4('Вручення міжнародного сертифіката випускниці'),
    },
  },
  author: {
    heading: uk4('Ваш наставник — Олена Демченко'),
    sub: uk4("Засновниця Studio Demo з 20+ роками досвіду в б'юті-сфері"),
    // the phone photo under the DEMO sign → Olena watching a student at the flat iron (course shoot, 16.11)
    images: [vladaPortrait, shoot.mentorIronWatch],
  },
  gallery: { ...careGalleryCopy, images: careGallery() },
  faq: reconIntensiveFaq,
  final: {
    heading: uk4('Зробіть крок до нової професії у Варшаві'),
    sub: uk4(
      "2 дні практики на моделях, відпрацювання 4 топових процедур та впевнений старт у б'юті-сфері",
    ),
    // ≤40 slot (Diff_Intensives §9): Oksana's line was 46 characters.
    guarantee: uk4('2–6 осіб · 2–3 майстри · живі моделі'),
    image: {
      src: 'Salon_Works/Dohliad_06.webp',
      alt: uk4('Робота майстрів Studio Demo'),
    },
  },
  cta: { label: signUpIntensive, href: '#price' },
  tiers: [{ id: 'intensive', name: 'Інтенсив', featured: true }],
};

/** Order = the static params; the online course first (its URL is older, sitemap). */
export const courseDetails: CourseDetail[] = [
  onlineCourse,
  intensiveCourse,
  reconOnlineCourse,
  reconIntensiveCourse,
];

export const getCourseDetail = (slug: string) =>
  courseDetails.find((c) => c.slug === slug) ?? null;

/* ---------------- Personal mentoring (Dana 16.11) ---------------- */

/**
 * `/courses/personal-mentoring` — Dana's text 16.11 («ЛИЧНОЕ НАСТАВНИЧЕСТВО | VIP-ОБУЧЕНИЕ»), in her order
 * and her first person: the lead → «Никаких стандартных программ…» + «Вы сами выбираете…» → «Что вы
 * получаете» (6) → the author → «Стоимость» (both prices) → photos → her closing lines. One format only, so
 * it has its own page (`app/[locale]/courses/[slug]/Mentoring_Page.tsx`), not the two-format template: no
 * FormatSwitch, no audience cards, day program or FAQ — her text has none, and nothing is invented around
 * it. uk — a translation of her Russian (capital «Ви», «20 років»), ru — her words, pl / en — drafts.
 */
export type MentoringDetail = {
  slug: string;
  metaTitle: Localized;
  metaDescription: Localized;
  /** The one-price slots (catalog card, admin price table): «від 2 000 €». */
  price: Localized;
  /** Both prices — the hero, the price card and the final band. */
  options: { days: Localized; price: Localized }[];
  /** Every button of the page → `#price` (the booking channels, like an intensive). */
  book: Localized;
  hero: {
    eyebrow: Localized;
    title: Localized;
    lead: Localized;
    tags: Localized[];
    images: Pic[];
    /** The second button → `#inclusions`. */
    more: Localized;
  };
  choice: {
    heading: Localized;
    sub: Localized;
    listHeading: Localized;
    directions: Localized[];
    combine: Localized;
    faster: Localized;
    image: Pic;
  };
  gets: { heading: Localized; items: Localized[]; image: Pic };
  author: { heading: Localized; sub: Localized; images: Pic[] };
  priceCard: Omit<PriceCardCopy, 'price' | 'cta' | 'href'>;
  gallery: { heading: Localized; caption: Localized; images: Pic[] };
  final: {
    heading: Localized;
    sub: Localized;
    guarantee: Localized;
    image: Pic;
  };
};

const gets = l3('Що Ви отримуєте', 'Co Pani otrzymuje', 'What you get');

export const mentoringCourse: MentoringDetail = {
  slug: MENTORING_SLUG,
  metaTitle: l3(
    'Особисте наставництво з Оленою Демченко — Studio Demo',
    'Mentoring indywidualny z Oleną Demchenko — Studio Demo',
    'Personal mentoring with Olena Demchenko — Studio Demo',
  ),
  metaDescription: l3(
    'VIP-навчання у Варшаві: 2 або 3 дні індивідуально з Оленою Демченко. Ви самі обираєте напрями — нарощування, фарбування, колористику, кератин, ботокс, відновлення волосся.',
    'Szkolenie VIP w Warszawie: 2 lub 3 dni indywidualnie z Oleną Demchenko. Sama Pani wybiera kierunki — przedłużanie, koloryzację, kolorystykę, keratynę, botoks, regenerację włosów.',
    'VIP training in Warsaw: 2 or 3 one-to-one days with Olena Demchenko. You choose the topics — extensions, colouring, colour theory, keratin, botox, hair restoration.',
  ),
  price: mentoringFrom,
  options: mentoringOptions,
  book: mentoringBook,
  hero: {
    eyebrow: l3('VIP-навчання', 'Szkolenie VIP', 'VIP training'),
    title: l3(
      'Особисте наставництво',
      'Mentoring indywidualny',
      'Personal mentoring',
    ),
    lead: l3(
      'Ви бронюєте не просто навчання. Ви бронюєте мене, мій час і 20 років професійного досвіду на 2 або 3 дні!',
      'Nie rezerwuje Pani zwykłego szkolenia. Rezerwuje Pani mnie, mój czas i 20 lat doświadczenia zawodowego na 2 lub 3 dni!',
      'You are not just booking a course. You are booking me, my time and 20 years of professional experience for 2 or 3 days!',
    ),
    tags: [
      uk4('Офлайн у Варшаві'),
      l3('Індивідуально', 'Indywidualnie', 'One-to-one'),
      l3('2 або 3 дні', '2 lub 3 dni', '2 or 3 days'),
    ],
    images: [shoot.mentorTall, shoot.posterTall],
    more: gets,
  },
  choice: {
    heading: l3(
      'Жодних стандартних програм і обмежень!',
      'Żadnych standardowych programów i ograniczeń!',
      'No standard programmes, no limits!',
    ),
    sub: l3(
      'З ранку до вечора я працюю виключно з Вами. Уся моя увага, знання, авторські техніки та професійні секрети — тільки для Вас!',
      'Od rana do wieczora pracuję wyłącznie z Panią. Cała moja uwaga, wiedza, autorskie techniki i zawodowe sekrety — tylko dla Pani!',
      'From morning to evening I work with you alone. All my attention, knowledge, signature techniques and professional secrets are yours!',
    ),
    listHeading: l3(
      'Ви самі обираєте, чого хочете навчитися',
      'Sama Pani wybiera, czego chce się nauczyć',
      'You choose what you want to learn',
    ),
    directions: [
      l3('Нарощування волосся', 'Przedłużanie włosów', 'Hair extensions'),
      l3('Складні фарбування', 'Złożone koloryzacje', 'Complex colouring'),
      l3('Колористика', 'Kolorystyka', 'Colour theory'),
      l3('Кератин', 'Keratyna', 'Keratin'),
      l3('Ботокс', 'Botoks', 'Botox'),
      l3('Відновлення волосся', 'Regeneracja włosów', 'Hair restoration'),
    ],
    combine: l3(
      "Можете об'єднати кілька напрямів в одне навчання.",
      'Może Pani połączyć kilka kierunków w jednym szkoleniu.',
      'You can combine several topics in one training.',
    ),
    faster: l3(
      'Завдяки індивідуальному формату за один день ми можемо опанувати те, на що в груповому навчанні потрібно два!',
      'Dzięki indywidualnemu formatowi w jeden dzień opanujemy to, na co w szkoleniu grupowym potrzeba dwóch!',
      'Thanks to the one-to-one format, in one day we can master what takes two days in a group course!',
    ),
    image: shoot.mentorWatch,
  },
  gets: {
    heading: gets,
    // her six bullets, in her order (after «Что вы получаете:» — hence the accusative in uk / ru / pl)
    items: [
      l3(
        'Усі мої професійні секрети, техніки та напрацювання за 20 років.',
        'Wszystkie moje zawodowe sekrety, techniki i doświadczenia z 20 lat.',
        'All my professional secrets, techniques and know-how from 20 years.',
      ),
      l3(
        'Відповіді абсолютно на всі Ваші запитання — без обмежень!',
        'Odpowiedzi na absolutnie wszystkie Pani pytania — bez ograniczeń!',
        'Answers to absolutely all your questions — no limits!',
      ),
      l3(
        'Максимум практики під моїм особистим керівництвом.',
        'Maksimum praktyki pod moim osobistym kierunkiem.',
        'As much practice as possible under my personal guidance.',
      ),
      l3(
        'Контакти ВСІХ постачальників, з якими ми працюємо. Я ділюся своєю базою перевірених постачальників, яку збирала роками.',
        'Kontakty do WSZYSTKICH dostawców, z którymi współpracujemy. Dzielę się swoją bazą sprawdzonych dostawców, którą zbierałam latami.',
        'Contacts of ALL the suppliers we work with. I share my list of trusted suppliers that I have built up over the years.',
      ),
      l3(
        "Особистий зворотний зв'язок безпосередньо від мене після навчання. Ви не залишаєтеся наодинці з питаннями — я й далі допомагаю Вам і ділюся своїм досвідом.",
        'Osobistą informację zwrotną bezpośrednio ode mnie po szkoleniu. Nie zostaje Pani sama z pytaniami — nadal pomagam i dzielę się swoim doświadczeniem.',
        'Personal feedback directly from me after the training. You are not left alone with your questions — I keep helping you and sharing my experience.',
      ),
      l3(
        'Індивідуальну програму, створену виключно під Ваші цілі.',
        'Indywidualny program stworzony wyłącznie pod Pani cele.',
        'An individual programme built entirely around your goals.',
      ),
    ],
    image: shoot.mentorShow,
  },
  author: {
    heading: uk4('Ваш наставник — Олена Демченко'),
    sub: uk4("Засновниця Studio Demo з 20+ роками досвіду в б'юті-сфері"),
    images: [vladaPortrait, shoot.theoryTall],
  },
  priceCard: {
    heading: l3(
      'Вартість особистого наставництва',
      'Cena mentoringu indywidualnego',
      'Personal mentoring price',
    ),
    sub: l3(
      'Ви бронюєте мій час — я відкриваю Вам усі свої професійні секрети, ділюся постачальниками і залишаюся Вашим наставником після навчання.',
      'Rezerwuje Pani mój czas — odkrywam przed Panią wszystkie swoje zawodowe sekrety, dzielę się dostawcami i zostaję Pani mentorką po szkoleniu.',
      'You book my time — I share all my professional secrets and my suppliers, and stay your mentor after the training.',
    ),
    name: mentoringTitle,
    format: l3(
      'Індивідуально · з ранку до вечора',
      'Indywidualnie · od rana do wieczora',
      'One-to-one · from morning to evening',
    ),
    place: priceCardCopy.place,
    image: shoot.mentor,
  },
  gallery: {
    heading: uk4('Процес навчання'),
    caption: uk4('Навчання у Варшаві'),
    images: [
      shoot.mannequinPair,
      shoot.capsuleTall,
      shoot.mentorGuide,
      shoot.mentorIronWatch,
      shoot.result,
      shoot.mentorWide,
    ],
  },
  final: {
    heading: l3(
      'Це не просто курс',
      'To nie jest zwykły kurs',
      'This is not just a course',
    ),
    sub: l3(
      'Це можливість за кілька днів отримати знання, секрети й досвід, які я напрацьовувала 20 років!',
      'To szansa, by w kilka dni zdobyć wiedzę, sekrety i doświadczenie, które zbierałam przez 20 lat!',
      'It is a chance to gain in a few days the knowledge, secrets and experience I have built up over 20 years!',
    ),
    guarantee: l3(
      'Офлайн у Варшаві · індивідуально',
      'Stacjonarnie w Warszawie · indywidualnie',
      'In person in Warsaw · one-to-one',
    ),
    image: shoot.teachModel,
  },
};

/** Every `/courses/<slug>` page: the two-format courses + the mentoring (static params, sitemap). */
export const coursePageSlugs: string[] = [
  ...courseDetails.map((c) => c.slug),
  MENTORING_SLUG,
];
