import { unstable_cache } from 'next/cache';
import { dbAll } from '@/db/connection';
import { EN_US_TRANSLATIONS } from '@/i18n/enUsTranslations';

const DEFAULT_LOCALE = 'en-US';

async function loadTranslationsFromDb(
  locale: string,
): Promise<Record<string, string>> {
  // Try the exact locale first
  let rows = await dbAll<{ key: string; value: string }>(
    'SELECT key, value FROM translations WHERE locale = $1',
    [locale],
  );

  // Fall back to the base language (e.g. "en" from "en-GB")
  if (rows.length === 0 && locale.includes('-')) {
    const baseLang = locale.split('-')[0];
    rows = await dbAll<{ key: string; value: string }>(
      'SELECT key, value FROM translations WHERE locale LIKE $1',
      [`${baseLang}%`],
    );
  }

  // Final fallback to en-US
  if (rows.length === 0 && locale !== DEFAULT_LOCALE) {
    rows = await dbAll<{ key: string; value: string }>(
      'SELECT key, value FROM translations WHERE locale = $1',
      [DEFAULT_LOCALE],
    );
  }

  return rows.reduce(
    (acc, row) => {
      acc[row.key] = row.value;
      return acc;
    },
    {} as Record<string, string>,
  );
}

/**
 * Get all translations for a given locale.
 * en-US / en are served from the in-memory seed (no Neon round trip).
 * Other locales are cached per locale to avoid a Neon round trip on every request.
 */
export async function getTranslations(
  locale: string,
): Promise<Record<string, string>> {
  if (locale === DEFAULT_LOCALE || locale === 'en') {
    return EN_US_TRANSLATIONS;
  }

  return unstable_cache(
    async () => loadTranslationsFromDb(locale),
    ['translations', locale],
    { revalidate: 3600, tags: ['translations'] },
  )();
}

/**
 * Get all available locales in the database.
 */
export async function getAvailableLocales(): Promise<string[]> {
  const rows = await dbAll<{ locale: string }>(
    'SELECT DISTINCT locale FROM translations',
  );
  return rows.map((row) => row.locale);
}
