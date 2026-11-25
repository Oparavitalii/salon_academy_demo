/**
 * Removes everything that TEST-mode payments created, before switching to the live Stripe key:
 *   1. enrollments opened by a test payment (`payments.livemode = false`);
 *   2. student accounts that exist only because of test payments — no live payment, no other
 *      enrollment (manual grants keep the account) — their sessions, logins, progress and reset
 *      tokens go with them (FK cascade);
 *   3. the test payments themselves.
 * DRY RUN by default: prints counts only. Apply: `npm run db:purge-test-payments -- --apply`.
 */
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';

const apply = process.argv.includes('--apply');

const TEST_ENROLLMENTS = sql`
  select e.id from enrollments e
  join payments p on p.id = e.payment_id
  where p.livemode = false and e.granted_by = 'payment'`;

const TEST_ONLY_USERS = sql`
  select u.id from users u
  where u.role = 'student'
    and exists (select 1 from payments p where p.user_id = u.id and p.livemode = false)
    and not exists (select 1 from payments p where p.user_id = u.id and p.livemode = true)
    and not exists (
      select 1 from enrollments e
      left join payments p on p.id = e.payment_id
      where e.user_id = u.id
        and (p.id is null or p.livemode = true or e.granted_by = 'admin')
    )`;

async function count(q: ReturnType<typeof sql>): Promise<number> {
  const r = await db.execute(sql`select count(*)::int as n from (${q}) x`);
  return Number((r.rows[0] as { n: number }).n);
}

async function main() {
  const counts = {
    payments: await count(sql`select id from payments where livemode = false`),
    enrollments: await count(TEST_ENROLLMENTS),
    users: await count(TEST_ONLY_USERS),
  };
  console.log(
    `${apply ? 'purge' : 'dry run'}: test payments ${counts.payments}, enrollments ${counts.enrollments}, test-only students ${counts.users}`,
  );
  if (!apply) {
    console.log('nothing deleted — re-run with -- --apply');
    return;
  }
  await db.transaction(async (tx) => {
    // users first (their ids are computed from the payments that still exist)
    await tx.execute(sql`delete from users where id in (${TEST_ONLY_USERS})`);
    await tx.execute(
      sql`delete from enrollments where id in (${TEST_ENROLLMENTS})`,
    );
    await tx.execute(sql`delete from payments where livemode = false`);
  });
  console.log('done');
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error('purge failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
