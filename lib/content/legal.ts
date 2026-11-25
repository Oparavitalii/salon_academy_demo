import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Locale } from '@/i18n/routing';
import { uk4 } from '@/lib/i18n/t';

/**
 * `/privacy` → Content17 — wrapper copy from 9_Text.md, document text from Phase 9.
 * The two policy files are copied from `docs/10_Legal/` into `content/legal/` at build prep,
 * so the app never reads the docs folder. Read with `fs` at build time (SSG only).
 * Locale → file (10.0_Legal.md → Handoff): pl → PL (binding text); uk → UK; ru, en → no body
 * (links to /pl and /uk, Decisions 22.10).
 */

export const privacyCopy = {
  eyebrow: uk4('Документи'),
  heading: uk4('Політика конфіденційності'),
  lede: uk4(
    'Як Studio Demo обробляє персональні дані на сайті: що збираємо, навіщо, кому передаємо і які у Вас права.',
  ),
  toc: uk4('Зміст'),
  // /ru and /en: no legal translation yet (B-75) — explanation + links instead of the UK text
  // (Release floor F2; Decisions 22.10 «/ru/privacy і /en/privacy не показують український текст»).
  inForce: uk4(
    "Політика конфіденційності діє польською мовою — це обов'язкова редакція. Вона також доступна українською.",
  ),
  readPl: uk4('Читати польською'),
  readUk: uk4('Читати українською'),
};

/** Locales that render the full policy text; the others show `privacyCopy.inForce` + links. */
export const POLICY_LOCALES: readonly Locale[] = ['uk', 'pl'];

export type PolicySource = {
  file: string;
  /** Language of the document text — `lang` on the article when it differs from the route. */
  lang: 'uk' | 'pl';
  markdown: string;
};

const FILES: Record<'uk' | 'pl', string> = {
  uk: 'Privacy_Policy_UK.md',
  pl: 'Privacy_Policy_PL.md',
};

export function loadPolicy(locale: Locale): PolicySource {
  const lang = locale === 'pl' ? 'pl' : 'uk';
  const file = FILES[lang];
  const markdown = readFileSync(
    join(process.cwd(), 'content', 'legal', file),
    'utf8',
  );
  return { file, lang, markdown };
}
