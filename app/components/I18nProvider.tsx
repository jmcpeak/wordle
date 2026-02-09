'use client';

import { type ReactNode, useLayoutEffect } from 'react';
import { useI18nStore } from '@/store/i18nStore';

type I18nProviderProps = {
  locale: string;
  translations: Record<string, string>;
  children: ReactNode;
};

export default function I18nProvider({
  locale,
  translations,
  children,
}: I18nProviderProps) {
  // Initialize the store before the browser paints (body is visibility:hidden
  // until the theme effect fires, so no flash of untranslated text).
  useLayoutEffect(() => {
    useI18nStore.setState({ locale, translations });
  }, [locale, translations]);

  return <>{children}</>;
}
