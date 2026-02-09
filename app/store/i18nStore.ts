import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type I18nState = {
  locale: string;
  translations: Record<string, string>;
  setTranslations: (locale: string, translations: Record<string, string>) => void;
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
  let value = translations[key] ?? key;

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      value = value.replace(`{${paramKey}}`, paramValue);
    }
  }

  return value;
}

/**
 * React hook that returns the t() function.
 * Subscribes to the store so the component re-renders when translations change.
 */
export function useTranslation() {
  // Subscribe to translations so the component re-renders on locale change
  const translations = useI18nStore((s) => s.translations);
  const locale = useI18nStore((s) => s.locale);

  const translate = (key: string, params?: Record<string, string>): string => {
    let value = translations[key] ?? key;

    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(`{${paramKey}}`, paramValue);
      }
    }

    return value;
  };

  return { t: translate, locale };
}
