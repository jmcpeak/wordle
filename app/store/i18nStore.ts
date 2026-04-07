import { useCallback } from 'react';
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

function interpolate(
  template: string,
  params?: Record<string, string>,
): string {
  if (!params) return template;
  let result = template;
  for (const [paramKey, paramValue] of Object.entries(params)) {
    result = result.replace(`{${paramKey}}`, paramValue);
  }
  return result;
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
 * Subscribes to the store so the component re-renders when translations change.
 */
export function useTranslation() {
  const translations = useI18nStore((s) => s.translations);
  const locale = useI18nStore((s) => s.locale);

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
