import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const MIN_PASSWORD = 8;

/** «Забули пароль?» link: 1 hour. */
export const RESET_TTL_MS = 60 * 60 * 1000;
/** «Встановіть пароль» link in the access letter (purchase, manual grant, admin resend): 72 hours. */
export const SET_PASSWORD_TTL_MS = 72 * 60 * 60 * 1000;

export const newPasswordInput = z
  .object({
    password: z.string().min(MIN_PASSWORD).max(200),
    repeat: z.string(),
  })
  .refine((v) => v.password === v.repeat, { path: ['repeat'] });

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Single-use link token: the raw token goes into the e-mail only, the DB keeps its SHA-256.
 * Same table and page for «Забули пароль?» and «Встановіть пароль» — only the lifetime differs.
 */
export function newResetToken(ttlMs: number = RESET_TTL_MS): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlMs),
  };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
