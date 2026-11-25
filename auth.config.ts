import type { NextAuthConfig } from 'next-auth';

/**
 * Provider-free Auth.js config: shared by `auth.ts` (with the Credentials provider and the DB)
 * and `proxy.ts` (reads the JWT only — role gating; the `sessions` row is checked by
 * `lib/auth/session.ts` on every protected page and action).
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/uk/login' },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.sid = user.sid;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.sid = token.sid;
      return session;
    },
  },
} satisfies NextAuthConfig;
