import { defineConfig } from 'drizzle-kit';

// Migrations use the direct (unpooled) Neon URL: `npm run db:migrate`.
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
  strict: true,
});
