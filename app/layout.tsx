import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { auth } from '@/auth';
import ClientProvider from '@/components/ClientProvider';
import I18nProvider from '@/components/I18nProvider';
import { getTranslations } from '@/db/i18n';
import { getTheme } from '@/db/stats';
import type { ThemeMode } from '@/store/themeStore';
import ThemeRegistry from '@/ThemeRegistry';
import { parseAcceptLanguage } from '@/utils/parseLocale';

export const metadata: Metadata = {
  title: 'Wordle',
  description:
    'A Wordle clone built with AI using React, Next/NextAuth, Zustand, Neon Postgres and MUI',
};

type RootLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
};

export default async function RootLayout({ children, modal }: RootLayoutProps) {
  const session = await auth();

  let serverTheme: ThemeMode = 'system';
  if (session?.user?.id) {
    serverTheme = await getTheme(session.user.id);
  }

  // Detect locale from the browser's Accept-Language header
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  const locale = parseAcceptLanguage(acceptLanguage);
  const translations = await getTranslations(locale);

  return (
    <html lang={locale}>
      <head title="Wordle Clone">
        <style
          // biome-ignore lint/security/noDangerouslySetInnerHtml: need it so screen doesn't flash white in dark mode when refreshing
          dangerouslySetInnerHTML={{
            __html:
              serverTheme === 'dark'
                ? 'html,body{background-color:#121212;color:#ffffff}'
                : serverTheme === 'light'
                  ? 'html,body{background-color:#ffffff;color:#000000}'
                  : 'html,body{background-color:#ffffff;color:#000000}@media(prefers-color-scheme:dark){html,body{background-color:#121212;color:#ffffff}}',
          }}
        />
        <title></title>
      </head>
      <body style={{ visibility: 'hidden' }}>
        <ClientProvider session={session}>
          <I18nProvider locale={locale} translations={translations}>
            <ThemeRegistry serverTheme={serverTheme}>
              {children}
              {modal}
            </ThemeRegistry>
          </I18nProvider>
        </ClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
