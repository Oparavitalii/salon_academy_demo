/**
 * Creates the one admin account from ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD (owner sets both).
 * The password is bcrypt-hashed; the admin must change it on first login. Prints only
 * «admin created» / «admin exists». There is no admin sign-up route.
 *   npm run db:seed-admin
 */
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD first.');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('ADMIN_INITIAL_PASSWORD must be at least 10 characters.');
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (existing) {
    console.log('admin exists');
    return;
  }

  await db.insert(users).values({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'admin',
    mustChangePassword: true,
  });
  console.log('admin created');
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error('seed-admin failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
