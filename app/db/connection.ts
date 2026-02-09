import sqlite3 from 'sqlite3';
import { DB_FILE } from '@/constants';

// --- Singleton Database Connection ---
let db: sqlite3.Database | null = null;

export function getDb(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    // If the connection exists, reuse it.
    if (db) {
      return resolve(db);
    }
    // Otherwise, create a new connection.
    const newDb = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        return reject(err);
      }
      newDb.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) {
          return reject(err);
        }
        db = newDb; // Store the connection for reuse.
        resolve(db);
      });
    });
  });
}

// --- Database Helper Functions ---
export function dbGet(
  db: sqlite3.Database,
  sql: string,
  params: any[] = [],
): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export function dbAll(
  db: sqlite3.Database,
  sql: string,
  params: any[] = [],
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export function dbRun(
  db: sqlite3.Database,
  sql: string,
  params: any[] = [],
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
