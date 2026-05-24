import type { Account, User } from 'next-auth';
import { dbAll, dbGet, dbRun, getSql } from '@/db/connection';
import type { ThemeMode } from '@/store/themeStore';

// --- ADAPTER-LIKE FUNCTIONS ---
export async function upsertUser(user: User): Promise<User> {
  const existingUser = await dbGet<User>(
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
  const existingUser = await dbGet<User>('SELECT * FROM users WHERE id = $1', [
    userId,
  ]);
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
  const row = await dbGet<{ theme: ThemeMode }>(
    'SELECT theme FROM preferences WHERE "userId" = $1',
    [userId],
  );
  return row?.theme || 'system';
}

export async function setTheme(
  userId: string,
  theme: ThemeMode,
): Promise<void> {
  await dbRun(
    'INSERT INTO preferences ("userId", theme) VALUES ($1, $2) ON CONFLICT ("userId") DO UPDATE SET theme = excluded.theme',
    [userId, theme],
  );
}

export type RecentGameRow = {
  id: number;
  word: string;
  won: boolean;
  guesses: number;
};

const RECENT_GAMES_LIMIT = 3;

export async function getStats(userId: string): Promise<{
  gamesWon: number;
  gamesLost: number;
  guessDistribution: Record<number, number>;
  recentGames: RecentGameRow[];
}> {
  const stats = await dbGet<{ gamesWon: number; gamesLost: number }>(
    'SELECT * FROM stats WHERE "userId" = $1',
    [userId],
  );
  const guessRows = await dbAll<{ guesses: number; count: number }>(
    'SELECT * FROM guess_distribution WHERE "userId" = $1',
    [userId],
  );
  const guessDistribution: Record<number, number> = {};
  for (const row of guessRows) {
    guessDistribution[row.guesses] = row.count;
  }

  let recentGames: RecentGameRow[] = [];
  try {
    const historyRows = await dbAll<{
      id: number;
      word: string;
      won: boolean;
      guesses: number | null;
    }>(
      'SELECT id, word, won, guesses FROM game_history WHERE "userId" = $1 ORDER BY "playedAt" DESC LIMIT $2',
      [userId, RECENT_GAMES_LIMIT],
    );
    recentGames = historyRows.map((row) => ({
      id: row.id,
      word: row.word,
      won: row.won,
      guesses: row.guesses ?? 0,
    }));
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code !== '42P01') throw err;
  }

  return {
    gamesWon: stats?.gamesWon || 0,
    gamesLost: stats?.gamesLost || 0,
    guessDistribution,
    recentGames,
  };
}

async function recordGameHistory(
  userId: string,
  word: string,
  won: boolean,
  guesses: number,
): Promise<void> {
  try {
    await dbRun(
      'INSERT INTO game_history ("userId", word, won, guesses) VALUES ($1, $2, $3, $4)',
      [userId, word, won, guesses],
    );
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === '42P01') return;
    throw err;
  }
}

export async function addWin(
  userId: string,
  guesses: number,
  word: string,
): Promise<void> {
  await dbRun(
    'UPDATE stats SET "gamesWon" = "gamesWon" + 1 WHERE "userId" = $1',
    [userId],
  );
  await dbRun(
    'INSERT INTO guess_distribution ("userId", guesses, count) VALUES ($1, $2, 1) ON CONFLICT ("userId", guesses) DO UPDATE SET count = guess_distribution.count + 1',
    [userId, guesses],
  );
  await recordGameHistory(userId, word, true, guesses);
}

export async function addLoss(userId: string, word: string): Promise<void> {
  await dbRun(
    'UPDATE stats SET "gamesLost" = "gamesLost" + 1 WHERE "userId" = $1',
    [userId],
  );
  await recordGameHistory(userId, word, false, 0);
}

export async function resetStats(userId: string): Promise<void> {
  await getSql().transaction((txn) => [
    txn`UPDATE stats SET "gamesWon" = 0, "gamesLost" = 0 WHERE "userId" = ${userId}`,
    txn`DELETE FROM guess_distribution WHERE "userId" = ${userId}`,
    txn`DELETE FROM game_history WHERE "userId" = ${userId}`,
  ]);
}

// --- PARTIAL GAME FUNCTIONS ---
export type PartialGame = { solution: string; guesses: string[] };

export async function getPartialGame(
  userId: string,
): Promise<PartialGame | null> {
  try {
    const row = await dbGet<{ solution: string; guesses: string }>(
      'SELECT solution, guesses FROM partial_games WHERE "userId" = $1',
      [userId],
    );
    if (!row) return null;
    return { solution: row.solution, guesses: JSON.parse(row.guesses) };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === '42P01') return null;
    throw err;
  }
}

export async function savePartialGame(
  userId: string,
  solution: string,
  guesses: string[],
): Promise<void> {
  try {
    await dbRun(
      'INSERT INTO partial_games ("userId", solution, guesses, "updatedAt") VALUES ($1, $2, $3, NOW()) ON CONFLICT ("userId") DO UPDATE SET solution = excluded.solution, guesses = excluded.guesses, "updatedAt" = NOW()',
      [userId, solution, JSON.stringify(guesses)],
    );
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === '42P01') return;
    throw err;
  }
}

export async function deletePartialGame(userId: string): Promise<void> {
  try {
    await dbRun('DELETE FROM partial_games WHERE "userId" = $1', [userId]);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === '42P01') return;
    throw err;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await dbGet<User>('SELECT * FROM users WHERE email = $1', [
    email,
  ]);
  return user || null;
}
