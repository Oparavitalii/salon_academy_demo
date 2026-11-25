import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';

import { demoDb } from '@/lib/demo/db';
import { isDemoMode } from '@/lib/demo/mode';

import * as schema from './schema';

/** Public demo without a database URL → the embedded, seeded Postgres (`lib/demo/db.ts`). */
const useDemo = isDemoMode() && !process.env.DATABASE_URL;

/** True when a database is configured. Public pages fall back to static data otherwise. */
export const hasDb = Boolean(process.env.DATABASE_URL) || useDemo;

/**
 * Neon (serverless driver) everywhere the app runs in production. `DATABASE_DRIVER=pg` switches to
 * plain node-postgres — used by a local Postgres or a CI service container; production never sets it.
 */
const usePg = process.env.DATABASE_DRIVER === 'pg';

type AppDb = ReturnType<typeof drizzle<typeof schema>>;

export const db: AppDb = useDemo
  ? (demoDb() as unknown as AppDb)
  : usePg
    ? (drizzlePg({
        client: new PgPool({ connectionString: process.env.DATABASE_URL }),
        schema,
      }) as unknown as AppDb)
    : drizzle({
        client: new Pool({ connectionString: process.env.DATABASE_URL }),
        schema,
      });

export type Db = typeof db;
