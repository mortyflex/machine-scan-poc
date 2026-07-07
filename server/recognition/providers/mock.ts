import type { MachineRecognitionRaw } from '../schema';
import type { RecognitionRequest, ServerRecognitionResult } from '../types';

/**
 * Server-side mock provider: same stable result as the mobile mock, so
 * `RECOGNITION_PROVIDER=mock` lets the whole remote pipeline be exercised
 * end-to-end (mobile → HTTP → validation) without a Gemini key.
 */
const mockResult: MachineRecognitionRaw = {
  machineName: 'Presse à cuisses inclinée',
  machineType: 'lower_body_machine',
  isSportMachine: true,
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
  ],
  alternativeNames: ['Leg press', 'Presse inclinée'],
  needsConfirmation: false,
  uncertaintyReason: null,
};

export async function mockRecognition(
  _request: RecognitionRequest,
): Promise<ServerRecognitionResult> {
  return {
    ok: true,
    data: structuredClone(mockResult),
  };
}
