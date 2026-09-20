'use client';

import { type ReactNode, useLayoutEffect, useMemo } from 'react';
import { I18nContext, useI18nStore } from '@/store/i18nStore';

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
  const value = useMemo(
    () => ({ locale, translations }),
    [locale, translations],
  );

  // Keep the imperative t() API in sync for Zustand actions after hydration.
  // Rendered components read the request-scoped context, avoiding a global
  // store mutation during SSR that could leak locale data across requests.
  useLayoutEffect(() => {
    useI18nStore.setState({ locale, translations });
  }, [locale, translations]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
