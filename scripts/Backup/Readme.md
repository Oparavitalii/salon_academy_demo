# Database backups

Nightly encrypted backups of the production Neon database to Cloudflare R2, plus a manual restore drill.

- `.github/workflows/Db_Backup.yml` runs daily at 02:00 UTC, and can also be started by hand. It does `pg_dump` (Postgres 18) → `gzip -9` → AES-256-GCM, checks the result, uploads it to R2 under `backups/`, and deletes objects older than 30 days.
- `.github/workflows/Restore_Drill.yml` runs only when started by hand. It takes the latest (or a named) object, decrypts it and restores it into a throwaway Neon branch named `drill-<run>`. Then it compares row counts per table and always deletes the branch.
- `Backup_Crypto.mjs` handles `encrypt` / `decrypt`. It uses only Node builtins, with no npm install. The file layout is `IV(12) | AuthTag(16) | ciphertext`.
- `Verify_Restore.mjs` checks the restore by comparing row counts in the dump with row counts in the database. It needs `psql`.

Why: Neon's own history (PITR) on the Free plan covers only **6 hours** (`history_retention_seconds = 21600`, read 20.10.2026).

Until all four `R2_*` secrets are set, the nightly run ends **green with a "Backup skipped" notice** (board item B-57). If only some of them are set, the run fails, because that points to a setup mistake.

## GitHub secrets to set

Set them under Settings → Secrets and variables → Actions.

- `DATABASE_URL_UNPOOLED`: the production **direct** connection string, without `-pooler` in the host. The workflow rejects a pooler URL.
- `BACKUP_ENCRYPTION_KEY`: 64 hex characters (see below).
- `R2_ENDPOINT`: `https://<account_id>.r2.cloudflarestorage.com`
- `R2_ACCESS_KEY`: the Access Key ID of an R2 API token.
- `R2_SECRET_KEY`: the Secret Access Key of that token.
- `R2_BUCKET`: the bucket name. Use a separate bucket from the photo storage, e.g. `demo-beauty-backups`.
- `NEON_API_KEY`: needed only for the drill. It must be allowed to create and delete branches.
- `NEON_PROJECT_ID`: needed only for the drill. Its value is `shy-forest-67683156`. A repo **variable** is preferred, but a secret also works.

Give the R2 token **Object Read & Write on the backup bucket only**. Note: these names differ from the app's `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` on purpose. The backup token should be a separate, narrower token.

## Generate the encryption key

```bash
openssl rand -hex 32
# or: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Store the key in **two places**: the GitHub secret, and the owner's password manager. If the key is lost, every backup is lost with it. GitHub never shows a secret again after it is saved.

## Run a backup / the drill

```bash
gh workflow run Db_Backup.yml --ref main
gh workflow run Restore_Drill.yml --ref main                      # latest backup
gh workflow run Restore_Drill.yml --ref main -f object_key=backups/demo_beauty_studio_2026-10-21T02-00-07Z.sql.gz.enc
gh run watch
```

Run the drill once after setting up R2, then about once a month. A green drill prints a table of `dump / db / table` row counts.

## Restore for real (incident)

Restore into a **new branch** first. Never restore directly over `main`.

```bash
# 1. download the object (R2 dashboard, or aws s3api get-object --endpoint-url $R2_ENDPOINT ...)
# 2. decrypt — the output is written with mode 0600 and must not already exist
BACKUP_ENCRYPTION_KEY=<from password manager> node scripts/Backup/Backup_Crypto.mjs decrypt backup.sql.gz.enc backup.sql.gz
gunzip backup.sql.gz
# 3. create a branch, empty it (see "Empty the branch" in Restore_Drill.yml), then:
psql -X -v ON_ERROR_STOP=1 -d "<branch direct url>" -f backup.sql
RESTORE_TARGET_URL="<branch direct url>" node scripts/Backup/Verify_Restore.mjs backup.sql
# 4. check the data, then promote that branch or copy the needed rows. Shred backup.sql afterwards.
```

The decrypted `.sql` holds every client's personal data. Never commit it, upload it or attach it anywhere.

## If Neon moves to Postgres 19

`pg_dump` cannot dump a server newer than itself. In both workflows, change `postgresql-client-18`, `/usr/lib/postgresql/18/bin` and the `' 18\.'` version check.
