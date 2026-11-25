import type { DefaultSession } from 'next-auth';

import type { Role } from '@/lib/db/schema';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
    /** Id of the one active session row (`sessions.sid`). */
    sid: string;
  }

  interface User {
    role: Role;
    sid: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    sid: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: Role;
    sid: string;
  }
}
