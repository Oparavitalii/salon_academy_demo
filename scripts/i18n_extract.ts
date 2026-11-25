// Collect every uk4() string the site renders → lib/i18n/dict/_source_uk.json (sorted, unique).
//   npx tsx scripts/i18n_extract.ts
// Translators fill lib/i18n/dict/<locale>.json with the same keys (Release floor F2).
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const seen = new Set<string>();
(globalThis as { __uk4Collect?: Set<string> }).__uk4Collect = seen;

const dir = join(process.cwd(), 'lib', 'content');
for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require(join(dir, f));
}
const list = [...seen].sort();
writeFileSync(
  join(process.cwd(), 'lib', 'i18n', 'dict', '_source_uk.json'),
  JSON.stringify(list, null, 2) + '\n',
);
console.log(`uk4 strings: ${list.length}`);
