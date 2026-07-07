export type ExerciseDifficulty = 'débutant' | 'intermédiaire' | 'avancé';

export type MachineType =
  | 'lower_body_machine'
  | 'upper_body_machine'
  | 'cable_machine'
  | 'free_weight_station'
  | 'cardio_machine'
  | 'unknown'
  | 'not_sport_equipment';

export type MachineExercise = {
  name: string;
  difficulty: ExerciseDifficulty;
  setup: string;
  execution: string;
  commonMistakes: string[];
  safetyNotes: string[];
};

export type MachineRecognitionResult = {
  machineName: string;
  machineType: MachineType;
  /**
   * Phase 7.3: false when the photo shows an object that is not usable
   * gym equipment (mouse, chair, phone…). Such results can never be
   * validated or saved. Not persisted: saved scans are machines only,
   * so the storage mapping restores `true` for every saved record.
   */
  isSportMachine: boolean;
  confidence: number;
  description: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  possibleExercises: MachineExercise[];
  alternativeNames: string[];
  needsConfirmation: boolean;
  uncertaintyReason: string | null;
};

export type MachineScan = {
  id: string;
  imageUri: string;
  /** Local URI of the transparent object cutout (PNG/WebP), when available. */
  cutoutUri?: string;
  machineName: string;
  machineType: MachineType;
  confidence: number;
  description: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  possibleExercises: MachineExercise[];
  alternativeNames: string[];
  needsConfirmation: boolean;
  uncertaintyReason: string | null;
  createdAt: string;
};