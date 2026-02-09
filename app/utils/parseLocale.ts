const DEFAULT_LOCALE = 'en-US';

/**
 * Parse the Accept-Language header and return the best matching locale.
 *
 * Examples:
 *   "en-US,en;q=0.9,fr;q=0.8"  -> "en-US"
 *   "fr-FR,fr;q=0.9"           -> "fr-FR"
 *   ""                          -> "en-US"
 *   undefined                   -> "en-US"
 */
export function parseAcceptLanguage(header: string | null | undefined): string {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  // Parse entries like "en-US,en;q=0.9,fr;q=0.8"
  const entries = header
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(';');
      const locale = parts[0].trim();
      const quality = parts[1]
        ? Number.parseFloat(parts[1].replace('q=', '').trim())
        : 1.0;
      return { locale, quality };
    })
    .filter((entry) => entry.locale.length > 0)
    .sort((a, b) => b.quality - a.quality);

  if (entries.length === 0) {
    return DEFAULT_LOCALE;
  }

  // Return the highest-quality locale, normalizing the tag
  // e.g. "en-us" -> "en-US", "fr" -> "fr"
  return normalizeLocale(entries[0].locale);
}

/**
 * Normalize a locale tag to standard BCP-47 form.
 * "en-us" -> "en-US", "fr-fr" -> "fr-FR", "en" -> "en"
 */
function normalizeLocale(locale: string): string {
  const parts = locale.split('-');
  if (parts.length === 1) {
    return parts[0].toLowerCase();
  }
  return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
}
