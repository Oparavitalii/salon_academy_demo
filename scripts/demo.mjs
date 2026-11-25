// Public demo launcher — no accounts, no keys:
//   npm run demo                → next dev (DEMO_MODE=1)
//   npm run demo:build          → production build with DEMO_MODE=1
//   npm run demo:start [-p N]   → the standalone production server of that build (DEMO_MODE=1)
// DEMO_MODE=1 = embedded Postgres with fictional data, local payment simulation, e-mails to
// .dev_outbox/ (lib/demo/mode.ts). AUTH_SECRET gets a fixed, non-secret demo value when unset.
import { spawn } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');
const [cmd = 'dev', ...rest] = process.argv.slice(2);
const mode = ['dev', 'build', 'start'].includes(cmd) ? cmd : 'dev';
const extra = mode === cmd ? rest : process.argv.slice(2);

const env = {
  ...process.env,
  DEMO_MODE: '1',
  AUTH_SECRET:
    process.env.AUTH_SECRET || 'demo-only-auth-secret-not-for-production-use',
  AUTH_TRUST_HOST: 'true',
  NEXT_TELEMETRY_DISABLED: '1',
};

// Stripe-style return links and e-mail links use APP_URL — point it at this server.
const pi = extra.indexOf('-p');
const port = (pi >= 0 && extra[pi + 1]) || process.env.PORT || '3000';
env.APP_URL ??= `http://localhost:${port}`;

function run(args, opts = {}) {
  const child = spawn(process.execPath, args, {
    env,
    stdio: 'inherit',
    ...opts,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

if (mode !== 'start') {
  run([nextBin, mode, ...extra]);
} else {
  // `output: 'standalone'`: the server lives in .next/standalone and needs static files, public/,
  // the migrations, the certificate assets and PGlite's WebAssembly beside it (as in the Dockerfile).
  const root = process.cwd();
  const sa = join(root, '.next', 'standalone');
  if (!existsSync(join(sa, 'server.js'))) {
    console.error(
      'No standalone build found — run `npm run demo:build` first.',
    );
    process.exit(1);
  }
  const copy = (from) =>
    cpSync(join(root, from), join(sa, from), { recursive: true });
  copy('.next/static');
  copy('public');
  copy('drizzle');
  copy('content');
  copy('node_modules/@electric-sql/pglite');
  env.PORT = port;
  env.HOSTNAME ??= '127.0.0.1';
  console.log(`Studio Demo on http://localhost:${env.PORT}`);
  run([join(sa, 'server.js')], { cwd: sa });
}
