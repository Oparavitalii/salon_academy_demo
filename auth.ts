import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { authConfig } from '@/auth.config';
import { openSession } from '@/lib/auth/session';

const loginInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

/** Codes reach the login action via `CredentialsSignin.code`. A blocked account → plain «invalid». */
class RateSignin extends CredentialsSignin {
  code = 'rate';
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw, request) => {
        const parsed = loginInput.safeParse(raw);
        if (!parsed.success) return null;
        const result = await openSession(parsed.data, request.headers);
        if (result === 'rate') throw new RateSignin();
        return result;
      },
    }),
  ],
});
