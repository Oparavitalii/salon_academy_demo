import type { Locale, Localized } from '@/i18n/routing';
import { uk4 } from '@/lib/i18n/t';

import type { Pic } from './home';

/**
 * SuccessStories — graduates' stories: photo · name · before the course · now · quote. The quote stays in its
 * own language; the other locales get a translation, with the original behind «Оригінал».
 * PUBLIC DEMO: the production stories were replaced with fictional ones; names are invented.
 */
export type Story = {
  name: string;
  /** Where she is from, when she said it. */
  city?: Localized;
  course: Localized;
  /** «До курсу» / «Зараз» — only what the student told us; left out rather than invented. */
  before?: Localized;
  now?: Localized;
  quote: string;
  /** The whole story, paragraph by paragraph (emoji removed) — behind «Читати повністю» (owner 28.10). */
  full: string[];
  lang: 'uk' | 'pl' | 'en';
  photo: Pic;
  /**
   * Translation for the other locales (E-47 rule: «переклад з …», the original behind «Оригінал»).
   * A locale without one shows the original, as before.
   */
  translation?: Partial<Record<Locale, { quote: string; full: string[] }>>;
};

export const storiesCopy = {
  heading: uk4('Результати та досягнення наших випускниць'),
  sub: uk4(
    'Від першого відпрацювання на моделі до власного доходу та запису клієнтів по всій Європі',
  ),
  beforeLabel: uk4('До курсу'),
  nowLabel: uk4('Зараз'),
  ctaHome: uk4('Стати майстром'),
  ctaCourses: uk4('Обрати свій курс'),
  more: uk4('Читати повністю'),
  less: uk4('Згорнути'),
  original: {
    uk: 'Оригінал',
    pl: 'Oryginał',
    en: 'Original',
  } as Localized,
  translatedFrom: {
    en: {
      uk: 'Переклад з англійської',
      pl: 'Tłumaczenie z angielskiego',
      en: 'Translated from English',
    },
    uk: {
      uk: 'Переклад з української',
      pl: 'Tłumaczenie z ukraińskiego',
      en: 'Translated from Ukrainian',
    },
  } as Partial<Record<Story['lang'], Localized>>,
};

const intensive = uk4('Офлайн-інтенсив з нарощування');
const extensions = uk4('Курс з нарощування');

export const stories: Story[] = [
  {
    name: 'Zlata P.',
    course: intensive,
    before: uk4('Працює у сфері фінансів, з волоссям справи не мала'),
    now: uk4('Закупила матеріали й інструменти і вже має першу клієнтку'),
    quote:
      'Я прийшла на навчання абсолютно з нуля. […] Матеріал пояснювали простою мовою, а тепер у мене вже є перша клієнтка!',
    full: [
      'Я прийшла на дводенний інтенсив абсолютно з нуля: до цього я ніколи не працювала з волоссям.',
      'Матеріал пояснювали простою мовою, було багато практики на моделях, а викладачка була вимогливою — і зараз я розумію, що це великий плюс.',
      'Після курсу мені допомогли обрати матеріали та інструменти. А тепер найприємніше — я вже знайшла свою першу клієнтку!',
    ],
    lang: 'uk',
    photo: {
      src: 'Academy/Story_Graduate_01.webp',
      alt: uk4('Випускниці інтенсиву з сертифікатами'),
    },
    translation: {
      pl: {
        quote:
          'Przyszłam na szkolenie zupełnie od zera. […] Materiał tłumaczono prostym językiem, a teraz mam już pierwszą klientkę!',
        full: [
          'Przyszłam na dwudniowy intensyw zupełnie od zera: nigdy wcześniej nie pracowałam z włosami.',
          'Materiał tłumaczono prostym językiem, było dużo praktyki na modelkach, a prowadząca była wymagająca — dziś wiem, że to duży plus.',
          'Po kursie pomogono mi wybrać materiały i narzędzia. A teraz najprzyjemniejsze — mam już pierwszą klientkę!',
        ],
      },
      en: {
        quote:
          'I came to the course completely from scratch. […] Everything was explained in plain words, and now I already have my first client!',
        full: [
          'I came to the two-day intensive completely from scratch: I had never worked with hair before.',
          'Everything was explained in plain words, there was plenty of practice on models, and the teacher was demanding — which I now see as a big plus.',
          'After the course they helped me choose materials and tools. And the best part — I have already found my first client!',
        ],
      },
    },
  },
  {
    name: 'Myroslava',
    course: extensions,
    before: uk4('Майстриня манікюру'),
    now: uk4('Працює з клієнтками як майстриня нарощування'),
    quote:
      'Курс дуже сподобався: усе доступно пояснювали, було багато практики, а підтримка не закінчилася після навчання.',
    full: [
      'До навчання я займалася манікюром, але вирішила спробувати себе в нарощуванні волосся.',
      'Курс дуже сподобався: усе доступно пояснювали, було багато практики, а головне — підтримка не закінчилася після навчання.',
      'Зараз я вже працюю з клієнтками і дуже рада, що наважилася на цей крок.',
    ],
    lang: 'uk',
    photo: {
      src: 'Academy/Practice_Capsule_05.webp',
      alt: {
        uk: 'Постановка капсули з термозахистом на манекені',
        pl: 'Zakładanie kapsułki z osłoną termiczną na manekinie',
        en: 'Placing a capsule with a heat shield on a mannequin',
      },
    },
    translation: {
      pl: {
        quote:
          'Kurs bardzo mi się podobał: wszystko jasno tłumaczono, było dużo praktyki, a wsparcie nie skończyło się po szkoleniu.',
        full: [
          'Przed szkoleniem robiłam manicure, ale postanowiłam spróbować sił w przedłużaniu włosów.',
          'Kurs bardzo mi się podobał: wszystko jasno tłumaczono, było dużo praktyki, a co najważniejsze — wsparcie nie skończyło się po szkoleniu.',
          'Dziś pracuję już z klientkami i bardzo się cieszę, że zdecydowałam się na ten krok.',
        ],
      },
      en: {
        quote:
          'I really liked the course: everything was explained clearly, there was lots of practice, and the support did not end with the course.',
        full: [
          'Before the course I did manicures, but I decided to try hair extensions.',
          'I really liked the course: everything was explained clearly, there was lots of practice, and most importantly the support did not end with the course.',
          'Now I already work with clients, and I am very glad I took this step.',
        ],
      },
    },
  },
  {
    name: 'Emily R.',
    city: { uk: 'Гданськ', pl: 'Gdańsk', en: 'Gdańsk' },
    course: intensive,
    quote:
      'Two days flew by. […] The teachers explain everything so well that you start to see yourself through different eyes.',
    full: [
      'Two days flew by. I am so glad I chose this studio: lots of hands-on practice, honest feedback and a very warm team.',
      'The teachers explain everything so well that you start to see yourself through different eyes. Thank you!',
    ],
    lang: 'en',
    photo: {
      src: 'Academy/Practice_Dry_03.webp',
      alt: {
        uk: 'Укладка феном і брашингом на моделі під час офлайн-інтенсиву',
        pl: 'Modelowanie suszarką i szczotką na modelce podczas kursu stacjonarnego',
        en: "Blow-drying a model's hair with a round brush during the in-person intensive",
      },
    },
  },
];
