-- 16.11.2026 · B-116 · data only, no schema change. On prod it runs from fly.toml `release_command`
-- (scripts/db_migrate.mjs) on the next deploy; both statements are no-ops where the data is already right.
--
-- 1) «Особисте наставництво | VIP-навчання» (Dana 16.11 12:59): the catalog and the first-screen tiles list only
--    courses that are «available» in the DB. The same row `npm run db:sync-catalog -- --apply` inserts
--    (slug, kind, title, status, position = its index in lib/content/courses.ts `catalog`).
INSERT INTO "courses" ("slug", "kind", "title", "status", "position")
VALUES (
  'personal-mentoring',
  'offline',
  '{"uk":"Особисте наставництво | VIP-навчання","pl":"Mentoring indywidualny | Szkolenie VIP","en":"Personal mentoring | VIP training"}'::jsonb,
  'available',
  4
)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
-- 2) «Чоловіча тривала завивка» 350 → 400 zł (Dana 16.11 12:31 «И химия от 400»). Only while the row still holds
--    the old 350, so a later edit in /admin/prices is never overwritten.
UPDATE "services"
SET "master_price" = replace("master_price", '350', '400'), "updated_at" = now()
WHERE "id" = 'perm-men' AND "master_price" ~ '^\D*350\D*$';
