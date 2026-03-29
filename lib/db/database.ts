import * as SQLite from 'expo-sqlite'

import { DB_SCHEMA_SQL } from '@/lib/db/schema'
import { DB_SEED_SQL } from '@/lib/db/seed'

const DB_NAME = 'insulinapp.db'
const DB_SCHEMA_VERSION = 1

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null
let initPromise: Promise<void> | null = null

export async function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME)
  return await dbPromise
}

export async function initDb() {
  if (initPromise) return await initPromise

  initPromise = (async () => {
    const db = await getDb()

    await db.execAsync('PRAGMA foreign_keys = ON;')

    const current = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;')
    const currentVersion = current?.user_version ?? 0
    if (currentVersion < DB_SCHEMA_VERSION) {
      const statements = extractSqlStatements({ sql: DB_SCHEMA_SQL })
      for (const statement of statements) await db.execAsync(statement)
      await db.execAsync(`PRAGMA user_version = ${DB_SCHEMA_VERSION};`)
    }

    // Semilla base para pruebas de progreso; es idempotente (INSERT OR IGNORE).
    const seedStatements = extractSqlStatements({ sql: DB_SEED_SQL })
    for (const statement of seedStatements) await db.execAsync(statement)
  })()

  return await initPromise
}

function extractSqlStatements({ sql }: { sql: string }) {
  const withoutLineComments = sql
    .split('\n')
    .map(line => line.replace(/\\s*--.*$/, ''))
    .join('\n')

  return withoutLineComments
    .split(';')
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .map(statement => `${statement};`)
}

