/**
 * Plain-text e-mails, Ukrainian (project language; translations wait for Q-17). Service text,
 * not marketing copy: what happened and what to do next. `secret` marks bodies that must
 * never reach a log.
 */
type Built = {
  subject: string;
  text: string;
  secret: 'password' | 'link' | null;
};

const sign = '\n\n—\nStudio Demo · Академія';

export type TemplateVars = {
  welcome: { login: string; link: string; loginUrl: string; course: string };
  accessResent: { login: string; link: string; loginUrl: string };
  courseAdded: { course: string; loginUrl: string };
  intensivePaid: { course: string; amount: string };
  intensivePaidAdmin: { email: string; course: string; amount: string };
  suspiciousLogin: { when: string; country: string; previous: string };
  suspiciousLoginAdmin: {
    email: string;
    when: string;
    country: string;
    previous: string;
  };
  passwordReset: { link: string };
  roleConflictAdmin: { email: string; course: string; amount: string };
  disputeAdmin: { email: string; amount: string };
  certificate: { name: string; course: string; number: string };
};

export type TemplateName = keyof TemplateVars;

export const templates: {
  [K in TemplateName]: (v: TemplateVars[K]) => Built;
} = {
  welcome: (v) => ({
    subject: 'Доступ до курсу — Studio Demo',
    text:
      `Дякуємо за оплату курсу «${v.course}».\n\n` +
      `Логін: ${v.login}\n\n` +
      `Щоб увійти, встановіть свій пароль за посиланням (діє 72 години, один раз):\n${v.link}\n\n` +
      `Якщо посилання вже не діє, відкрийте ${v.loginUrl} і натисніть «Забули пароль?» — прийде нове.` +
      sign,
    secret: 'link',
  }),
  accessResent: (v) => ({
    subject: 'Доступ до кабінету — Studio Demo',
    text:
      `Студія надіслала Вам новий доступ до кабінету.\n\n` +
      `Логін: ${v.login}\n\n` +
      `Встановіть пароль за посиланням (діє 72 години, один раз):\n${v.link}\n\n` +
      `Якщо посилання вже не діє, відкрийте ${v.loginUrl} і натисніть «Забули пароль?» — прийде нове.` +
      sign,
    secret: 'link',
  }),
  courseAdded: (v) => ({
    subject: 'Курс додано до кабінету — Studio Demo',
    text:
      `Курс «${v.course}» додано до Вашого кабінету. Пароль той самий.\n\n` +
      `Увійти: ${v.loginUrl}` +
      sign,
    secret: null,
  }),
  intensivePaid: (v) => ({
    subject: 'Оплату інтенсиву отримано — Studio Demo',
    text:
      `Оплату «${v.course}» (${v.amount}) отримано.\n\n` +
      `Студія зв'яжеться з Вами щодо дати інтенсиву.` +
      sign,
    secret: null,
  }),
  intensivePaidAdmin: (v) => ({
    subject: 'Нова оплата інтенсиву',
    text:
      `Оплачено «${v.course}» (${v.amount}).\nE-mail учениці: ${v.email}\n\n` +
      `Зв'яжіться з нею щодо дати. Оплата — в адмінці, розділ «Оплати».`,
    secret: null,
  }),
  suspiciousLogin: (v) => ({
    subject: 'Вхід до кабінету з іншої країни',
    text:
      `${v.when} у Ваш кабінет увійшли з країни: ${v.country}. Попередній вхід — ${v.previous}.\n\n` +
      `Якщо це були не Ви, змініть пароль і напишіть нам. Доступом до курсу ділитися не можна — такий акаунт блокується.` +
      sign,
    secret: null,
  }),
  suspiciousLoginAdmin: (v) => ({
    subject: 'Підозрілий вхід учениці',
    text:
      `${v.email}: вхід з країни ${v.country} (${v.when}); попередній — ${v.previous}, менш ніж за 24 год.\n\n` +
      `Перегляньте розділ «Учениці» в адмінці; за потреби заблокуйте акаунт.`,
    secret: null,
  }),
  roleConflictAdmin: (v) => ({
    subject: 'Оплата з e-mail адміністратора',
    text:
      `Оплачено «${v.course}» (${v.amount}) з e-mail ${v.email}, який належить акаунту адміністратора.\n\n` +
      `Доступ не відкрито. Перевірте оплату в Stripe і за потреби поверніть кошти.`,
    secret: null,
  }),
  disputeAdmin: (v) => ({
    subject: 'Спір по оплаті (chargeback)',
    text:
      `Банк відкрив спір по оплаті ${v.amount} (${v.email}). Доступ до курсу знято автоматично.\n\n` +
      `Відповідь на спір — у панелі Stripe.`,
    secret: null,
  }),
  passwordReset: (v) => ({
    subject: 'Відновлення пароля — Studio Demo',
    text:
      `Щоб задати новий пароль, відкрийте посилання (діє 1 годину, один раз):\n${v.link}\n\n` +
      `Якщо Ви не просили відновлення, просто ігноруйте цей лист.` +
      sign,
    secret: 'link',
  }),
  certificate: (v) => ({
    subject: 'Ваш сертифікат — DEMO Beauty Academy',
    text:
      `${v.name}, вітаємо із завершенням курсу «${v.course}»!\n\n` +
      `Ваш сертифікат № ${v.number} — у вкладенні (PDF). Його можна роздрукувати на аркуші A4.` +
      sign,
    secret: null,
  }),
};
