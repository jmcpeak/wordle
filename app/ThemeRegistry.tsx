'use client';

import { CssBaseline, useMediaQuery } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { type ReactNode, useEffect, useLayoutEffect, useMemo } from 'react';
import { THEME_MODES } from '@/constants';
import { type ThemeMode, useThemeStore } from '@/store/themeStore';
import { darkTheme, lightTheme } from '@/themes';

type Props = {
  children: ReactNode;
  serverTheme: ThemeMode;
};

export default function ThemeRegistry({ children, serverTheme }: Props) {
  const mode = useThemeStore(({ mode }) => mode);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => {
    const currentMode =
      mode === THEME_MODES.SYSTEM
        ? prefersDarkMode
          ? THEME_MODES.DARK
          : THEME_MODES.LIGHT
        : mode;
    return currentMode === THEME_MODES.DARK ? darkTheme : lightTheme;
  }, [mode, prefersDarkMode]);

  useEffect(() => {
    const bg = theme.palette.background.default;
    const fg = theme.palette.text.primary;
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    document.body.style.color = fg;
    document.body.style.visibility = 'visible';
  }, [theme.palette.background.default, theme.palette.text.primary]);

  // Initialize the Zustand store with the server-provided theme before the
  // browser paints (body is visibility:hidden, so no flash of wrong theme).
  useLayoutEffect(() => {
    useThemeStore.setState({ mode: serverTheme });
  }, [serverTheme]);

  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
