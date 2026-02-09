import type { Account, User } from 'next-auth';
import type { ThemeMode } from '@/store/themeStore';
import { dbAll, dbGet, dbRun, getSql } from '@/db/connection';
import { ensureSchema } from '@/db/schema';

// --- ADAPTER-LIKE FUNCTIONS ---
export async function upsertUser(user: User): Promise<User> {
  await ensureSchema();
  const existingUser = await dbGet(
    'SELECT * FROM users WHERE email = $1',
    [user.email],
  );
  if (existingUser) {
    return existingUser;
  }

  const newUserId = crypto.randomUUID();
  const newUser = { ...user, id: newUserId };

  await getSql().transaction((txn) => [
    txn`INSERT INTO users (id, name, email) VALUES (${newUser.id}, ${newUser.name}, ${newUser.email})`,
    txn`INSERT INTO stats ("userId") VALUES (${newUser.id})`,
    txn`INSERT INTO preferences ("userId") VALUES (${newUser.id})`,
  ]);

  return newUser;
}

export async function linkAccount(account: Account) {
  await ensureSchema();
  await dbRun(
    'INSERT INTO accounts ("userId", type, provider, "providerAccountId") VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
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
  await ensureSchema();
  const existingUser = await dbGet(
    'SELECT * FROM users WHERE id = $1',
    [userId],
  );
  if (existingUser) {
    // User row exists — make sure stats and preferences rows also exist
    await dbRun(
      'INSERT INTO stats ("userId") VALUES ($1) ON CONFLICT DO NOTHING',
      [userId],
    );
    await dbRun(
      'INSERT INTO preferences ("userId") VALUES ($1) ON CONFLICT DO NOTHING',
      [userId],
    );
    return;
  }
  // User row is missing — create user and associated rows in a transaction
  await getSql().transaction((txn) => [
    txn`INSERT INTO users (id, name, email) VALUES (${userId}, ${name}, ${email}) ON CONFLICT DO NOTHING`,
    txn`INSERT INTO stats ("userId") VALUES (${userId}) ON CONFLICT DO NOTHING`,
    txn`INSERT INTO preferences ("userId") VALUES (${userId}) ON CONFLICT DO NOTHING`,
  ]);
}

// --- APPLICATION-SPECIFIC FUNCTIONS ---
export async function getTheme(userId: string): Promise<ThemeMode> {
  await ensureSchema();
  const row = await dbGet(
    'SELECT theme FROM preferences WHERE "userId" = $1',
    [userId],
  );
  return row?.theme || 'system';
}

export async function setTheme(
  userId: string,
  theme: ThemeMode,
): Promise<void> {
  await ensureSchema();
  await dbRun(
    'INSERT INTO preferences ("userId", theme) VALUES ($1, $2) ON CONFLICT ("userId") DO UPDATE SET theme = excluded.theme',
    [userId, theme],
  );
}

export async function getStats(userId: string): Promise<{
  gamesWon: number;
  gamesLost: number;
  guessDistribution: Record<number, number>;
}> {
  await ensureSchema();
  const stats = await dbGet(
    'SELECT * FROM stats WHERE "userId" = $1',
    [userId],
  );
  const guessRows = await dbAll(
    'SELECT * FROM guess_distribution WHERE "userId" = $1',
    [userId],
  );
  const guessDistribution: Record<number, number> = {};
  for (const row of guessRows) {
    guessDistribution[row.guesses as number] = row.count as number;
  }
  return {
    gamesWon: stats?.gamesWon || 0,
    gamesLost: stats?.gamesLost || 0,
    guessDistribution,
  };
}

export async function addWin(userId: string, guesses: number): Promise<void> {
  await ensureSchema();
  await dbRun(
    'UPDATE stats SET "gamesWon" = "gamesWon" + 1 WHERE "userId" = $1',
    [userId],
  );
  await dbRun(
    'INSERT INTO guess_distribution ("userId", guesses, count) VALUES ($1, $2, 1) ON CONFLICT ("userId", guesses) DO UPDATE SET count = guess_distribution.count + 1',
    [userId, guesses],
  );
}

export async function addLoss(userId: string): Promise<void> {
  await ensureSchema();
  await dbRun(
    'UPDATE stats SET "gamesLost" = "gamesLost" + 1 WHERE "userId" = $1',
    [userId],
  );
}

export async function resetStats(userId: string): Promise<void> {
  await ensureSchema();
  await getSql().transaction((txn) => [
    txn`UPDATE stats SET "gamesWon" = 0, "gamesLost" = 0 WHERE "userId" = ${userId}`,
    txn`DELETE FROM guess_distribution WHERE "userId" = ${userId}`,
  ]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await ensureSchema();
  const user = await dbGet(
    'SELECT * FROM users WHERE email = $1',
    [email],
  );
  return user || null;
}
