import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { StorageResult } from './types';

const DATABASE_NAME = 'machine-scan.db';

const SCHEMA = `
PRAGMA journal_mode = 'wal';
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS machine_scans (
  id TEXT PRIMARY KEY NOT NULL,
  imageUri TEXT NOT NULL,
  cutoutUri TEXT,
  machineName TEXT NOT NULL,
  machineType TEXT NOT NULL,
  confidence REAL NOT NULL,
  description TEXT NOT NULL,
  primaryMuscles TEXT NOT NULL,
  secondaryMuscles TEXT NOT NULL,
  possibleExercises TEXT NOT NULL,
  alternativeNames TEXT NOT NULL,
  needsConfirmation INTEGER NOT NULL,
  uncertaintyReason TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_machine_scans_createdAt
  ON machine_scans (createdAt DESC);
`;

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<StorageResult<void>> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await openDatabaseAsync(DATABASE_NAME);
  }
  return dbInstance;
}

export function initMachineScanDatabase(): Promise<StorageResult<void>> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const db = await getDatabase();
      await db.execAsync(SCHEMA);
      await migrateAddCutoutUriColumn(db);
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: 'database_error',
          message: "L'initialisation de la base locale a échoué.",
          cause: error,
        },
      };
    }
  })();
  return initPromise;
}

/**
 * Idempotent migration: databases created before Phase 6.6 lack the nullable
 * `cutoutUri` column. Older rows stay valid (cutoutUri = NULL).
 */
async function migrateAddCutoutUriColumn(db: SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(machine_scans)`,
  );
  const hasCutoutUri = columns.some((column) => column.name === 'cutoutUri');
  if (!hasCutoutUri) {
    await db.execAsync(`ALTER TABLE machine_scans ADD COLUMN cutoutUri TEXT`);
  }
}
