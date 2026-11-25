import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import {
  certificates,
  enrollments,
  lessonProgress,
  payments,
  users,
} from '@/lib/db/schema';
import type { SeedDb } from '@/lib/db/seedContent';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDemo } from '@/lib/demo/seed';

import { makeTestDb } from '../helpers/Test_Db';

describe('public demo seed (DEMO_MODE=1)', () => {
  it('builds a complete fictional dataset on the real migrations', async () => {
    const db = await makeTestDb();
    await seedDemo(db as unknown as SeedDb);

    const all = await db.select().from(users);
    expect(all.map((u) => u.email).sort()).toEqual(
      Object.values(DEMO_ACCOUNTS).sort(),
    );
    expect(all.every((u) => u.email.endsWith('@studio-demo.example'))).toBe(
      true,
    );
    const [admin] = all.filter((u) => u.role === 'admin');
    expect(admin.email).toBe(DEMO_ACCOUNTS.admin);
    expect(await bcrypt.compare(DEMO_PASSWORD, admin.passwordHash!)).toBe(true);

    expect(await db.select().from(enrollments)).toHaveLength(3);
    expect((await db.select().from(payments)).every((p) => !p.livemode)).toBe(
      true,
    );
    expect((await db.select().from(lessonProgress)).length).toBeGreaterThan(6);

    const [graduate] = all.filter((u) => u.email === DEMO_ACCOUNTS.graduate);
    const certs = await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, graduate.id));
    expect(certs).toHaveLength(1);
    expect(certs[0].number).toMatch(/^DEMO\/IPHM\/\d{4}\/001$/);
  });
});
