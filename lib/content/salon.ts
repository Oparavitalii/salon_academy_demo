import type { Localized } from '@/i18n/routing';
import { uk4 } from '@/lib/i18n/t';

import type { Pic } from './home';

/**
 * `/salon` — `9_Text+Images/9_Text.md` round 4 → «/uk/salon» (CS §1–§7 + client edits 20–21.10).
 * Prices and durations: Booksy 20.10.2026 (`1_Intake/1_Site_Assets/Booksy/Booksy_2026_10_20.md`), per
 * hair length 1 / 2 / 3 / 4. Every price is a «від» price (Dana 16.11.2026 «Все цены нужно указать от»;
 * before, only Booksy's «+» rows had it). Levels: TOP mistrz · майстер · Base (E-20 — no «Junior»).
 * Women's cut and AirTouch carry no price until Q-40 (prices went up, Booksy may lag — E-10).
 * The DB (`/admin/prices`, keyed by `id`) may override `master` / `top` / `duration` on production;
 * `rowsOf` puts «від» on those values too.
 */

/**
 * `'500/600/700/800'` · `'400+/450/500/550'` · `'1100'` → «від 500 / 600 / 700 / 800 zł» · «від 1 100 zł»:
 * «від» once before the whole range (Dana 16.11 «Все цены нужно указать от»); Booksy's «+» is kept
 * in the specs but no longer changes the output.
 */
function zl(spec: string): string {
  const nums = spec.split('/').map((p) => {
    const n = Number(p.trim().replace('+', ''));
    return n >= 1000
      ? `${Math.floor(n / 1000)} ${String(n % 1000).padStart(3, '0')}`
      : String(n);
  });
  return `від ${nums.join(' / ')} zł`;
}

/** Service words of the price list (9_Text.md → «службові слова прайсу»). */
export const priceWords = {
  levelTop: 'TOP mistrz',
  levelMaster: uk4('майстер'),
  levelBase: 'Base',
  labour: uk4('лише робота'),
  firstVisit: uk4('перший візит'),
  fourHands: uk4('у 4 руки'),
  correction: uk4('корекція +1 год'),
  density: '+20 %',
  /** In place of a price that is not confirmed (Q-40). */
  onConsultation: uk4('ціну називаємо на консультації'),
  book: uk4('Записатися'),
};

/** One extra on a price row: a localized label, optionally followed by a value («перший візит 990 zł»). */
export type PriceNote = { label: Localized | string; value?: string };

export type Service = {
  /** DB key (`services.id`, /admin/services) — kept stable across rounds where the service is the same. */
  id: string;
  name: Localized;
  /** Price of the «майстер» row, or of the only row when `level` is set; null = no price on Booksy. */
  master: string | null;
  /** «TOP mistrz» row (Booksy TOP), rendered as its own row. */
  top?: string;
  /** Booksy duration of the main row; `''` = none. */
  duration: string | null;
  /** The TOP row's duration when Booksy gives another one. */
  topDuration?: string;
  /** The main row is a Base-level service (Booksy «Junior» → «Base», E-20). */
  level?: 'base';
  notes?: PriceNote[];
  topNotes?: PriceNote[];
  /** Q-40: the price is hidden whatever the DB holds; the row says «ціну називаємо на консультації». */
  hidePrice?: boolean;
};

/** Name of the row in the DB (/admin/prices): Ukrainian name, Base-level rows marked so two rows never read the same. */
export const serviceDbName = (s: Service) =>
  s.level === 'base' ? `${s.name.uk} · Base` : s.name.uk;

export type ServiceGroup = {
  id: string;
  /** Tab = the group itself (Pricing19 tabs of the 9 groups, CS §2). */
  tab: string;
  name: Localized;
  description?: Localized;
  services: Service[];
};

const s = (
  id: string,
  name: Localized,
  master: string | null,
  duration: string,
  extra: Partial<Service> = {},
): Service => ({
  id,
  name,
  master: master === null ? null : zl(master),
  duration,
  ...extra,
  ...(extra.top ? { top: zl(extra.top) } : {}),
});

const W = priceWords;
/** «перший візит від 990 zł» — a price too, so «від» (Dana 16.11); the «+200 zł» surcharges stay as they are. */
const firstVisit = (v: string): PriceNote => ({
  label: W.firstVisit,
  value: `від ${v}`,
});
const fourHands = (v: string): PriceNote => ({ label: W.fourHands, value: v });
const correction: PriceNote = { label: W.correction };
const density: PriceNote = { label: W.density };

const womenCut = uk4('Жіноча стрижка з укладкою');
const tips = uk4('Підрізання кінчиків');
const wash = uk4('Миття + укладка');
const curls = uk4('Локони, хвилі, зачіска');
const curlsBase = uk4('Локони, хвилі');
const roots = uk4('Фарбування відростків');
const oneStyle = uk4('Однотон + укладка');
const oneCut = uk4('Однотон + стрижка');
const toning = uk4('Тонування');

export const serviceGroups: ServiceGroup[] = [
  {
    id: 'cut',
    tab: 'cut',
    name: uk4('Стрижки'),
    services: [
      s('women-cut', womenCut, null, '1 год 15 хв', { hidePrice: true }),
      s('women-cut-base', womenCut, null, '1 год 30 хв', {
        level: 'base',
        hidePrice: true,
      }),
      s('men', uk4('Чоловіча стрижка'), '150', '1 год'),
      s('tips', tips, '140+', '1 год'),
      s('tips-junior', tips, '130+', '1 год 30 хв', { level: 'base' }),
      s('fringe', uk4('Стрижка чубчика'), '50', '15 хв'),
      s('consult', uk4('Консультація'), null, '15 хв'),
    ],
  },
  {
    id: 'styling',
    tab: 'styling',
    name: uk4('Стилізація волосся'),
    services: [
      s('wash', wash, '100/110/120/140', '1 год 30 хв'),
      s('wash-base', wash, '90/100/110/130', '1 год 30 хв', { level: 'base' }),
      s('curls', curls, '120/150/180/200', '2 год'),
      s('curls-junior', curlsBase, '110/140/170/190', '2 год', {
        level: 'base',
      }),
      s('braids-3', uk4('Плетіння кіс: 3 коси'), '100+', '1 год'),
      s('braids-4', uk4('Плетіння кіс: 4 і більше'), '150+', '2 год 30 хв'),
    ],
  },
  {
    id: 'microcapsule',
    tab: 'microcapsule',
    name: uk4('Нарощування волосся'),
    description: uk4(
      'Усі типи волосся; донорське підбираємо під Ваше. Ціна — за роботу, волосся окремо.',
    ),
    services: [
      s('ext-100', uk4('Нарощування 100 г'), '1100', '4 год', {
        top: '1200',
        notes: [firstVisit('990 zł'), fourHands('+200 zł'), correction],
        topNotes: [firstVisit('1 100 zł'), fourHands('+200 zł'), correction],
      }),
      s('thick-50', uk4('Загущення 50 г'), '550', '2 год', {
        notes: [correction],
      }),
      s('thick-100-junior', uk4('Загущення 100 г'), '999', '6 год', {
        level: 'base',
        notes: [firstVisit('890 zł'), fourHands('+100 zł'), correction],
      }),
      s('ext-50-junior', uk4('Нарощування 50 г'), '500', '3 год', {
        level: 'base',
        notes: [correction],
      }),
      s(
        'removal',
        uk4('Зняття нарощеного волосся з миттям'),
        '250+',
        '2 год 30 хв',
      ),
    ],
  },
  {
    id: 'one-tone',
    tab: 'one-tone',
    name: uk4('Фарбування, однотон (не блонд)'),
    services: [
      s('roots', roots, '350/400/450/500', '2 год 30 хв', {
        top: '400/450/500/550',
      }),
      s('color-style', oneStyle, '400/450/500/550', '2 год 30 хв', {
        top: '450/550/650/750',
      }),
      s('color-cut', oneCut, '450/500/550/600', '2 год 30 хв', {
        top: '500+/550/600/650',
      }),
      s('color-cut-junior', oneCut, '400/450/500/550', '3 год 30 хв', {
        level: 'base',
      }),
      s('toning', toning, '400+/450/500/550', '2 год 30 хв', {
        top: '450/500/550/600',
      }),
      s('toning-junior', toning, '350/400/450/500', '3 год 30 хв', {
        level: 'base',
      }),
    ],
  },
  {
    id: 'complex',
    tab: 'complex',
    name: uk4('Блонд і складні техніки'),
    services: [
      s(
        'roots-blond',
        uk4('Відростки блонд + тонування'),
        '500/600/700/800',
        '4 год 30 хв',
        { top: '600/700/800/900' },
      ),
      s(
        'roots-blond-cut',
        uk4('Відростки блонд + тонування + стрижка'),
        '550/650/750/850',
        '4 год 30 хв',
        { top: '650/750/850/950' },
      ),
      s(
        'balayage-style',
        uk4('Balayage / Sombre + укладка'),
        '650/750/850/950',
        '4 год 30 хв',
        { top: '750/850/950/1050', topNotes: [density] },
      ),
      s(
        'balayage-cut',
        uk4('Balayage / Sombre + стрижка'),
        '650/750/850/950',
        '5 год 30 хв',
        {
          top: '700+/800/900/1000',
          topDuration: '4 год 30 хв',
          topNotes: [density],
        },
      ),
      s('airtouch', uk4('AirTouch'), null, '5–7 год', {
        hidePrice: true,
        topDuration: 'від 6 год',
      }),
      s(
        'relief',
        uk4('Рельєфне фарбування'),
        '650/750/850/950',
        '5 год 30 хв',
        {
          top: '700+/800/900/1000',
          topDuration: '4 год 30 хв',
          topNotes: [density],
        },
      ),
      s(
        'relief-cut',
        uk4('Рельєфне фарбування + стрижка'),
        '700/800/900/1000',
        '5 год 30 хв',
        { top: '750/850/950/1050', topDuration: '4 год 30 хв' },
      ),
      s('stretch', uk4('Розтяжка кольору'), '550/650/750/850', '4 год 30 хв', {
        top: '650/750/850/950',
        topDuration: '3 год 30 хв',
      }),
      s('contour', uk4('Контурування волосся'), '300+', '3 год'),
    ],
  },
  {
    id: 'blond',
    tab: 'blond',
    name: uk4('Декольоризація і вихід з чорного'),
    services: [
      s('decolor', uk4('Декольоризація'), '500/750/1000/1300', '5 год 30 хв', {
        top: '600+/850/1100/1400',
        topDuration: '5 год',
        topNotes: [density],
      }),
      s(
        'black',
        uk4('Вихід з чорного кольору'),
        '900/1100/1250/1400',
        '8–8 год 30 хв',
        {
          top: '1000+/1200/1350/1500',
          topDuration: '8 год',
          topNotes: [density],
        },
      ),
    ],
  },
  {
    id: 'repair',
    tab: 'repair',
    name: uk4('Реконструкція волосся'),
    services: [
      s('keratin', uk4('Кератинове випрямлення'), '400+/500/600/700', '4 год', {
        notes: [density],
      }),
      s('botox', uk4('Ботокс для волосся'), '400/500/600/700', '4 год', {
        notes: [density],
      }),
      s(
        'total',
        uk4(
          'Тотальна реконструкція (кератин або ботокс + холодна регенерація)',
        ),
        '500/600/700/800',
        '5 год',
      ),
      s(
        'acqua',
        uk4('Терапія з ефектом вирівнювання Acqua COCO'),
        '450/550/650/750',
        '4 год',
      ),
      // Dana 16.11 «И химия от 400» (was 350, Booksy 20.10). Production shows the /admin/prices value.
      s('perm-men', uk4('Чоловіча тривала завивка'), '400', '4 год'),
    ],
  },
  {
    id: 'care',
    tab: 'care',
    name: uk4('Догляд за волоссям'),
    services: [
      s('lebel', uk4('«Щастя для волосся»'), '250/300/350/400', '2 год'),
      s('peeling', uk4('Пілінг шкіри голови'), '150/200/250/300', '1 год'),
      s('cold', uk4('Холодна регенерація'), '250/300/350/400', '2 год'),
      s('brae', uk4('Ампула BRAE'), '200+/250/300/350', '1 год 30 хв'),
      s('red', uk4('RED THERAPY'), '250/300/350/400', '2 год 30 хв'),
    ],
  },
  {
    id: 'brows',
    tab: 'brows',
    name: uk4('Брови та вії'),
    services: [
      s('brow-reg', uk4('Корекція брів'), '50', '30 хв'),
      s('brow-dye', uk4('Фарбування брів'), '60', '30 хв'),
      s('brow-reg-dye', uk4('Корекція + фарбування брів'), '100', '1 год'),
      s(
        'brow-lash-dye',
        uk4('Корекція + фарбування брів + фарбування вій'),
        '110',
        '1 год',
      ),
      s('brow-lam', uk4('Ламінування брів + корекція'), '145', '1 год 30 хв'),
      s(
        'brow-lam-dye',
        uk4('Ламінування брів + корекція + фарбування'),
        '160',
        '1 год 30 хв',
      ),
      s('lash-dye', uk4('Фарбування вій'), '40', '30 хв'),
      s('lash-lam', uk4('Ламінування вій + фарбування'), '180', '1 год 30 хв'),
      s(
        'lash-lam-brow',
        uk4('Ламінування вій + фарбування брів'),
        '250',
        '1 год 30 хв',
      ),
      s(
        'brow-lash-lam',
        uk4('Ламінування брів і вій (+ ботокс)'),
        '290',
        '1 год 30 хв',
      ),
      s('botox-brow', uk4('Ботокс брів / вій'), '20', '15 хв'),
      s('lash-remove', uk4('Зняття вій без нового нарощування'), '50', '30 хв'),
      s('moustache', uk4('Видалення вусиків'), '40', '30 хв'),
    ],
  },
];

export const salonCopy = {
  /** HeroSalon → Header31. «Розрахувати вартість» hidden with the Calculator (Q-27). */
  hero: {
    eyebrow: uk4('Салон краси · Варшава'),
    heading: uk4('Преміальний догляд та нарощування волосся'),
    /** `.dec_scribble` word of the H1 (8.0 §5). 9_Text.md names no word — the service the salon is known for. */
    scribble: uk4('нарощування'),
    body: uk4(
      'Складні фарбування, вихід з чорного і нарощування під структуру Вашого волосся. Усі майстрині навчені Оленою Демченко і працюють за одним стандартом.',
    ),
    /** Oksana's copy 26.10: two buttons — book first, then the price list. */
    ctaBook: uk4('Записатися на візит'),
    cta: uk4('Дивитися послуги'),
    /** 16.11 (Dana «меняем все фотографии, которые сделал фотограф»): the phone photo → the same subject
     * from the shoot (BT9A4225, a blow-dry with a round brush). */
    image: {
      src: 'Salon_Space/Styling_Work_01.webp',
      alt: {
        uk: 'Майстриня вкладає волосся клієнтки феном і брашингом',
        pl: 'Stylistka modeluje włosy klientki suszarką i szczotką',
        en: "A stylist blow-drying a client's hair with a round brush",
      },
    } satisfies Pic,
  },
  /** ServiceCatalog `#services` → Pricing19. */
  pricing: {
    heading: uk4('Послуги Studio Demo'),
    sub: uk4(
      'Індивідуальний підхід до кожного запиту. Оберіть свій напрямок догляду — від невагомого нарощування до складного відновлення та колористики.',
    ),
    body: uk4(
      'Studio Demo — простір сервісу та експертного догляду у Варшаві. Наша мета — підкреслити Вашу природну красу та зберегти структуру кожного пасма. У студії на Вас чекають послуги для волосся, брів і вій.',
    ),
    noteLength: uk4(
      'Ціна — за довжиною волосся (1–4) і рівнем майстрині: TOP mistrz, майстер, Base',
    ),
    noteDensity: uk4('+20 % до суми — за густе волосся'),
  },
  /** Portfolio `#portfolio` → Gallery27 editorial bento (FR-05; owner 29.10). */
  portfolio: {
    heading: uk4('Результати до і після: досконалість у кожній деталі'),
    sub: uk4('Складні фарбування й нарощування наших майстринь — до і після'),
    cta: uk4('Записатися в салон'),
    /** The accent panel woven into the grid — facts only (E-08: 20+ років). */
    accentKicker: uk4('Наші роботи'),
    accentStat: uk4('20+ років'),
    accentBody: uk4(
      'Практики засновниці Олени Демченко — у кожній роботі майстринь салону.',
    ),
  },
  /** Testimonials → Testimonial9 on `/salon` (cards: `reviews`). */
  reviews: {
    heading: uk4('Щирі відгуки наших клієнток у Варшаві'),
    sub: uk4(
      "Справжні враження жінок, які довірили нам красу та здоров'я свого волосся",
    ),
    /** Oksana's copy 26.10 §5 — its own button, not the portfolio's. */
    cta: uk4('Стати клієнткою'),
  },
  /** Location `#location` → Contact7 + BookingChannels. */
  location: {
    heading: uk4('Чекаємо на Вас у Studio Demo'),
    sub: uk4('Завітайте до нашого простору краси у Варшаві'),
  },
};

export type PortfolioGroup = 'narosh' | 'farb' | 'dohliad';

export type PortfolioItem = {
  src: string;
  /** Caption = tag from the post captions (9_Text.md → Portfolio); also the alt text. */
  alt: Localized;
  kind: 'before' | 'after' | 'work';
  group: PortfolioGroup;
  /** No post tag («Робота салону») — the tile shows no visible caption; the alt stays. */
  untitled?: boolean;
  /** A large 2 × 2 tile of the bento wall (a face, the DEMO sign). */
  feature?: boolean;
};

export const portfolioFilters: {
  id: PortfolioGroup | 'all' | 'ba';
  label: Localized;
}[] = [
  { id: 'all', label: uk4('Усі') },
  { id: 'narosh', label: uk4('Нарощування') },
  { id: 'farb', label: uk4('Фарбування') },
  { id: 'dohliad', label: uk4('Догляд') },
  { id: 'ba', label: uk4('До / після') },
];

const work = (
  src: string,
  alt: Localized,
  group: PortfolioGroup,
): PortfolioItem => ({
  src,
  alt,
  kind: 'work',
  group,
  untitled: alt === salonWork,
});

const salonWork = uk4('Робота салону');

/**
 * Gallery of works (owner 28.10 «суть у фото»; 29.10 «не прибрати галерею, а взяти якісні фото»;
 * Dana 28.10 «нужно красивые кадры»). 24 photos: the salon's best finished looks, incl. 8 new frames
 * from the salon Instagram (docs/1_Intake/1_Site_Assets/Instagram/Studio_Demo — Farb_20…25,
 * Narosh_12, Dohliad_07; captions from those posts). Two `feature` tiles (2 × 2), then the captioned
 * works, the before / after pair last. Left out (weak frames: foil in progress, wash basin, outdoor,
 * crimped, product shots): Process_*, Dohliad_04…06, Narosh_05, Narosh_07, Farb_02/04/06/11–14/16/17.
 * 22 normal tiles + 2 features + the accent panel fill the grid without a hole at 2, 3 and 4 columns.
 */
const feature = (it: PortfolioItem): PortfolioItem => ({
  ...it,
  feature: true,
});

export const portfolio: PortfolioItem[] = [
  // Daryna 22.11 (via Oksana 23.11): 18 salon works, newest first — the first ten are home «Наші роботи».
  feature(work('Salon_Works/Farb_26.webp', salonWork, 'farb')),
  work('Salon_Works/Dohliad_08.webp', salonWork, 'dohliad'),
  work('Salon_Works/Narosh_13.webp', salonWork, 'narosh'),
  work('Salon_Works/Farb_27.webp', salonWork, 'farb'),
  work('Salon_Works/Farb_28.webp', salonWork, 'farb'),
  work('Salon_Works/Narosh_14.webp', salonWork, 'narosh'),
  work('Salon_Works/Farb_29.webp', salonWork, 'farb'),
  work('Salon_Works/Dohliad_09.webp', salonWork, 'dohliad'),
  work('Salon_Works/Farb_30.webp', salonWork, 'farb'),
  work('Salon_Works/Dohliad_10.webp', salonWork, 'dohliad'),
  work('Salon_Works/Narosh_15.webp', salonWork, 'narosh'),
  work('Salon_Works/Farb_31.webp', salonWork, 'farb'),
  work('Salon_Works/Farb_32.webp', salonWork, 'farb'),
  work('Salon_Works/Farb_33.webp', salonWork, 'farb'),
  work('Salon_Works/Narosh_16.webp', salonWork, 'narosh'),
  work('Salon_Works/Dohliad_11.webp', salonWork, 'dohliad'),
  work('Salon_Works/Dohliad_12.webp', salonWork, 'dohliad'),
  work(
    'Salon_Works/Dohliad_13.webp',
    uk4('Догляд Bond Angel у салоні'),
    'dohliad',
  ),
  work('Salon_Works/Farb_20.webp', uk4('Фарбування пасм'), 'farb'),
  work('Salon_Works/Farb_15.webp', salonWork, 'farb'),
  work('Salon_Works/Narosh_08.webp', salonWork, 'narosh'),
  work('Salon_Works/Farb_19.webp', salonWork, 'farb'),
  work(
    'Salon_Works/Narosh_12.webp',
    uk4('Довгий блонд: фарбування + нарощування'),
    'narosh',
  ),
  work('Salon_Works/Farb_22.webp', salonWork, 'farb'),
  work('Salon_Works/Farb_18.webp', salonWork, 'farb'),
  work(
    'Salon_Works/Farb_25.webp',
    uk4("М'який блонд від натуральної бази"),
    'farb',
  ),
  work('Salon_Works/Farb_07.webp', salonWork, 'farb'),
  work(
    'Salon_Works/Farb_21.webp',
    uk4('Блонд: комбінована техніка пасм'),
    'farb',
  ),
  work('Salon_Works/Farb_01.webp', uk4('Корекція кольору'), 'farb'),
  feature(work('Salon_Works/Narosh_06.webp', salonWork, 'narosh')),
  work(
    'Salon_Works/Narosh_04.webp',
    uk4('Тонування + нарощування, 110 г'),
    'narosh',
  ),
  work(
    'Salon_Works/Farb_23.webp',
    uk4('AirTouch: ефект вигорілого волосся'),
    'farb',
  ),
  work(
    'Salon_Works/Dohliad_07.webp',
    uk4('Кератин + фарбування Kydra'),
    'dohliad',
  ),
  work('Salon_Works/Narosh_03.webp', uk4('Загущення: 90 г волосся'), 'narosh'),
  work(
    'Salon_Works/Farb_24.webp',
    uk4('Фарбування Kydra: глибина і глянець'),
    'farb',
  ),
  work('Salon_Works/Farb_03.webp', uk4('AirTouch на блонді'), 'farb'),
  work('Salon_Works/Dohliad_03.webp', salonWork, 'dohliad'),
  work(
    'Salon_Works/Dohliad_01.webp',
    uk4('Кератин: 5 місяців після процедури'),
    'dohliad',
  ),
  work('Salon_Works/Farb_08.webp', salonWork, 'farb'),
  work('Salon_Works/Dohliad_02.webp', salonWork, 'dohliad'),
  {
    src: 'Salon_Works/Narosh_01_Before.webp',
    alt: uk4('Нарощування мікрокапсулами — до'),
    kind: 'before',
    group: 'narosh',
  },
  {
    src: 'Salon_Works/Narosh_01_After.webp',
    alt: uk4('Нарощування мікрокапсулами — після'),
    kind: 'after',
    group: 'narosh',
  },
];

/** `.dec_tape` words on /salon (8.0 §5: «групи послуг») — the group names, repeated from the price list. */
export const salonTapeWords: Localized[] = serviceGroups.map((g) => g.name);

/**
 * «Як проходить візит» on /salon (owner 08.11.2026, album «робочий процес» of the shoot 03.11): five
 * frames of one working day in order — palette, foils, wash, styling, result. Between the works and the
 * reviews: the client has seen the results, here she sees what happens in the chair.
 */
export type VisitStep = { title: Localized; body: Localized; pic: Pic };

export const visitStepsCopy = {
  heading: uk4('Як проходить візит'),
  sub: uk4(
    'Кадри з робочого дня студії: від підбору відтінку до готової укладки',
  ),
  steps: [
    {
      title: uk4('Консультація'),
      body: uk4('Підбираємо відтінок за палітрою разом з Вами'),
      pic: {
        src: 'Salon_Space/Visit_06.webp',
        alt: uk4('Підбір відтінку за палітрою фарб'),
      },
    },
    {
      title: uk4('Фарбування'),
      body: uk4('Пасмо за пасмом у фользі — складні техніки'),
      pic: {
        src: 'Salon_Space/Visit_07.webp',
        alt: uk4('Пасма у фользі під час фарбування'),
      },
    },
    {
      title: uk4('Миття й догляд'),
      body: uk4('Змиваємо фарбу і доглядаємо за волоссям'),
      pic: {
        src: 'Salon_Space/Visit_03.webp',
        alt: uk4('Ніка миє волосся клієнтці біля мийки'),
      },
    },
    {
      title: uk4('Укладка'),
      body: uk4('Сушимо й вкладаємо брашингом'),
      pic: {
        src: 'Salon_Space/Visit_04.webp',
        alt: uk4('Олена вкладає волосся феном і брашингом'),
      },
    },
    {
      title: uk4('Результат'),
      body: uk4('Перевіряємо форму й колір перед дзеркалом'),
      pic: {
        src: 'Salon_Space/Visit_08.webp',
        alt: uk4('Олена з клієнткою після укладки'),
      },
    },
  ] as VisitStep[],
};

export type Review = {
  author: string;
  /** «Google · вихід із чорного» — source · service or stylist. */
  source: Localized;
  /** Verbatim, in the original language, the same in every locale. */
  text: string;
  lang: 'pl' | 'uk' | 'en';
};

const src = (uk: string, pl: string, en: string): Localized => ({ uk, pl, en });

/**
 * Testimonials cards (`/`, `/salon`), quoted in full in their own language, «Читати повністю» on long ones.
 * PUBLIC DEMO: the production reviews were replaced with fictional ones; names are invented.
 */
export const reviews: Review[] = [
  {
    author: 'Anna K.',
    source: src(
      'Google · вихід із чорного',
      'Google · wyjście z czerni',
      'Google · out of black',
    ),
    text: 'W ciągu jednej wizyty przeszłam z wieloletniego czarnego na ciepły brąz. Bez plam, a włosy są w świetnej kondycji. Polecam!',
    lang: 'pl',
  },
  {
    author: 'Oksana P.',
    source: src(
      'Демо-відгук · фарбування',
      'Opinia demo · koloryzacja',
      'Demo review · colouring',
    ),
    text: 'Дуже затишна атмосфера і уважні майстрині. Колір вийшов саме таким, як я хотіла, а волосся після процедури м’яке й блискуче. Повернуся знову!',
    lang: 'uk',
  },
  {
    author: 'Emma W.',
    source: src(
      'Демо-відгук · нарощування',
      'Opinia demo · przedłużanie',
      'Demo review · extensions',
    ),
    text: 'I came in for extensions and left with exactly the length and volume I asked for. The capsules are invisible and the whole visit was calm and professional. Highly recommended.',
    lang: 'en',
  },
  {
    author: 'Ewa M.',
    source: src(
      'Демо-відгук · догляд',
      'Opinia demo · pielęgnacja',
      'Demo review · hair care',
    ),
    text: 'Profesjonalna obsługa i bardzo przyjemne mycie z masażem. Włosy po regeneracji wyglądają zdrowo. Na pewno wrócę.',
    lang: 'pl',
  },
  {
    author: 'Tetiana S.',
    source: src(
      'Демо-відгук · блонд',
      'Opinia demo · blond',
      'Demo review · blonde',
    ),
    text: 'Найкращий блонд, який мені робили: рівний, без жовтизни і дуже природний. Майстриня все пояснила і врахувала мої побажання.',
    lang: 'uk',
  },
  {
    author: 'Laura B.',
    source: src(
      'Демо-відгук · стрижка',
      'Opinia demo · strzyżenie',
      'Demo review · haircut',
    ),
    text: 'Friendly team, a spotless studio and a haircut that still looks good weeks later. Booking was easy and they were right on time.',
    lang: 'en',
  },
];

/** Rating plaque of Testimonial9 (E-28 stars; Bk 5.0 · 187 opinii). Per-card stars hidden (Q-35).
 * 16.11 (Dana «5 ⭐ поставить вместо 5.0»; the check run's challenger found the plaque still on «5.0»): «5», like the stats tile. */
export const ratingCopy = {
  stars: '★★★★★ 5',
  count: uk4('180+ відгуків Booksy'),
  prev: uk4('Попередній відгук'),
  next: uk4('Наступний відгук'),
  goTo: uk4('Відгук'),
  more: uk4('Читати повністю'),
  less: uk4('Згорнути'),
};
