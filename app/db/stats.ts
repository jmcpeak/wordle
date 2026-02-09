import type { Account, User } from 'next-auth';
import type { ThemeMode } from '@/store/themeStore';
import { dbAll, dbGet, dbRun, getDb } from '@/db/connection';
import { seedTranslations } from '@/db/i18n';

async function initializeDb() {
  const db = await getDb();
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT NOT NULL PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER
    );
    CREATE TABLE IF NOT EXISTS accounts (
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      providerAccountId TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      PRIMARY KEY (provider, providerAccountId),
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS stats (
      userId TEXT NOT NULL PRIMARY KEY,
      gamesWon INTEGER NOT NULL DEFAULT 0,
      gamesLost INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS guess_distribution (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      guesses INTEGER NOT NULL,
      count INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS preferences (
      userId TEXT NOT NULL PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'system',
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
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
      await dbRun(db, trimmed);
    }
  }

  // Seed default translations after schema is ready
  await seedTranslations();
}

initializeDb().catch(console.error);

// --- ADAPTER-LIKE FUNCTIONS ---
export async function upsertUser(user: User): Promise<User> {
  const db = await getDb();
  const existingUser = await dbGet(db, 'SELECT * FROM users WHERE email = ?', [
    user.email,
  ]);
  if (existingUser) {
    return existingUser;
  }

  const newUserId = crypto.randomUUID();
  const newUser = { ...user, id: newUserId };

  // Use a transaction on the single connection.
  await dbRun(db, 'BEGIN TRANSACTION');
  try {
    await dbRun(db, 'INSERT INTO users (id, name, email) VALUES (?, ?, ?)', [
      newUser.id,
      newUser.name,
      newUser.email,
    ]);
    await dbRun(db, 'INSERT INTO stats (userId) VALUES (?)', [newUser.id]);
    await dbRun(db, 'INSERT INTO preferences (userId) VALUES (?)', [
      newUser.id,
    ]);
    await dbRun(db, 'COMMIT');
  } catch (e) {
    await dbRun(db, 'ROLLBACK');
    throw e;
  }
  return newUser;
}

export async function linkAccount(account: Account) {
  const db = await getDb();
  await dbRun(
    db,
    'INSERT OR IGNORE INTO accounts (userId, type, provider, providerAccountId) VALUES (?, ?, ?, ?)',
    [account.userId, account.type, account.provider, account.providerAccountId],
  );
}

// --- Ensure user and associated rows exist ---
// Handles the case where the DB was recreated but the JWT still carries the old userId.
export async function ensureUserExists(
  userId: string,
  name: string | null | undefined,
  email: string | null | undefined,
): Promise<void> {
  if (!email) return;
  const db = await getDb();
  const existingUser = await dbGet(db, 'SELECT * FROM users WHERE id = ?', [userId]);
  if (existingUser) {
    // User row exists — make sure stats and preferences rows also exist
    await dbRun(db, 'INSERT OR IGNORE INTO stats (userId) VALUES (?)', [userId]);
    await dbRun(db, 'INSERT OR IGNORE INTO preferences (userId) VALUES (?)', [userId]);
    return;
  }
  // User row is missing — create user and associated rows in a transaction
  await dbRun(db, 'BEGIN TRANSACTION');
  try {
    await dbRun(
      db,
      'INSERT OR IGNORE INTO users (id, name, email) VALUES (?, ?, ?)',
      [userId, name, email],
    );
    await dbRun(db, 'INSERT OR IGNORE INTO stats (userId) VALUES (?)', [userId]);
    await dbRun(db, 'INSERT OR IGNORE INTO preferences (userId) VALUES (?)', [userId]);
    await dbRun(db, 'COMMIT');
  } catch (e) {
    await dbRun(db, 'ROLLBACK');
    throw e;
  }
}

// --- APPLICATION-SPECIFIC FUNCTIONS ---
// All functions now use the single, shared connection and do NOT close it.
export async function getTheme(userId: string): Promise<ThemeMode> {
  const db = await getDb();
  const row = await dbGet(
    db,
    'SELECT theme FROM preferences WHERE userId = ?',
    [userId],
  );
  return row?.theme || 'system';
}

export async function setTheme(
  userId: string,
  theme: ThemeMode,
): Promise<void> {
  const db = await getDb();
  const sql =
    'INSERT INTO preferences (userId, theme) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET theme = excluded.theme';
  const params = [userId, theme];
  await dbRun(db, sql, params);
}

export async function getStats(userId: string): Promise<{
  gamesWon: number;
  gamesLost: number;
  guessDistribution: Record<number, number>;
}> {
  const db = await getDb();
  const stats = await dbGet(db, 'SELECT * FROM stats WHERE userId = ?', [
    userId,
  ]);
  const guessRows = await dbAll(
    db,
    'SELECT * FROM guess_distribution WHERE userId = ?',
    [userId],
  );
  const guessDistribution = guessRows.reduce(
    (acc, row) => ({ ...acc, [row.guesses]: row.count }),
    {},
  );
  return {
    gamesWon: stats?.gamesWon || 0,
    gamesLost: stats?.gamesLost || 0,
    guessDistribution,
  };
}

export async function addWin(userId: string, guesses: number): Promise<void> {
  const db = await getDb();
  await dbRun(db, 'UPDATE stats SET gamesWon = gamesWon + 1 WHERE userId = ?', [
    userId,
  ]);
  const row = await dbGet(
    db,
    'SELECT * FROM guess_distribution WHERE userId = ? AND guesses = ?',
    [userId, guesses],
  );
  if (row) {
    await dbRun(
      db,
      'UPDATE guess_distribution SET count = count + 1 WHERE userId = ? AND guesses = ?',
      [userId, guesses],
    );
  } else {
    await dbRun(
      db,
      'INSERT INTO guess_distribution (userId, guesses, count) VALUES (?, ?, 1)',
      [userId, guesses],
    );
  }
}

export async function addLoss(userId: string): Promise<void> {
  const db = await getDb();
  await dbRun(
    db,
    'UPDATE stats SET gamesLost = gamesLost + 1 WHERE userId = ?',
    [userId],
  );
}

export async function resetStats(userId: string): Promise<void> {
  const db = await getDb();
  await dbRun(db, 'BEGIN TRANSACTION');
  try {
    await dbRun(
      db,
      'UPDATE stats SET gamesWon = 0, gamesLost = 0 WHERE userId = ?',
      [userId],
    );
    await dbRun(
      db,
      'DELETE FROM guess_distribution WHERE userId = ?',
      [userId],
    );
    await dbRun(db, 'COMMIT');
  } catch (e) {
    await dbRun(db, 'ROLLBACK');
    throw e;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const user = await dbGet(db, 'SELECT * FROM users WHERE email = ?', [email]);
  return user || null;
}
