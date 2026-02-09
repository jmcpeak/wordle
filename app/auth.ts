import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';
import { linkAccount, upsertUser } from '@/db/stats';

export const { handlers, auth } = NextAuth({
  pages: {
    signIn: '/signin', // Tell next-auth to use our custom sign-in page
  },
  providers: [GitHub, Google, Facebook],
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
