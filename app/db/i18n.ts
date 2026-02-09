import { dbAll, dbRun, getDb } from '@/db/connection';

const DEFAULT_LOCALE = 'en-US';

// All en-US translation seed data
const EN_US_TRANSLATIONS: Record<string, string> = {
  // Game
  'game.title': 'Wordle',
  'game.loading': 'Loading',
  'game.playAgain': 'Play Again',

  // Game messages
  'message.notEnoughLetters': 'Not enough letters',
  'message.alreadyGuessed': 'You already guessed that word',
  'message.notValidWord': 'Not a valid word',
  'message.youWon': 'You Won!',
  'message.gameOver': 'Game Over! The word was {solution}',
  'message.errorFetching': 'Error fetching word.',
  'message.noValidWord': 'Could not find a valid word. Please try again later.',

  // Statistics
  'stats.title': 'Statistics',
  'stats.played': 'Played',
  'stats.won': 'Won',
  'stats.lost': 'Lost',
  'stats.winPercent': 'Win %',
  'stats.guessDistribution': 'Guess Distribution',
  'stats.signInToView': 'Sign in to view your stats.',
  'stats.reset': 'Reset Statistics',
  'stats.resetConfirm': 'Are you sure you want to reset all your statistics? This cannot be undone.',
  'stats.resetCancel': 'Cancel',
  'stats.resetConfirmButton': 'Reset',

  // Authentication
  'auth.signIn': 'Sign In',
  'auth.signOut': 'Sign Out',
  'auth.signInWithGithub': 'Sign in with GitHub',
  'auth.or': 'or',
  'auth.username': 'Username',
  'auth.password': 'Password',

  // Theme
  'theme.lightMode': 'Light Mode',
  'theme.darkMode': 'Dark Mode',
  'theme.systemDefault': 'System Default',
  'theme.toggleTheme': 'toggle theme',

  // Keyboard
  'keyboard.enter': 'ENTER',
  'keyboard.backspace': 'BACKSPACE',

  // Metadata
  'metadata.title': 'Wordle Clone',
  'metadata.description': 'A Wordle clone built with Next.js and MUI',
};

/**
 * Seed the translations table with default en-US data.
 * Uses INSERT OR IGNORE so existing rows are not overwritten.
 */
export async function seedTranslations(): Promise<void> {
  const db = await getDb();
  for (const [key, value] of Object.entries(EN_US_TRANSLATIONS)) {
    await dbRun(
      db,
      'INSERT OR IGNORE INTO translations (locale, key, value) VALUES (?, ?, ?)',
      [DEFAULT_LOCALE, key, value],
    );
  }
}

/**
 * Get all translations for a given locale.
 * Falls back to en-US if the requested locale has no translations.
 */
export async function getTranslations(
  locale: string,
): Promise<Record<string, string>> {
  const db = await getDb();

  // Try the exact locale first
  let rows = await dbAll(
    db,
    'SELECT key, value FROM translations WHERE locale = ?',
    [locale],
  );

  // Fall back to the base language (e.g. "en" from "en-GB")
  if (rows.length === 0 && locale.includes('-')) {
    const baseLang = locale.split('-')[0];
    rows = await dbAll(
      db,
      'SELECT key, value FROM translations WHERE locale LIKE ?',
      [`${baseLang}%`],
    );
  }

  // Final fallback to en-US
  if (rows.length === 0 && locale !== DEFAULT_LOCALE) {
    rows = await dbAll(
      db,
      'SELECT key, value FROM translations WHERE locale = ?',
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
  const db = await getDb();
  const rows = await dbAll(
    db,
    'SELECT DISTINCT locale FROM translations',
    [],
  );
  return rows.map((row: { locale: string }) => row.locale);
}
