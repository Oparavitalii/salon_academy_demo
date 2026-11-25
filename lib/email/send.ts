import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resend } from 'resend';

import { localSimulationAllowed } from '@/lib/demo/mode';

import { templates, type TemplateName, type TemplateVars } from './templates';

type EmailInput<T extends TemplateName> = {
  to: string;
  template: T;
  vars: TemplateVars[T];
  /** Files sent with the letter (the certificate PDF). */
  attachments?: { filename: string; content: Uint8Array }[];
};

/** Real delivery is configured. In production nothing is sold without it (`paymentsAvailable`). */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends one e-mail. With `RESEND_API_KEY` → Resend; a failure throws.
 * Production without the key THROWS too — a payment webhook then answers 500 and Stripe
 * retries, instead of pretending the access letter went out.
 * Development without the key: the log gets recipient + subject only (never a body with a
 * password or a reset link) and the full text goes to the git-ignored `.dev_outbox/`.
 */
export async function sendEmail<T extends TemplateName>({
  to,
  template,
  vars,
  attachments,
}: EmailInput<T>): Promise<void> {
  const build = templates[template] as (v: TemplateVars[T]) => {
    subject: string;
    text: string;
    secret: 'password' | 'link' | null;
  };
  const { subject, text, secret } = build(vars);

  const key = process.env.RESEND_API_KEY;
  if (key) {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'Studio Demo <noreply@example.test>',
      to,
      subject,
      text,
      ...(attachments?.length && {
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content),
        })),
      }),
    });
    if (error) throw new Error(`email send failed: ${error.name}`);
    return;
  }

  if (!localSimulationAllowed())
    throw new Error('email: RESEND_API_KEY is not set');

  const marker =
    secret === 'password'
      ? ' [email body omitted: contains a password]'
      : secret === 'link'
        ? ' [email body omitted: contains a reset link]'
        : '';
  console.log(`[email:log] to=${to} subject="${subject}"${marker}`);

  {
    const dir = path.join(process.cwd(), '.dev_outbox');
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTo = to.replace(/[^a-z0-9@.+_-]/gi, '_');
    await writeFile(
      path.join(dir, `${stamp}_${template}_${safeTo}.txt`),
      `To: ${to}\nSubject: ${subject}\n\n${text}\n`,
      'utf8',
    );
    for (const a of attachments ?? [])
      await writeFile(path.join(dir, `${stamp}_${a.filename}`), a.content);
  }
}

/** The admin inbox for alerts: ADMIN_EMAIL, else nothing. */
export function adminInbox(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}
