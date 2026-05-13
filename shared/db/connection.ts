import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

const dbPath = process.env.DB_PATH ?? './altplayer.sqlite';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('temp_store = MEMORY');
// Bound ANALYZE so it stays sub-second on large tables; gives the
// planner enough stats to pick the right indexes for the facet queries.
sqlite.pragma('analysis_limit = 1000');
try {
  sqlite.exec('ANALYZE');
} catch {
  // sqlite_stat tables not present yet (fresh DB pre-migration); harmless.
}

export const db = drizzle(sqlite, { schema });
export { sqlite };

export function runMigrations(): void {
  const folder = process.env.MIGRATIONS_DIR ?? path.resolve(process.cwd(), 'migrations');
  migrate(db, { migrationsFolder: folder });
}
