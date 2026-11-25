#!/usr/bin/env node
// Encrypts / decrypts a database backup. Used by .github/workflows/Db_Backup.yml
// and .github/workflows/Restore_Drill.yml, and by hand during an incident.
//
//   node scripts/Backup/Backup_Crypto.mjs encrypt <input|-> <output>
//   node scripts/Backup/Backup_Crypto.mjs decrypt <input> <output>
//
// Key: env BACKUP_ENCRYPTION_KEY, 64 hex chars (32 bytes, AES-256).
// Generate one with: openssl rand -hex 32
//
// Wire format, defined only here (adapted from an earlier project jobs/backup-crypto.ts):
//
//   IV (12 bytes) | AuthTag (16 bytes) | Ciphertext (rest)      AES-256-GCM
//
// The plaintext is whatever comes in — the workflow feeds it `pg_dump | gzip`,
// so compression is the pipeline's job, not the cipher's.
//
// Streaming on both sides: the backup never sits on disk unencrypted. On
// encrypt the tag is only known at the end, so a 16-byte placeholder is written
// first and overwritten in place once cipher.final() has produced it.
//
// No dependencies — node builtins only — so the workflows need no `npm ci`
// and this file runs from any checkout with Node >= 18.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, unlink } from 'node:fs/promises';

const IV_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = IV_BYTES + TAG_BYTES;

const USAGE =
  'usage: node scripts/Backup/Backup_Crypto.mjs encrypt <input|-> <output>\n' +
  '       node scripts/Backup/Backup_Crypto.mjs decrypt <input> <output>\n' +
  'key:   env BACKUP_ENCRYPTION_KEY (64 hex chars; generate: openssl rand -hex 32)';

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

// Re-checked here, not trusted: Buffer.from('oops', 'hex') silently yields a
// 2-byte key and the failure surfaces later as an opaque "Invalid key length".
// An EMPTY value is the common case in CI — GitHub renders an unset secret as
// "" (defined, not undefined) — so it gets its own message.
function readKey() {
  const hex = process.env.BACKUP_ENCRYPTION_KEY;
  if (hex === undefined || hex === '') {
    fail('BACKUP_ENCRYPTION_KEY is not set (or is empty) — refusing to run');
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    fail(
      `BACKUP_ENCRYPTION_KEY must be 64 hex characters (32 bytes); got ${hex.length} characters`,
    );
  }
  return Buffer.from(hex, 'hex');
}

// 'wx' + 0600: never overwrite an existing file (a mode only applies when the
// file is created, so reusing a path could keep looser permissions), and keep
// the output owner-only — a decrypted dump is every client's personal data.
async function openOutput(path) {
  try {
    return await open(path, 'wx', 0o600);
  } catch (err) {
    if (err.code === 'EEXIST')
      fail(`output ${path} already exists — write to a fresh path`);
    throw err;
  }
}

async function encrypt(inputPath, outputPath, key) {
  // Open the input first, so a wrong path fails before an output file exists.
  const input =
    inputPath === '-'
      ? process.stdin
      : (await open(inputPath, 'r')).createReadStream();
  const iv = randomBytes(IV_BYTES); // random per backup, never reused with a key
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const out = await openOutput(outputPath);
  let plainBytes = 0;
  try {
    await out.write(
      Buffer.concat([iv, Buffer.alloc(TAG_BYTES)]),
      0,
      HEADER_BYTES,
      0,
    );
    let position = HEADER_BYTES;
    for await (const chunk of input) {
      plainBytes += chunk.length;
      const enc = cipher.update(chunk);
      if (enc.length) {
        await out.write(enc, 0, enc.length, position);
        position += enc.length;
      }
    }
    const last = cipher.final();
    if (last.length) await out.write(last, 0, last.length, position);
    await out.write(cipher.getAuthTag(), 0, TAG_BYTES, IV_BYTES);
    await out.close();
  } catch (err) {
    await out.close().catch(() => {});
    await unlink(outputPath).catch(() => {});
    throw err;
  }
  // An empty input means the upstream pipe died before writing anything.
  // pipefail in the workflow catches that too; this is the second net.
  if (plainBytes === 0) {
    await unlink(outputPath).catch(() => {});
    fail('input was empty — refusing to produce an encrypted empty backup');
  }
  console.error(`encrypted ${plainBytes} bytes -> ${outputPath}`);
}

async function decrypt(inputPath, outputPath, key) {
  if (inputPath === '-')
    fail(
      'decrypt needs a file input (the tag is read from the header first)',
      2,
    );
  const src = await open(inputPath, 'r');
  const header = Buffer.alloc(HEADER_BYTES);
  const { bytesRead } = await src.read(header, 0, HEADER_BYTES, 0);
  await src.close();
  if (bytesRead < HEADER_BYTES) {
    fail(
      `${inputPath} is too short to contain IV + AuthTag (${bytesRead} bytes)`,
    );
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    header.subarray(0, IV_BYTES),
  );
  decipher.setAuthTag(header.subarray(IV_BYTES));

  const out = await openOutput(outputPath);
  let plainBytes = 0;
  try {
    for await (const chunk of createReadStream(inputPath, {
      start: HEADER_BYTES,
    })) {
      const dec = decipher.update(chunk);
      if (dec.length) {
        await out.write(dec);
        plainBytes += dec.length;
      }
    }
    // GCM verifies the tag here: a wrong key or a tampered object throws
    // instead of returning plausible garbage. The partial output written so
    // far is unauthenticated, so it is deleted below rather than left behind.
    const last = decipher.final();
    if (last.length) {
      await out.write(last);
      plainBytes += last.length;
    }
    await out.close();
  } catch (err) {
    await out.close().catch(() => {});
    await unlink(outputPath).catch(() => {});
    fail(`decrypt failed (wrong key or corrupted object): ${err.message}`);
  }
  console.error(`decrypted ${plainBytes} bytes -> ${outputPath}`);
}

const [mode, inputPath, outputPath, ...extra] = process.argv.slice(2);
if (
  !['encrypt', 'decrypt'].includes(mode) ||
  !inputPath ||
  !outputPath ||
  extra.length
) {
  fail(USAGE, 2);
}
const key = readKey();

// Default to failure; only a completed run clears it. If the event loop ever
// drains early, the step goes red instead of minting a phantom success
// (an earlier project scheduled runs #8/#9 exited 0 having uploaded nothing).
process.exitCode = 1;
(mode === 'encrypt'
  ? encrypt(inputPath, outputPath, key)
  : decrypt(inputPath, outputPath, key)
)
  .then(() => {
    process.exitCode = 0;
  })
  .catch((err) => fail(`${mode} failed: ${err.message}`));
