import { THEME_MODES } from '@/constants';
import type { ThemeMode } from '@/store/themeStore';

export const THEME_COOKIE_NAME = 'wordle-theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isThemeMode(value: unknown): value is ThemeMode {
  return (
    typeof value === 'string' &&
    Object.values(THEME_MODES).includes(value as ThemeMode)
  );
}

export function parseThemeCookie(
  value: string | undefined,
): ThemeMode | undefined {
  return isThemeMode(value) ? value : undefined;
}

export function themeCookieOptions() {
  return {
    path: '/',
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: 'lax' as const,
  };
}
