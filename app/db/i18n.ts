import { dbAll } from '@/db/connection';
import { ensureSchema } from '@/db/schema';

const DEFAULT_LOCALE = 'en-US';

/**
 * Get all translations for a given locale.
 * Falls back to en-US if the requested locale has no translations.
 */
export async function getTranslations(
  locale: string,
): Promise<Record<string, string>> {
  await ensureSchema();

  // Try the exact locale first
  let rows = await dbAll(
    'SELECT key, value FROM translations WHERE locale = $1',
    [locale],
  );

  // Fall back to the base language (e.g. "en" from "en-GB")
  if (rows.length === 0 && locale.includes('-')) {
    const baseLang = locale.split('-')[0];
    rows = await dbAll(
      'SELECT key, value FROM translations WHERE locale LIKE $1',
      [`${baseLang}%`],
    );
  }

  // Final fallback to en-US
  if (rows.length === 0 && locale !== DEFAULT_LOCALE) {
    rows = await dbAll(
      'SELECT key, value FROM translations WHERE locale = $1',
      [DEFAULT_LOCALE],
    );
  }

  return rows.reduce(
    (acc: Record<string, string>, row: { key: string; value: string }) => {
      acc[row.key] = row.value;
      return acc;
    },
    {},
  );
}

/**
 * Get all available locales in the database.
 */
export async function getAvailableLocales(): Promise<string[]> {
  await ensureSchema();
  const rows = await dbAll('SELECT DISTINCT locale FROM translations');
  return rows.map((row: { locale: string }) => row.locale);
}
