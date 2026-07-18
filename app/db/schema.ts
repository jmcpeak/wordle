import { EN_US_TRANSLATIONS } from '@/i18n/enUsTranslations';
import { dbRun } from './connection';

const DEFAULT_LOCALE = 'en-US';

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
    CREATE TABLE IF NOT EXISTS partial_games (
      "userId" TEXT NOT NULL PRIMARY KEY,
      solution TEXT NOT NULL,
      guesses TEXT NOT NULL DEFAULT '[]',
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS translations (
      locale TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (locale, key)
    );
    CREATE TABLE IF NOT EXISTS game_history (
      id SERIAL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      word TEXT NOT NULL,
      won BOOLEAN NOT NULL,
      guesses INTEGER,
      "playedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS game_history_user_played_idx
      ON game_history ("userId", "playedAt" DESC);
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
