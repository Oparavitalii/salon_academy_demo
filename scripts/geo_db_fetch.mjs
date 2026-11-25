// Downloads the free DB-IP «IP to City Lite» database (CC BY 4.0, no account) into
// data/geo/dbip-city-lite.mmdb. Runs in the Docker build (see Dockerfile) and locally
// (`node scripts/geo_db_fetch.mjs`). The login log then knows country + city offline:
// nothing is sent to a third party (lib/auth/geoDb.ts).
//
// Never fails the build: without the file the country simply stays unknown, as before.
// The file is git-ignored (~130 MB).

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  renameSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

const OUT = join(process.cwd(), 'data', 'geo', 'dbip-city-lite.mmdb');
const force = process.argv.includes('--force');

if (existsSync(OUT) && !force) {
  console.log(
    `[geo] ${OUT} exists (${statSync(OUT).size} bytes) — skip (--force to refresh)`,
  );
  process.exit(0);
}
mkdirSync(dirname(OUT), { recursive: true });

// DB-IP publishes one file per month; early in a month it may not be out yet.
const months = [0, 1, 2].map((back) => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - back);
  return d.toISOString().slice(0, 7);
});

for (const m of months) {
  const url = `https://download.db-ip.com/free/dbip-city-lite-${m}.mmdb.gz`;
  try {
    const res = await fetch(url);
    if (!res.ok || !res.body) {
      console.log(`[geo] ${m}: HTTP ${res.status}`);
      continue;
    }
    const tmp = `${OUT}.part`;
    await pipeline(
      Readable.fromWeb(res.body),
      createGunzip(),
      createWriteStream(tmp),
    );
    renameSync(tmp, OUT);
    console.log(`[geo] ${m}: saved ${statSync(OUT).size} bytes → ${OUT}`);
    process.exit(0);
  } catch (e) {
    console.log(`[geo] ${m}: ${e instanceof Error ? e.message : e}`);
  }
}
console.warn(
  '[geo] WARNING: no database downloaded — login country/city stay unknown',
);
