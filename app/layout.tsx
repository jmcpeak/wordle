import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import type { ReactNode } from 'react';
import { auth } from '@/auth';
import ClientProvider from '@/components/ClientProvider';
import I18nProvider from '@/components/I18nProvider';
import PwaUpdateReload from '@/components/PwaUpdateReload';
import { getTranslations } from '@/db/i18n';
import { getTheme } from '@/db/stats';
import type { ThemeMode } from '@/store/themeStore';
import ThemeRegistry from '@/ThemeRegistry';
import { parseAcceptLanguage } from '@/utils/parseLocale';
import { parseThemeCookie, THEME_COOKIE_NAME } from '@/utils/themeCookie';

const BODY_STYLE = { opacity: 0 } as const;

const SITE_DESCRIPTION =
  'Guess the hidden 5-letter word in six tries. A fast, installable Wordle clone.';

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://wordle-jason-mcpeaks-projects.vercel.app';
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: 'Wordle',
  title: {
    default: 'Wordle',
    template: '%s · Wordle',
  },
  description: SITE_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Wordle',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Wordle',
    title: 'Wordle',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wordle',
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

type RootLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
};

export default async function RootLayout({ children, modal }: RootLayoutProps) {
  const [session, headerStore, cookieStore] = await Promise.all([
    auth(),
    headers(),
    cookies(),
  ]);

  // Detect locale from the browser's Accept-Language header
  const acceptLanguage = headerStore.get('accept-language');
  const locale = parseAcceptLanguage(acceptLanguage);

  // Prefer the theme cookie (no Neon). Fall back to DB once when missing so the
  // first paint is already correct — never flash light→dark after hydration.
  const themeFromCookie = parseThemeCookie(
    cookieStore.get(THEME_COOKIE_NAME)?.value,
  );
  const userId = session?.user?.id;

  // Theme DB lookup and translations are independent once locale/user are known.
  const [serverTheme, translations] = await Promise.all([
    themeFromCookie
      ? Promise.resolve<ThemeMode>(themeFromCookie)
      : userId
        ? getTheme(userId)
        : Promise.resolve<ThemeMode>('system'),
    // en-US is sync; other locales use an in-memory Next cache after the first hit.
    getTranslations(locale),
  ]);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
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
      </head>
      {/* Hidden until ThemeRegistry resolves theme in useLayoutEffect (before paint). */}
      <body style={BODY_STYLE} suppressHydrationWarning>
        <SpeedInsights />
        <ClientProvider session={session}>
          <PwaUpdateReload />
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
