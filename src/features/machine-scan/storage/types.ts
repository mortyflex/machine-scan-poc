import type { MachineScan } from '@/features/machine-scan/types';

export type StorageErrorKind = 'database_error' | 'not_found' | 'invalid_input';

export type StorageError = {
  kind: StorageErrorKind;
  message: string;
  cause?: unknown;
};

export type StorageResult<TData> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      error: StorageError;
    };

export type SaveMachineScanInput = Omit<MachineScan, 'id' | 'createdAt'>;

export type MachineScanRow = {
  id: string;
  imageUri: string;
  machineName: string;
  machineType: string;
  confidence: number;
  description: string;
  primaryMuscles: string;
  secondaryMuscles: string;
  possibleExercises: string;
  alternativeNames: string;
  needsConfirmation: number;
  uncertaintyReason: string | null;
  createdAt: string;
};

export type {
  MachineExercise,
  MachineRecognitionResult,
  MachineScan,
  MachineType,
} from '@/features/machine-scan/types';
