import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

import * as schema from '@/lib/db/schema';
import type { SeedDb } from '@/lib/db/seedContent';

import { seedDemo } from './seed';

/** Applies the app's real migrations (`drizzle/*.sql`, in order) to an empty database. */
async function migrate(client: PGlite) {
  const dir = join(process.cwd(), 'drizzle');
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    const text = readFileSync(join(dir, file), 'utf8');
    for (const stmt of text.split('--> statement-breakpoint')) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }
}

function makeDemoDb() {
  const pg = new PGlite();
  const ready = (async () => {
    await migrate(pg);
    await seedDemo(drizzle({ client: pg, schema }) as unknown as SeedDb);
    console.log(
      '[demo] embedded Postgres ready: migrations applied, demo data seeded',
    );
  })();
  ready.catch((e: unknown) =>
    console.error(
      '[demo] database setup failed:',
      e instanceof Error ? e.message : e,
    ),
  );

  // Every query waits until the schema and the seed are in place; the seed itself uses `pg` directly.
  const gated = new Proxy(pg, {
    get(target, prop) {
      if (prop === 'query' || prop === 'exec' || prop === 'transaction') {
        const fn = Reflect.get(target, prop) as (...a: unknown[]) => unknown;
        return async (...args: unknown[]) => {
          await ready;
          return fn.apply(target, args);
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return drizzle({ client: gated, schema });
}

type Holder = { __studioDemoDb?: ReturnType<typeof makeDemoDb> };

/**
 * DEMO_MODE without DATABASE_URL: one in-process Postgres (PGlite) per server process, created on
 * first use, built from the real migrations and seeded with fictional data. It lives in memory —
 * a restart brings back the original demo data. Kept on `globalThis` so dev hot reload reuses it.
 */
export function demoDb() {
  const g = globalThis as Holder;
  return (g.__studioDemoDb ??= makeDemoDb());
}
