export type ExerciseDifficulty = 'débutant' | 'intermédiaire' | 'avancé';

export type MachineType =
  | 'lower_body_machine'
  | 'upper_body_machine'
  | 'cable_machine'
  | 'free_weight_station'
  | 'cardio_machine'
  | 'unknown';

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