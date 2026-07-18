'use client';

import { HapticsProvider } from '@haptics/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { THEME_MODES } from '@/constants';
import { type ThemeMode, useThemeStore } from '@/store/themeStore';
import { darkTheme, lightTheme } from '@/themes';
import { THEME_COOKIE_MAX_AGE, THEME_COOKIE_NAME } from '@/utils/themeCookie';

type Props = {
  children: ReactNode;
  serverTheme: ThemeMode;
};

function modeIsDark(mode: ThemeMode, systemPrefersDark: boolean): boolean {
  if (mode === THEME_MODES.DARK) return true;
  if (mode === THEME_MODES.LIGHT) return false;
  return systemPrefersDark;
}

function writeThemeCookie(theme: ThemeMode): void {
  // biome-ignore lint/suspicious/noDocumentCookie: must set before next navigation so SSR gets the theme without a Neon round trip
  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)};path=/;max-age=${THEME_COOKIE_MAX_AGE};samesite=lax`;
}

export default function ThemeRegistry({ children, serverTheme }: Props) {
  // Start from the server theme (cookie/DB), never the store default ("system").
  const [mode, setMode] = useState(serverTheme);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => serverTheme === THEME_MODES.DARK,
  );
  // Stay invisible until system preference is read synchronously in useLayoutEffect.
  const [ready, setReady] = useState(false);

  const theme = useMemo(
    () => (modeIsDark(mode, systemPrefersDark) ? darkTheme : lightTheme),
    [mode, systemPrefersDark],
  );

  useLayoutEffect(() => {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    setSystemPrefersDark(prefersDark);
    useThemeStore.setState({ mode: serverTheme });
    setMode(serverTheme);
    writeThemeCookie(serverTheme);
    setReady(true);
  }, [serverTheme]);

  // Follow later toggles from the store.
  useEffect(() => {
    return useThemeStore.subscribe((state) => {
      setMode(state.mode);
    });
  }, []);

  // Reveal only after the resolved MUI theme is committed (still before paint).
  useLayoutEffect(() => {
    if (!ready) return;
    const bg = theme.palette.background.default;
    const fg = theme.palette.text.primary;
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    document.body.style.color = fg;
    document.body.style.opacity = '1';
  }, [ready, theme.palette.background.default, theme.palette.text.primary]);

  // Persist cookie whenever the user changes theme.
  useEffect(() => {
    if (!ready) return;
    writeThemeCookie(mode);
  }, [mode, ready]);

  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HapticsProvider>{children}</HapticsProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
