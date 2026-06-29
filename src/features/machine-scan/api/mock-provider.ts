import type { MachineRecognitionResult } from '@/features/machine-scan/types';

export type RecognitionProvider = {
  recognize(imageUri: string): Promise<unknown>;
};

const MOCK_LATENCY_MS = 600;

const mockResult: MachineRecognitionResult = {
  machineName: 'Presse à cuisses inclinée',
  machineType: 'lower_body_machine',
  confidence: 0.91,
  description:
    "Machine guidée permettant de travailler principalement les quadriceps, les fessiers et les ischio-jambiers avec un mouvement de poussée des jambes.",
  primaryMuscles: ['quadriceps', 'fessiers'],
  secondaryMuscles: ['ischio-jambiers', 'mollets'],
  possibleExercises: [
    {
      name: 'Presse à cuisses classique',
      difficulty: 'débutant',
      setup:
        "Place le dos contre le dossier et les pieds largeur épaules sur la plateforme.",
      execution:
        "Déverrouille la sécurité, descends lentement jusqu'à une flexion contrôlée, puis pousse la plateforme sans verrouiller brutalement les genoux.",
      commonMistakes: [
        'Décoller le bassin',
        'Verrouiller les genoux',
        'Descendre trop bas sans contrôle',
      ],
      safetyNotes: [
        'Garde le dos collé au dossier',
        'Commence avec une charge modérée',
        'Contrôle la descente',
      ],
    },
    {
      name: 'Presse pieds hauts',
      difficulty: 'intermédiaire',
      setup: 'Place les pieds légèrement plus haut sur la plateforme.',
      execution:
        'Effectue le même mouvement de poussée en gardant une trajectoire contrôlée.',
      commonMistakes: [
        'Arrondir le bas du dos',
        'Perdre le contact avec le dossier',
      ],
      safetyNotes: [
        "Réduis l'amplitude si le bassin se décolle",
        'Ne force pas une profondeur inconfortable',
      ],
    },
  ],
  alternativeNames: ['Leg press', 'Presse inclinée'],
  needsConfirmation: false,
  uncertaintyReason: null,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockProvider: RecognitionProvider = {
  async recognize(imageUri: string): Promise<unknown> {
    if (!imageUri || imageUri.trim().length === 0) {
      throw new Error('imageUri manquant');
    }
    await delay(MOCK_LATENCY_MS);
    return structuredClone(mockResult);
  },
};