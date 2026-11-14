import { createContext, useCallback, useContext } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { EN_US_FALLBACK_TRANSLATIONS } from '@/store/enUsFallbackTranslations';

type I18nState = {
  locale: string;
  translations: Record<string, string>;
  setTranslations: (
    locale: string,
    translations: Record<string, string>,
  ) => void;
};

export type I18nSnapshot = Pick<I18nState, 'locale' | 'translations'>;

/** Request-scoped during SSR; null keeps store-based unit tests lightweight. */
export const I18nContext = createContext<I18nSnapshot | null>(null);

export const useI18nStore = create<I18nState>()(
  devtools(
    (set) => ({
      locale: 'en-US',
      translations: {},
      setTranslations: (locale, translations) => set({ locale, translations }),
    }),
    { name: 'I18nStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

const PLACEHOLDER_RE = /\{(\w+)\}/g;

/**
 * Replace every `{param}` in one pass. A per-param `String.replace` would only
 * substitute the first occurrence, and would treat `$&`/`$1` in the value as
 * replacement patterns rather than literal text.
 */
function interpolate(
  template: string,
  params?: Record<string, string>,
): string {
  if (!params) return template;
  return template.replace(
    PLACEHOLDER_RE,
    (match, key: string) => params[key] ?? match,
  );
}

/**
 * Translate a key, with optional template parameter interpolation.
 * Can be called from anywhere — inside or outside React components.
 *
 * Usage:
 *   t('game.title')                          // "Wordle"
 *   t('message.gameOver', { solution: 'HELLO' }) // "Game Over! The word was HELLO"
 */
export function t(key: string, params?: Record<string, string>): string {
  const { translations } = useI18nStore.getState();
  return interpolate(
    translations[key] ?? EN_US_FALLBACK_TRANSLATIONS[key] ?? key,
    params,
  );
}

/**
 * React hook that returns a stable t() function.
 * Uses request-scoped context when available and the store as a test fallback.
 */
export function useTranslation() {
  const context = useContext(I18nContext);
  // Under I18nProvider, always select the stable request-scoped snapshot.
  // The fallback store still supports isolated component tests, without making
  // every app consumer re-render when the imperative store syncs on hydration.
  const snapshot = useI18nStore((state) => context ?? state);
  const { translations, locale } = snapshot;

  const translate = useCallback(
    (key: string, params?: Record<string, string>): string =>
      interpolate(
        translations[key] ?? EN_US_FALLBACK_TRANSLATIONS[key] ?? key,
        params,
      ),
    [translations],
  );

  return { t: translate, locale };
}
