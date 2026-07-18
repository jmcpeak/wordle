'use client';

import { type ReactNode, useLayoutEffect, useState } from 'react';
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
  // Seed before first paint so SSR/hydration use real copy, not empty store keys.
  useState(() => {
    useI18nStore.setState({ locale, translations });
  });

  useLayoutEffect(() => {
    useI18nStore.setState({ locale, translations });
  }, [locale, translations]);

  return <>{children}</>;
}
