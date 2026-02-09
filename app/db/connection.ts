import { neon } from '@neondatabase/serverless';

type NeonSql = ReturnType<typeof neon>;

/**
 * Lazily initialized Neon query function.
 * Deferred so that module evaluation during `next build` doesn't throw
 * when DATABASE_URL isn't yet available in the build environment.
 */
let _sql: NeonSql | null = null;

export function getSql(): NeonSql {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// --- Database Helper Functions (parameterized queries via $1, $2, ...) ---

/**
 * Run a parameterized query and return the resulting rows.
 */
async function query(
  queryStr: string,
  params: unknown[] = [],
): Promise<Record<string, unknown>[]> {
  return (await getSql().query(queryStr, params)) as Record<string, unknown>[];
}

/**
 * Execute a query and return the first row, or null if no rows.
 */
export async function dbGet<T = Record<string, unknown>>(
  queryStr: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query(queryStr, params);
  return (rows[0] as T) ?? null;
}

/**
 * Execute a query and return all rows.
 */
export async function dbAll<T = Record<string, unknown>>(
  queryStr: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await query(queryStr, params)) as unknown as T[];
}

/**
 * Execute a query that doesn't return rows (INSERT, UPDATE, DELETE, DDL).
 */
export async function dbRun(
  queryStr: string,
  params: unknown[] = [],
): Promise<void> {
  await query(queryStr, params);
}
