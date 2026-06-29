import type { MachineScan } from '@/features/machine-scan/types';

import { getDatabase } from './db';
import { generateId, mapRowToMachineScan } from './mapping';
import { persistImage } from './image-persistence';
import type {
  MachineScanRow,
  SaveMachineScanInput,
  StorageError,
  StorageResult,
} from './types';

function toStorageError(error: unknown): StorageError {
  return {
    kind: 'database_error',
    message: "L'accès à la base locale a échoué.",
    cause: error,
  };
}

export async function saveMachineScan(
  input: SaveMachineScanInput,
): Promise<StorageResult<MachineScan>> {
  if (!input?.imageUri || !input.machineName) {
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'Données de sauvegarde incomplètes.',
      },
    };
  }

  const id = generateId();
  const createdAt = new Date().toISOString();

  try {
    const persistedUri = await persistImage(input.imageUri, id);
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO machine_scans (
        id, imageUri, machineName, machineType, confidence, description,
        primaryMuscles, secondaryMuscles, possibleExercises, alternativeNames,
        needsConfirmation, uncertaintyReason, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        persistedUri,
        input.machineName,
        input.machineType,
        input.confidence,
        input.description,
        JSON.stringify(input.primaryMuscles),
        JSON.stringify(input.secondaryMuscles),
        JSON.stringify(input.possibleExercises),
        JSON.stringify(input.alternativeNames),
        input.needsConfirmation ? 1 : 0,
        input.uncertaintyReason,
        createdAt,
      ],
    );
    return {
      ok: true,
      data: {
        id,
        imageUri: persistedUri,
        machineName: input.machineName,
        machineType: input.machineType,
        confidence: input.confidence,
        description: input.description,
        primaryMuscles: input.primaryMuscles,
        secondaryMuscles: input.secondaryMuscles,
        possibleExercises: input.possibleExercises,
        alternativeNames: input.alternativeNames,
        needsConfirmation: input.needsConfirmation,
        uncertaintyReason: input.uncertaintyReason,
        createdAt,
      },
    };
  } catch (error) {
    return { ok: false, error: toStorageError(error) };
  }
}

export async function listSavedMachineScans(): Promise<
  StorageResult<MachineScan[]>
> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MachineScanRow>(
      `SELECT * FROM machine_scans ORDER BY createdAt DESC`,
    );
    return { ok: true, data: rows.map(mapRowToMachineScan) };
  } catch (error) {
    return { ok: false, error: toStorageError(error) };
  }
}

export async function getMachineScanById(
  id: string,
): Promise<StorageResult<MachineScan>> {
  if (!id) {
    return {
      ok: false,
      error: { kind: 'invalid_input', message: 'Identifiant manquant.' },
    };
  }
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<MachineScanRow>(
      `SELECT * FROM machine_scans WHERE id = ?`,
      [id],
    );
    if (!row) {
      return {
        ok: false,
        error: {
          kind: 'not_found',
          message: 'Machine introuvable.',
        },
      };
    }
    return { ok: true, data: mapRowToMachineScan(row) };
  } catch (error) {
    return { ok: false, error: toStorageError(error) };
  }
}

export async function deleteMachineScan(
  id: string,
): Promise<StorageResult<void>> {
  if (!id) {
    return {
      ok: false,
      error: { kind: 'invalid_input', message: 'Identifiant manquant.' },
    };
  }
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM machine_scans WHERE id = ?`, [id]);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toStorageError(error) };
  }
}

export { initMachineScanDatabase } from './db';
export { toMachineScanInput, toRecognitionResult } from './mapping';
export type {
  MachineScan,
  SaveMachineScanInput,
  StorageErrorKind,
  StorageResult,
} from './types';
