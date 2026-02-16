import NextAuth from 'next-auth';
import Facebook from 'next-auth/providers/facebook';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { linkAccount, upsertUser } from '@/db/stats';

const AUTH_ENV_KEYS = [
  'AUTH_GITHUB_ID',
  'AUTH_GITHUB_SECRET',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
  'AUTH_FACEBOOK_ID',
  'AUTH_FACEBOOK_SECRET',
] as const;

type AuthEnvKey = (typeof AUTH_ENV_KEYS)[number];

function env(name: AuthEnvKey): string {
  const value = process.env[name];
  if (value == null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const { handlers, auth } = NextAuth({
  pages: {
    signIn: '/signin', // Tell next-auth to use our custom sign-in page
  },
  providers: [
    GitHub({
      clientId: env('AUTH_GITHUB_ID'),
      clientSecret: env('AUTH_GITHUB_SECRET'),
    }),
    Google({
      clientId: env('AUTH_GOOGLE_ID'),
      clientSecret: env('AUTH_GOOGLE_SECRET'),
    }),
    Facebook({
      clientId: env('AUTH_FACEBOOK_ID'),
      clientSecret: env('AUTH_FACEBOOK_SECRET'),
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
