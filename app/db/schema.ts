import { dbRun } from './connection';

const DEFAULT_LOCALE = 'en-US';

// All en-US translation seed data
const EN_US_TRANSLATIONS: Record<string, string> = {
  // Game
  'game.title': 'Wordle',
  'game.navigation': 'Game controls',
  'game.loading': 'Loading',
  'game.playAgain': 'Play Again',
  'game.guessGrid': 'Guess grid',
  'game.status.correct': 'correct',
  'game.status.present': 'in wrong position',
  'game.status.absent': 'not in word',
  'game.status.empty': 'empty',
  'game.gridCell.filled': 'Row {row}, Letter {col}: {letter}, {status}',
  'game.gridCell.empty': 'Row {row}, Letter {col}: empty',

  // Game messages
  'message.notEnoughLetters': 'Not enough letters',
  'message.alreadyGuessed': 'You already guessed that word',
  'message.notValidWord': 'Not a valid word',
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
  'stats.resetConfirm':
    'Are you sure you want to reset all your statistics? This cannot be undone.',
  'stats.resetCancel': 'Cancel',
  'stats.resetConfirmButton': 'Reset',

  // Authentication
  'auth.signIn': 'Sign In To Wordle',
  'auth.signOut': 'Sign Out',
  'auth.signInWithGithub': 'Sign in with GitHub',
  'auth.signInWithGoogle': 'Sign in with Google',
  'auth.signInWithFacebook': 'Sign in with Facebook',
  'auth.or': 'or',
  'auth.username': 'Username',
  'auth.password': 'Password',

  // Theme
  'theme.lightMode': 'Light Mode',
  'theme.darkMode': 'Dark Mode',
  'theme.systemDefault': 'System Default',
  'theme.toggleTheme': 'toggle theme',
  'theme.switchToLight': 'Switch to light mode',
  'theme.switchToDark': 'Switch to dark mode',
  'theme.switchToSystem': 'Switch to system mode',

  // Dialog
  'dialog.close': 'Close dialog',

  // How to Play
  'howToPlay.title': 'How to Play',
  'howToPlay.tooltip': 'How to Play',
  'howToPlay.instruction': 'Guess the mystery 5 letter word!',
  'howToPlay.subInstruction':
    'After each guess, the letters will change colour to show how close you were to the correct word:',
  'howToPlay.legendAbsent': 'Grey - the letter is not in the word',
  'howToPlay.legendPresent':
    'Orange - the letter is in the word but in the wrong place',
  'howToPlay.legendCorrect': 'Green - the letter is correct',

  // Keyboard
  'keyboard.enter': 'ENTER',
  'keyboard.backspace': 'BACKSPACE',

  // Metadata
  'metadata.title': 'Wordle Clone',
  'metadata.description': 'A Wordle clone built with Next.js and MUI',
};

let initialized = false;

/**
 * Ensure all database tables exist and seed data is present.
 * Safe to call multiple times — only runs on first invocation.
 */
export async function ensureSchema(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT NOT NULL PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      "emailVerified" INTEGER
    );
    CREATE TABLE IF NOT EXISTS accounts (
      "userId" TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      PRIMARY KEY (provider, "providerAccountId"),
      FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS stats (
      "userId" TEXT NOT NULL PRIMARY KEY,
      "gamesWon" INTEGER NOT NULL DEFAULT 0,
      "gamesLost" INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS guess_distribution (
      id SERIAL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      guesses INTEGER NOT NULL,
      count INTEGER NOT NULL,
      UNIQUE ("userId", guesses),
      FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS preferences (
      "userId" TEXT NOT NULL PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'system',
      FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS translations (
      locale TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (locale, key)
    );
  `;

  for (const stmt of schema.split(';')) {
    const trimmed = stmt.trim();
    if (trimmed) {
      await dbRun(trimmed);
    }
  }

  // Seed default translations — inserts any missing keys (safe to re-run)
  for (const [key, value] of Object.entries(EN_US_TRANSLATIONS)) {
    await dbRun(
      'INSERT INTO translations (locale, key, value) VALUES ($1, $2, $3) ON CONFLICT (locale, key) DO UPDATE SET value = $3',
      [DEFAULT_LOCALE, key, value],
    );
  }
}
