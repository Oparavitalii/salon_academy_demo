// Programmatic Drizzle migrator for production. Run by fly.toml `[deploy] release_command`
// before the new machines start; a nonzero exit aborts the deploy and the old release keeps
// serving. Plain ESM so the runtime image needs no tsx and no drizzle-kit (a devDependency).
//
// Idempotent: applied migrations are tracked in "drizzle"."__drizzle_migrations" — the same
// schema and table `drizzle-kit migrate` (npm run db:migrate) uses, so migrations already
// applied by drizzle-kit are skipped, not re-run.
//
// Locally: node --env-file=.env.local scripts/db_migrate.mjs

import { fileURLToPath } from 'node:url';

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';

// Direct (unpooled) URL: DDL in a transaction wants a stable session, not PgBouncer.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const source = process.env.DATABASE_URL_UNPOOLED
  ? 'DATABASE_URL_UNPOOLED'
  : 'DATABASE_URL';

if (!url) {
  console.error(
    'db_migrate: neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set — nothing to migrate against.',
  );
  process.exit(1);
}

// Node 22 has a global WebSocket; set it explicitly so a missing `ws` package never matters.
if (typeof globalThis.WebSocket === 'function') {
  neonConfig.webSocketConstructor = globalThis.WebSocket;
}

// Relative to this file, not the cwd: /app/scripts → /app/drizzle in the image.
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

const pool = new Pool({ connectionString: url, max: 1 });
// A dropped idle socket must not crash the process before we report.
pool.on('error', (err) =>
  console.error('db_migrate: pool error:', err?.message ?? err),
);

const startedAt = Date.now();
try {
  console.log(`db_migrate: applying ${migrationsFolder} using ${source}`);
  await migrate(drizzle({ client: pool }), { migrationsFolder });
  console.log(`db_migrate: up to date (${Date.now() - startedAt} ms)`);
  await pool.end();
  process.exit(0);
} catch (err) {
  // Message only — never the error object, which may carry the connection string.
  // DrizzleQueryError hides the real reason (DNS, auth, SQL) in `cause`.
  const message = [err, err?.cause]
    .filter(Boolean)
    .map((e) => (e instanceof Error ? e.message : String(e)))
    .join(' — cause: ');
  console.error(`db_migrate: FAILED — ${message.replaceAll(url, '<masked>')}`);
  await pool.end().catch(() => {});
  process.exit(1);
}
