import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  machineRecognitionSchema,
  mockProvider,
  recognizeMachine,
} from './recognize';
import type { RecognitionProvider } from './mock-provider';
import { shouldBlockMachineValidation } from './validate-recognition';

test('machineRecognitionSchema accepts a valid mock result', () => {
  const parsed = machineRecognitionSchema.safeParse(mockValidResult());
  assert.ok(parsed.success, 'schema should accept valid mock result');
});

test('machineRecognitionSchema rejects invalid difficulty', () => {
  const bad = {
    ...mockValidResult(),
    possibleExercises: [{ ...mockExercise(), difficulty: 'expert' }],
  };
  const parsed = machineRecognitionSchema.safeParse(bad);
  assert.equal(parsed.success, false);
});

test('machineRecognitionSchema rejects confidence out of range', () => {
  const bad = { ...mockValidResult(), confidence: 1.5 };
  const parsed = machineRecognitionSchema.safeParse(bad);
  assert.equal(parsed.success, false);
});

test('machineRecognitionSchema accepts empty possibleExercises (non-machine objects)', () => {
  const nonMachine = {
    ...mockValidResult(),
    machineType: 'unknown' as const,
    possibleExercises: [],
    needsConfirmation: true,
  };
  const parsed = machineRecognitionSchema.safeParse(nonMachine);
  assert.ok(parsed.success, 'schema should allow zero exercises');
});

test('machineRecognitionSchema rejects a result missing isSportMachine', () => {
  const legacy: Record<string, unknown> = { ...mockValidResult() };
  delete legacy.isSportMachine;
  const parsed = machineRecognitionSchema.safeParse(legacy);
  assert.equal(parsed.success, false);
});

test('machineRecognitionSchema accepts isSportMachine false with empty exercises and muscles', () => {
  const nonMachine = {
    ...mockValidResult(),
    machineName: "Souris d'ordinateur",
    machineType: 'not_sport_equipment' as const,
    isSportMachine: false,
    primaryMuscles: [],
    secondaryMuscles: [],
    possibleExercises: [],
    needsConfirmation: true,
    uncertaintyReason: "Ce n'est pas une machine de sport.",
  };
  const parsed = machineRecognitionSchema.safeParse(nonMachine);
  assert.ok(parsed.success, 'schema should accept an honest non-machine');
});

test('recognizeMachine clears exercises and muscles for a non-machine result', async () => {
  const sloppyProvider: RecognitionProvider = {
    async recognize() {
      // A drifting provider says "not a machine" but still fills data.
      return Promise.resolve({
        ...mockValidResult(),
        isSportMachine: false,
        needsConfirmation: false,
      });
    },
  };
  const result = await recognizeMachine('mock://image.jpg', {
    provider: sloppyProvider,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.isSportMachine, false);
    assert.equal(result.data.needsConfirmation, true);
    assert.deepEqual(result.data.possibleExercises, []);
    assert.deepEqual(result.data.primaryMuscles, []);
    assert.deepEqual(result.data.secondaryMuscles, []);
    assert.ok(result.data.uncertaintyReason);
  }
});

test('shouldBlockMachineValidation blocks non-machines only', async () => {
  const machine = await recognizeMachine('mock://image.jpg');
  assert.equal(machine.ok, true);
  if (machine.ok) {
    assert.equal(machine.data.isSportMachine, true);
    assert.equal(shouldBlockMachineValidation(machine.data), false);
  }
  assert.equal(
    shouldBlockMachineValidation({
      ...mockValidResult(),
      isSportMachine: false,
    }),
    true,
  );
});

test('recognizeMachine returns missing_image when imageUri is empty', async () => {
  const result = await recognizeMachine('');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'missing_image');
  }
});

test('recognizeMachine returns a valid result for a non-empty imageUri', async () => {
  const result = await recognizeMachine('mock://image.jpg');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.machineName, 'Presse à cuisses inclinée');
    assert.equal(result.data.machineType, 'lower_body_machine');
    assert.ok(result.data.confidence > 0 && result.data.confidence <= 1);
    assert.ok(result.data.possibleExercises.length >= 1);
  }
});

test('recognizeMachine forces needsConfirmation when confidence < 0.6', async () => {
  const lowConfProvider: RecognitionProvider = {
    async recognize() {
      const low = {
        ...mockValidResult(),
        confidence: 0.4,
        needsConfirmation: false,
      };
      return Promise.resolve(low);
    },
  };
  const result = await recognizeMachine('mock://image.jpg', {
    provider: lowConfProvider,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.needsConfirmation, true);
    assert.ok(result.data.uncertaintyReason !== null);
  }
});

test('recognizeMachine returns invalid_response for an invalid provider response', async () => {
  const badProvider: RecognitionProvider = {
    async recognize() {
      return Promise.resolve({ machineName: 123 });
    },
  };
  const result = await recognizeMachine('mock://image.jpg', {
    provider: badProvider,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'invalid_response');
  }
});

test('recognizeMachine returns provider_error when the provider throws', async () => {
  const failingProvider: RecognitionProvider = {
    async recognize() {
      throw new Error('network down');
    },
  };
  const result = await recognizeMachine('mock://image.jpg', {
    provider: failingProvider,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'provider_error');
  }
});

test('mockProvider refuses empty imageUri', async () => {
  await assert.rejects(() => mockProvider.recognize(''));
});

test('recognizeMachine remote without base URL returns provider_error', async () => {
  const previousProvider = process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER;
  const previousRecognitionUrl =
    process.env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL;
  const previousUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER = 'remote';
  delete process.env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL;
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  try {
    const result = await recognizeMachine('file:///some-image.jpg');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'provider_error');
      assert.match(result.error.message, /EXPO_PUBLIC_RECOGNITION_API_BASE_URL/);
    }
  } finally {
    if (previousProvider !== undefined) {
      process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER = previousProvider;
    } else {
      delete process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER;
    }
    if (previousRecognitionUrl !== undefined) {
      process.env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL =
        previousRecognitionUrl;
    }
    if (previousUrl !== undefined) {
      process.env.EXPO_PUBLIC_API_BASE_URL = previousUrl;
    }
  }
});

test('recognizeMachine routes to the remote provider when config is remote', async () => {
  const previousProvider = process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER;
  const previousUrl = process.env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL;
  process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER = 'remote';
  process.env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL = 'http://localhost:3000';
  try {
    const result = await recognizeMachine('file:///photo.jpg');
    // In plain Node the remote path cannot read the photo
    // (expo-file-system is unavailable), so it must surface a typed
    // error — never the mock leg-press result. If routing regressed to
    // the mock provider, this would come back ok:true.
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'missing_image');
    }
  } finally {
    if (previousProvider !== undefined) {
      process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER = previousProvider;
    } else {
      delete process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER;
    }
    if (previousUrl !== undefined) {
      process.env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL = previousUrl;
    } else {
      delete process.env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL;
    }
  }
});

test('an injected provider wins over the remote env configuration', async () => {
  const previousProvider = process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER;
  process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER = 'remote';
  try {
    const result = await recognizeMachine('mock://image.jpg', {
      provider: mockProvider,
    });
    assert.equal(result.ok, true);
  } finally {
    if (previousProvider !== undefined) {
      process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER = previousProvider;
    } else {
      delete process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER;
    }
  }
});

function mockExercise() {
  return {
    name: 'Presse à cuisses classique',
    difficulty: 'débutant' as const,
    setup: 'Place les pieds sur la plateforme.',
    execution: 'Pousse la plateforme.',
    commonMistakes: ['Verrouiller les genoux'],
    safetyNotes: ['Garde le dos collé'],
  };
}

function mockValidResult() {
  return {
    machineName: 'Presse à cuisses inclinée',
    machineType: 'lower_body_machine' as const,
    isSportMachine: true,
    confidence: 0.91,
    description: 'Machine guidée pour les jambes.',
    primaryMuscles: ['quadriceps', 'fessiers'],
    secondaryMuscles: ['ischio-jambiers', 'mollets'],
    possibleExercises: [mockExercise()],
    alternativeNames: ['Leg press'],
    needsConfirmation: false,
    uncertaintyReason: null,
  };
}
