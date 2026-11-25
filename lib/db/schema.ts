import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import type { Locale, Localized } from '@/i18n/routing';

/**
 * Phase 11 wave 2 — application tables (4.2_Architecture, 4.3_Rules, Decisions 19.10.2026
 * «Правила кабінету й оплати для коду»). Migrations: `drizzle/` (drizzle-kit generate).
 */

export type Role = 'admin' | 'student';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').$type<Role>().notNull().default('student'),
  locale: text('locale').$type<Locale>().notNull().default('uk'),
  /** Name for the certificate (09_Cab_Settings). */
  name: text('name'),
  phone: text('phone'),
  /** Admin seed password → forced change on first login. Students set theirs via the link. */
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  blockedAt: timestamp('blocked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** One row per user = one active session (FR-14). A new login replaces `sid`. */
export const sessions = pgTable('sessions', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  sid: uuid('sid').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const loginEvents = pgTable(
  'login_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    device: text('device').notNull(),
    city: text('city'),
    country: text('country'),
    suspicious: boolean('suspicious').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('login_events_user_idx').on(t.userId, t.createdAt)],
);

export type CourseKind = 'online' | 'offline';
export type CourseStatus = 'available' | 'soon';

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  kind: text('kind').$type<CourseKind>().notNull(),
  title: jsonb('title').$type<Localized>().notNull(),
  status: text('status').$type<CourseStatus>().notNull().default('available'),
  /** Price shown on the site, whole euros (/admin/prices, owner 28.10). null = the price in `lib/content/courses.ts`. */
  priceEur: integer('price_eur'),
  position: integer('position').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** BASIC / MIDDLE / MENTORING (online) · one tier for the intensive. Prices in PLN minor units. */
export const courseTiers = pgTable(
  'course_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    /** null = price not set → the buy button is disabled («ціну уточнюємо»). */
    priceMinor: integer('price_minor'),
    currency: text('currency').notNull().default('pln'),
    /** Owner 19.10.2026: seeded prices are conditional; /admin/courses shows «умовна ціна». */
    priceIsPlaceholder: boolean('price_is_placeholder')
      .notNull()
      .default(false),
    position: integer('position').notNull().default(0),
  },
  (t) => [uniqueIndex('course_tiers_course_code_uq').on(t.courseId, t.code)],
);

export type Material = { title: string; url: string };

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    module: text('module'),
    title: jsonb('title').$type<Localized>().notNull(),
    durationMin: integer('duration_min'),
    /** Bunny Stream video GUID; null until uploaded (Q-10). */
    bunnyVideoId: text('bunny_video_id'),
    materials: jsonb('materials').$type<Material[]>().notNull().default([]),
  },
  (t) => [uniqueIndex('lessons_course_position_uq').on(t.courseId, t.position)],
);

export type PaymentStatus = 'paid' | 'refunded' | 'disputed' | 'failed';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Stripe Checkout Session id (`cs_…`; `dev_cs_…` in the local simulation). */
  providerSessionId: text('provider_session_id').notNull().unique(),
  providerPaymentIntentId: text('provider_payment_intent_id'),
  email: text('email').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id),
  tierId: uuid('tier_id').references(() => courseTiers.id, {
    onDelete: 'set null',
  }),
  kind: text('kind').$type<CourseKind>().notNull(),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull(),
  status: text('status').$type<PaymentStatus>().notNull().default('paid'),
  locale: text('locale').$type<Locale>().notNull().default('uk'),
  /** Set only after the buyer's letter really went out. */
  emailSentAt: timestamp('email_sent_at', { withTimezone: true }),
  /** Short-lived claim of the buyer's letter (one sender; re-takeable after 5 min). */
  emailClaimedAt: timestamp('email_claimed_at', { withTimezone: true }),
  /** Last failed attempt of the buyer's letter → «оплата без листа» in /admin/payments. */
  emailFailedAt: timestamp('email_failed_at', { withTimezone: true }),
  /** Admin notice (intensive / role conflict) — its own claim, never re-sends the buyer's. */
  adminEmailSentAt: timestamp('admin_email_sent_at', { withTimezone: true }),
  adminEmailClaimedAt: timestamp('admin_email_claimed_at', {
    withTimezone: true,
  }),
  /** Stripe `livemode`; false = test-mode / dev-simulation payment (purge before going live). */
  livemode: boolean('livemode').notNull().default(false),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type GrantedBy = 'payment' | 'admin';

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    tierId: uuid('tier_id').references(() => courseTiers.id, {
      onDelete: 'set null',
    }),
    grantedBy: text('granted_by').$type<GrantedBy>().notNull(),
    paymentId: uuid('payment_id').references(() => payments.id, {
      onDelete: 'set null',
    }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('enrollments_user_course_uq').on(t.userId, t.courseId)],
);

/** «Переглянуто» per lesson — drives progress and the certificate block. */
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

/** Processed webhook event ids — a repeated delivery is acknowledged and skipped. */
export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  /** `processing` while a delivery works on it; `done` after success. */
  state: text('state').$type<'processing' | 'done'>().notNull().default('done'),
  /** When the current claim was taken; a `processing` claim older than 5 min can be re-taken. */
  claimedAt: timestamp('claimed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  receivedAt: timestamp('received_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Single-use, 1 h. Only the SHA-256 of the token is stored. */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Salon price rows editable in /admin/services. Keyed by the service id of
 * `lib/content/salon.ts`; the public /salon merges these over the static Booksy data.
 */
export const services = pgTable('services', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull(),
  name: text('name').notNull(),
  /** Display strings as on /salon, e.g. «1 100 zł», «від 400 / 450 zł». */
  masterPrice: text('master_price'),
  topPrice: text('top_price'),
  duration: text('duration'),
  position: integer('position').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Failed-attempt log for throttling (login, forgot-password): one row per attempt, keyed
 * separately by IP and by e-mail (`login:ip:…`, `login:email:…`). Lives in the DB so it holds
 * across machines and restarts; rows older than 1 h are pruned on write.
 */
export const authThrottle = pgTable(
  'auth_throttle',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('auth_throttle_key_idx').on(t.key, t.createdAt)],
);

/**
 * Issued certificates (/admin/certificates, owner 30.10.2026). The PDF is never stored: it is
 * rebuilt from this row (same template, same text) for download and for a repeat send.
 * `number` = «DEMO/IPHM/{year}/{seq:3}», continuing the studio's paper numbering.
 */
export const certificates = pgTable(
  'certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    number: text('number').notNull().unique(),
    year: integer('year').notNull(),
    seq: integer('seq').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Online course the certificate is for — one automatic certificate per student and course. */
    courseId: uuid('course_id').references(() => courses.id, {
      onDelete: 'set null',
    }),
    courseLine1: text('course_line1').notNull(),
    courseLine2: text('course_line2'),
    /** Date of issue printed on the certificate, `YYYY-MM-DD`. */
    issuedOn: text('issued_on').notNull(),
    /** Last successful e-mail; null = the letter has not gone out (send again from the list). */
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('certificates_year_seq_uq').on(t.year, t.seq),
    uniqueIndex('certificates_user_course_uq').on(t.userId, t.courseId),
  ],
);
