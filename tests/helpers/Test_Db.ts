import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';

import * as schema from '@/lib/db/schema';

/**
 * A fresh in-process Postgres with the app's real migrations (`drizzle/*.sql`, in order). Use it
 * through `vi.mock('@/lib/db/client', …)` so the code under test runs its real SQL.
 */
export async function makeTestDb() {
  const client = new PGlite();
  const dir = join(process.cwd(), 'drizzle');
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    const text = readFileSync(join(dir, file), 'utf8');
    for (const stmt of text.split('--> statement-breakpoint')) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }
  return drizzle({ client, schema });
}

export type TestDb = Awaited<ReturnType<typeof makeTestDb>>;

/** Empties every app table between tests (keeps the schema). */
export async function resetDb(db: TestDb) {
  await db.execute(sql`
    DO $$ DECLARE r record; BEGIN
      FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;`);
}
