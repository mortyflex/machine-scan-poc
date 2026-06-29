export { initMachineScanDatabase, getDatabase } from './db';
export {
  deleteMachineScan,
  getMachineScanById,
  listSavedMachineScans,
  saveMachineScan,
  toMachineScanInput,
  toRecognitionResult,
} from './machine-scan-repository';
export { mapRowToMachineScan, generateId } from './mapping';
export type {
  MachineScanRow,
  SaveMachineScanInput,
  StorageError,
  StorageErrorKind,
  StorageResult,
} from './types';
