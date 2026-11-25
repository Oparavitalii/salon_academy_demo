#!/usr/bin/env node
// Verifies a restore: counts rows per table in a plain-format pg_dump file,
// counts them again in the database the dump was applied to, and exits
// non-zero on ANY mismatch. Used by .github/workflows/Restore_Drill.yml.
//
//   RESTORE_TARGET_URL=<url> node scripts/Backup/Verify_Restore.mjs <dump.sql>
//
// RESTORE_TARGET_URL must point at the throwaway drill branch, never at
// production. Needs `psql` on PATH (the workflow installs it); no npm deps.
//
// Expected numbers come from the dump itself, so nothing needs updating as the
// data grows or tables are added.
//
// Prints table names and counts only. The dump is production personal data:
// no row, no column value and no connection string may reach the log.
import { spawnSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const dumpPath = process.argv[2];
if (!dumpPath || process.argv.length > 3) {
  console.error(
    'usage: RESTORE_TARGET_URL=<url> node scripts/Backup/Verify_Restore.mjs <dump.sql>',
  );
  process.exit(2);
}
const url = process.env.RESTORE_TARGET_URL;
if (!url) {
  console.error('RESTORE_TARGET_URL is not set — refusing to guess a target');
  process.exit(2);
}

// pg_dump writes `COPY <schema>.<table> (cols) FROM stdin;`, the rows, then `\.`
// Schema-qualified so drizzle.__drizzle_migrations is checked too — a restore
// that loses it makes the next migrate think every migration is pending.
const IDENT = '(?:"([^"]+)"|([A-Za-z0-9_]+))';
const COPY_RE = new RegExp(
  `^COPY ${IDENT}\\.${IDENT} (?:\\(.*\\) )?FROM stdin;$`,
);

async function countsFromDump(path) {
  const counts = new Map();
  let current = null;
  let rows = 0;
  const rl = createInterface({
    input: createReadStream(path),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (current !== null) {
      if (line === '\\.') {
        counts.set(current, rows);
        current = null;
      } else {
        rows++;
      }
      continue;
    }
    const m = COPY_RE.exec(line);
    if (m) {
      current = JSON.stringify([m[1] ?? m[2], m[3] ?? m[4]]);
      rows = 0;
    }
  }
  if (current !== null)
    throw new Error('dump ends inside a COPY block — truncated file?');
  return counts;
}

const quoteIdent = (s) => `"${s.replace(/"/g, '""')}"`;
const quoteLit = (s) => `'${s.replace(/'/g, "''")}'`;

function countsFromDb(tables) {
  const sql = tables
    .map((t) => {
      const [schema, table] = JSON.parse(t);
      return `SELECT ${quoteLit(t)}, count(*) FROM ${quoteIdent(schema)}.${quoteIdent(table)}`;
    })
    .join('\nUNION ALL\n');
  const r = spawnSync(
    'psql',
    [
      '-X',
      '-A',
      '-t',
      '-F',
      '\t',
      '-v',
      'ON_ERROR_STOP=1',
      '-d',
      url,
      '-c',
      sql,
    ],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (r.error) throw new Error(`could not run psql: ${r.error.message}`);
  if (r.status !== 0) {
    // psql stderr names the failing relation, not data or the URL password.
    throw new Error(
      `psql exited ${r.status}: ${(r.stderr || '').trim().split('\n')[0]}`,
    );
  }
  const counts = new Map();
  for (const line of r.stdout.split('\n')) {
    if (!line) continue;
    const tab = line.lastIndexOf('\t');
    counts.set(line.slice(0, tab), Number(line.slice(tab + 1)));
  }
  return counts;
}

process.exitCode = 1;
try {
  const expected = await countsFromDump(dumpPath);
  if (expected.size === 0) {
    console.error(
      `no COPY blocks found in ${dumpPath} — is this a plain-format pg_dump?`,
    );
    process.exit(1);
  }
  const actual = countsFromDb([...expected.keys()]);

  let mismatches = 0;
  let total = 0;
  console.log('   dump       db  table');
  const label = (t) => JSON.parse(t).join('.');
  for (const [table, want] of [...expected].sort(([a], [b]) =>
    label(a).localeCompare(label(b)),
  )) {
    const got = actual.get(table);
    total += want;
    const ok = got === want;
    if (!ok) mismatches++;
    console.log(
      `${String(want).padStart(7)}  ${String(got ?? '-').padStart(7)}  ${label(table)}${ok ? '' : '   <-- MISMATCH'}`,
    );
  }
  console.log(`\ntables: ${expected.size}   rows in dump: ${total}`);
  if (mismatches > 0) {
    console.error(
      `\nFAILED: ${mismatches} table(s) differ — the backup did not restore faithfully.`,
    );
    process.exit(1);
  }
  console.log(
    '\nOK — every table restored with the row count the dump carried.',
  );
  process.exitCode = 0;
} catch (err) {
  console.error(`verify failed: ${err.message}`);
  process.exit(1);
}
