/**
 * en-US copy used when a key is missing from the DB (e.g. before migrate/seed).
 * Keep in sync with app/db/schema.ts EN_US_TRANSLATIONS for keys added in code.
 */
export const EN_US_FALLBACK_TRANSLATIONS: Record<string, string> = {
  'message.couldNotValidateWord':
    'Could not check that word. Check your connection and try again.',
  'message.retryValidationAria': 'Retry validating your guess',
  'dialog.wordLoadError.title': 'Could not load a new word',
  'dialog.wordLoadError.description':
    'We could not reach the server to pick today’s word. Check your connection and try again. A previous round’s word is never reused so play stays fair.',
  'dialog.wordLoadError.tryAgain': 'Try again',
  'game.keyboard.region': 'On-screen keyboard',
  'game.keyboard.ariaBackspace': 'Backspace',
  'game.keyboard.ariaEnter': 'Enter',
  'game.keyboard.ariaKeyLetter': 'Key {letter}',
  'game.keyboard.ariaPlaceholder': 'Placeholder',
  'message.hasPlaceholders': 'Replace placeholders with letters',
  'game.status.correct': 'correct',
  'game.status.present': 'in wrong position',
  'game.status.absent': 'not in word',
  'game.status.empty': 'empty',
  'game.status.revealed': 'revealed answer',
  'game.lossReveal.the': 'THE',
  'game.lossReveal.word': 'WORD',
  'game.lossReveal.was': 'WAS',
  'game.errorBoundary.title': 'Something went wrong',
  'game.errorBoundary.description':
    'An unexpected error occurred. Please reload the page.',
  'game.errorBoundary.reload': 'Reload',
  'build.versionLabel': 'Build',
};
