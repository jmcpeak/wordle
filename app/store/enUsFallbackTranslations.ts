/**
 * en-US copy used when a key is missing from the DB (e.g. before migrate/seed).
 * Keep in sync with app/db/schema.ts EN_US_TRANSLATIONS for keys added in code.
 */
export const EN_US_FALLBACK_TRANSLATIONS: Record<string, string> = {
  'message.couldNotValidateWord':
    'Could not check that word. Check your connection and try again.',
  'dialog.wordLoadError.title': 'Could not load a new word',
  'dialog.wordLoadError.description':
    'We could not reach the server to pick today’s word. Check your connection and try again. A previous round’s word is never reused so play stays fair.',
  'dialog.wordLoadError.tryAgain': 'Try again',
};
