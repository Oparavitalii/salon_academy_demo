#!/usr/bin/env node
// Legal-marker check (Phase 10 · T-12). Prints how many Phase-9 markers
// `[[BRAK: …]]` / `[[DO POTWIERDZENIA: …]]` each /<locale>/privacy page will render,
// so the count is visible before any deploy. WARN only — always exits 0.
// The Phase-9 rule «a page with a visible marker does not go to production» is the
// deploy gate's job (Phase 12), not this script's.
//
//   node scripts/check-legal-markers.mjs
//
// Also warns when content/legal/ drifts from docs/10_Legal/ (the copy is made at build prep).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LOCALE_FILE = {
  uk: 'Privacy_Policy_UK.md', // fallback until a translation exists (10.0_Legal.md → Handoff)
  pl: 'Privacy_Policy_PL.md',
  en: 'Privacy_Policy_UK.md', // fallback until a translation exists
};
const MARKER = /\[\[([A-Z ]+?):[\s\S]*?\]\]/g;

/** Same cut as components/Markdown splitDocument(): drop `# title` and the editorial blockquote. */
function body(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (lines[i]?.startsWith('# ')) i++;
  while (
    i < lines.length &&
    (lines[i].trim() === '' || lines[i].startsWith('>'))
  )
    i++;
  return lines.slice(i).join('\n');
}

function count(text) {
  const byKind = {};
  let total = 0;
  for (const m of text.matchAll(MARKER)) {
    byKind[m[1]] = (byKind[m[1]] ?? 0) + 1;
    total++;
  }
  return { total, byKind };
}

let warnings = 0;
const cache = {};
console.log('legal markers — rendered body of /<locale>/privacy');
for (const [locale, file] of Object.entries(LOCALE_FILE)) {
  const path = join(ROOT, 'content', 'legal', file);
  if (!existsSync(path)) {
    console.log(`  WARN ${locale}: ${file} missing in content/legal/`);
    warnings++;
    continue;
  }
  cache[file] ??= readFileSync(path, 'utf8');
  const { total, byKind } = count(body(cache[file]));
  const kinds = Object.entries(byKind)
    .map(([k, n]) => `${k} ${n}`)
    .join(' · ');
  console.log(
    `  ${total > 0 ? 'WARN' : 'ok  '} /${locale}/privacy ← ${file}: ${total} markers${kinds ? ` (${kinds})` : ''}`,
  );
  if (total > 0) warnings++;
}

for (const file of new Set(Object.values(LOCALE_FILE))) {
  const src = join(ROOT, 'docs', '10_Legal', file);
  const dst = join(ROOT, 'content', 'legal', file);
  if (
    existsSync(src) &&
    existsSync(dst) &&
    readFileSync(src, 'utf8') !== readFileSync(dst, 'utf8')
  ) {
    console.log(
      `  WARN content/legal/${file} differs from docs/10_Legal/${file} — re-copy before building`,
    );
    warnings++;
  }
}

console.log(
  warnings
    ? `legal markers: ${warnings} warning(s) — the policy is a draft; not for production until 0.`
    : 'legal markers: 0 — clean.',
);
process.exit(0);
