import type {
  MachineExercise,
  MachineRecognitionResult,
  MachineScan,
  MachineType,
} from '@/features/machine-scan/types';

import type {
  MachineScanRow,
  SaveMachineScanInput,
} from './types';

export function toMachineScanInput(
  data: MachineRecognitionResult,
  imageUri: string,
): SaveMachineScanInput {
  return {
    imageUri,
    machineName: data.machineName,
    machineType: data.machineType,
    confidence: data.confidence,
    description: data.description,
    primaryMuscles: data.primaryMuscles,
    secondaryMuscles: data.secondaryMuscles,
    possibleExercises: data.possibleExercises,
    alternativeNames: data.alternativeNames,
    needsConfirmation: data.needsConfirmation,
    uncertaintyReason: data.uncertaintyReason,
  };
}

export function toRecognitionResult(
  scan: MachineScan,
): MachineRecognitionResult {
  return {
    machineName: scan.machineName,
    machineType: scan.machineType,
    confidence: scan.confidence,
    description: scan.description,
    primaryMuscles: scan.primaryMuscles,
    secondaryMuscles: scan.secondaryMuscles,
    possibleExercises: scan.possibleExercises,
    alternativeNames: scan.alternativeNames,
    needsConfirmation: scan.needsConfirmation,
    uncertaintyReason: scan.uncertaintyReason,
  };
}

export function mapRowToMachineScan(row: MachineScanRow): MachineScan {
  return {
    id: row.id,
    imageUri: row.imageUri,
    machineName: row.machineName,
    machineType: row.machineType as MachineType,
    confidence: row.confidence,
    description: row.description,
    primaryMuscles: safeParseStringArray(row.primaryMuscles),
    secondaryMuscles: safeParseStringArray(row.secondaryMuscles),
    possibleExercises: safeParseExercises(row.possibleExercises),
    alternativeNames: safeParseStringArray(row.alternativeNames),
    needsConfirmation: Boolean(row.needsConfirmation),
    uncertaintyReason: row.uncertaintyReason,
    createdAt: row.createdAt,
  };
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeParseStringArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((value) => String(value));
  } catch {
    return [];
  }
}

function safeParseExercises(raw: string): MachineExercise[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMachineExercise);
  } catch {
    return [];
  }
}

function isMachineExercise(value: unknown): value is MachineExercise {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === 'string' &&
    typeof record.difficulty === 'string' &&
    typeof record.setup === 'string' &&
    typeof record.execution === 'string' &&
    Array.isArray(record.commonMistakes) &&
    Array.isArray(record.safetyNotes)
  );
}
