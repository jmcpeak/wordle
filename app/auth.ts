import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import { linkAccount, upsertUser } from '@/db/stats';

export const { handlers, auth } = NextAuth({
  pages: {
    signIn: '/signin', // Tell next-auth to use our custom sign-in page
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        username: { label: 'Username' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          credentials.username === 'test' &&
          credentials.password === 'password'
        ) {
          return {
            id: 'creds-user',
            name: 'Test User',
            email: 'test@example.com',
          };
        }
        return null;
      },
    }),
  ],
  events: {
    async signIn({ user, account }) {
      const dbUser = await upsertUser(user);
      if (account) {
        await linkAccount({ ...account, userId: dbUser.id });
      }
      user.id = dbUser.id;
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.email) {
        const dbUser = await upsertUser(user);
        token.sub = dbUser.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
