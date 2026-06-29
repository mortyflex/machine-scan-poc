import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  machineRecognitionSchema,
  mockProvider,
  recognizeMachine,
} from './recognize';
import type { RecognitionProvider } from './mock-provider';

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

test('machineRecognitionSchema rejects empty possibleExercises', () => {
  const bad = { ...mockValidResult(), possibleExercises: [] };
  const parsed = machineRecognitionSchema.safeParse(bad);
  assert.equal(parsed.success, false);
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
