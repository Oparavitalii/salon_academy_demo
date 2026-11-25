/**
 * GDPR art. 13(1)(a): layer 1 names WHO processes, not only which tools run.
 * Only the form verified in the VAT white list (16.10.2026): the person's name. The firm
 * name «STUDIO DEMO Olena Demchenko» is client-supplied and not yet checked in
 * CEIDG (policy §1 marker) — it must not appear in this visible layer until it is.
 * Contact = the studio phone (2.2_Brif_Full.md, 21.10.2026). The e-mail is still
 * unknown (Q-15): when it arrives, add it here and in policy §1 — never a marker
 * here, layer 1 is a visible element (Release floor F3).
 */
export const CONTROLLER = {
  name: 'Olena Demchenko',
  address: 'ul. Przykładowa 1 lok. U1, 00-001 Warszawa',
  contact: 'tel. +48 555 010 010',
};

/**
 * «Odrzuć»/«Akceptuj» parity: `docs/Shared_Materials/Ecom_Legal_PL.md` §5 (UODO guidance, March 2025).
 * Banner and modal strings, four site languages. PL and UK follow the policy
 * wording; RU and EN need a native check (B-19).
 * «Odrzuć wszystkie» and «Akceptuj wszystkie» are equal on purpose (UODO, March 2025).
 */
export const cookieCopy = {
  title: {
    pl: 'Pliki cookies',
    uk: 'Файли cookie',
    en: 'Cookies',
  },
  message: {
    pl: 'Pliki niezbędne (np. do logowania) nie wymagają zgody. Mapę Google (strony Kontakty i Salon), analitykę (mapy kliknięć i nagrania sesji, PostHog) oraz pomiar skuteczności reklam i remarketing (Google Ads, Meta Pixel) włączymy tylko za Twoją zgodą. Możesz ją w każdej chwili wycofać w „Ustawieniach cookies” w stopce.',
    uk: 'Необхідні файли (наприклад, для входу) не потребують згоди. Мапу Google (сторінки «Контакти» і «Салон»), аналітику (теплові карти кліків і записи сесій, PostHog) та вимірювання ефективності реклами й ремаркетинг (Google Ads, Meta Pixel) увімкнемо лише за Вашою згодою. Її можна будь-коли відкликати в «Налаштуваннях cookie» у футері.',
    en: 'Necessary files (for example, for sign-in) need no consent. The Google map (Contacts and Salon pages), analytics (click heatmaps and session recordings, PostHog) and ad measurement and remarketing (Google Ads, Meta Pixel) run only with your consent. You can withdraw it at any time in “Cookie settings” in the footer.',
  },
  controller: {
    pl: 'Administrator danych',
    uk: 'Адміністратор даних',
    en: 'Data controller',
  },
  privacyPolicy: {
    pl: 'Polityka prywatności',
    uk: 'Політика конфіденційності',
    en: 'Privacy policy',
  },
  settings: {
    pl: 'Ustawienia',
    uk: 'Налаштування',
    en: 'Settings',
  },
  rejectAll: {
    pl: 'Odrzuć wszystkie',
    uk: 'Відхилити всі',
    en: 'Reject all',
  },
  acceptAll: {
    pl: 'Akceptuj wszystkie',
    uk: 'Прийняти всі',
    en: 'Accept all',
  },
  settingsTitle: {
    pl: 'Ustawienia cookies',
    uk: 'Налаштування cookie',
    en: 'Cookie settings',
  },
  saveSettings: {
    pl: 'Zapisz wybór',
    uk: 'Зберегти вибір',
    en: 'Save choice',
  },
  withdraw: {
    pl: 'Wycofaj zgodę',
    uk: 'Відкликати згоду',
    en: 'Withdraw consent',
  },
  close: {
    pl: 'Zamknij',
    uk: 'Закрити',
    en: 'Close',
  },
  required: {
    pl: 'Zawsze aktywne',
    uk: 'Завжди активні',
    en: 'Always on',
  },
  showList: {
    pl: 'Pokaż listę plików',
    uk: 'Показати перелік файлів',
    en: 'Show the file list',
  },
  provider: {
    pl: 'Dostawca',
    uk: 'Постачальник',
    en: 'Provider',
  },
  duration: {
    pl: 'Przechowywanie',
    uk: 'Зберігання',
    en: 'Storage',
  },
  /** Footer link label — the same words as policy §8 and §10. */
  footerLink: {
    pl: 'Ustawienia cookies',
    uk: 'Налаштування cookie',
    en: 'Cookie settings',
  },
  categories: {
    necessary: {
      name: {
        pl: 'Niezbędne',
        uk: 'Необхідні',
        en: 'Necessary',
      },
      description: {
        pl: 'Logowanie i sesja, bezpieczeństwo, wybrany język, zapamiętanie wyboru w tym banerze. Bez nich Serwis nie działa, dlatego nie wymagają zgody.',
        uk: 'Вхід і сесія, безпека, обрана мова, запам’ятовування вибору в цьому банері. Без них Сайт не працює, тому згода не потрібна.',
        en: 'Sign-in and session, security, your chosen language, remembering your choice in this banner. The site does not work without them, so no consent is needed.',
      },
    },
    functional: {
      name: {
        pl: 'Funkcjonalne',
        uk: 'Функціональні',
        en: 'Functional',
      },
      description: {
        pl: 'Mapa Google na stronach Kontakty i Salon. Z tą zgodą mapa ładuje się od razu; bez niej — dopiero po kliknięciu «Pokaż mapę». Google otrzymuje adres IP i może zapisać własne pliki cookies.',
        uk: 'Мапа Google на сторінках «Контакти» і «Салон». З цією згодою мапа завантажується одразу; без неї — лише після натискання «Показати мапу». Google отримує IP-адресу і може записати власні файли cookie.',
        en: 'The Google map on the Contacts and Salon pages. With this consent the map loads straight away; without it, only after a click on “Show map”. Google receives the IP address and may set its own cookies.',
      },
    },
    analytics: {
      name: {
        pl: 'Analityczne',
        uk: 'Аналітичні',
        en: 'Analytics',
      },
      description: {
        pl: 'Mapy kliknięć i przewijania, nagrania sesji i wykrywanie błędów (PostHog Cloud EU) — po to, by ulepszać Serwis. Bez Twojej zgody narzędzie się nie uruchamia.',
        uk: 'Теплові карти кліків і прокручування, записи сесій і виявлення помилок (PostHog Cloud EU) — щоб вдосконалювати Сайт. Без Вашої згоди інструмент не запускається.',
        en: 'Click and scroll heatmaps, session recordings and error tracking (PostHog Cloud EU), used to improve the site. The tool does not start without your consent.',
      },
    },
    /** Name and description: 10.0_Legal.md step 8 and policy §10 «Kategorie» / «Категорії». */
    marketing: {
      name: {
        pl: 'Marketingowe',
        uk: 'Маркетингові',
        en: 'Marketing',
      },
      description: {
        pl: 'Pomiar skuteczności reklam i remarketing (Google Ads, Meta Pixel). Bez Twojej zgody znaczniki Google i Meta nie są ładowane, a Serwis nie łączy się z ich serwerami reklamowymi.',
        uk: 'Вимірювання ефективності реклами й ремаркетинг (Google Ads, Meta Pixel). Без Вашої згоди теги Google і Meta не завантажуються, і Сайт не з’єднується з їхніми рекламними серверами.',
        en: 'Ad measurement and remarketing (Google Ads, Meta Pixel). Without your consent the Google and Meta tags do not load, and the site does not connect to their ad servers.',
      },
    },
  },
};
