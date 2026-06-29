import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isRecognitionError,
  machineRecognitionSchema,
  mockProvider,
  recognizeMachine,
  RecognitionError,
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

test('recognizeMachine throws missing_image when imageUri is empty', async () => {
  await assert.rejects(
    () => recognizeMachine(''),
    (error: unknown) => {
      assert.ok(error instanceof RecognitionError);
      assert.equal(error.kind, 'missing_image');
      return true;
    },
  );
});

test('recognizeMachine returns a valid result for a non-empty imageUri', async () => {
  const result = await recognizeMachine('mock://image.jpg');
  assert.equal(result.machineName, 'Presse à cuisses inclinée');
  assert.equal(result.machineType, 'lower_body_machine');
  assert.ok(result.confidence > 0 && result.confidence <= 1);
  assert.ok(result.possibleExercises.length >= 1);
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
  assert.equal(result.needsConfirmation, true);
  assert.ok(result.uncertaintyReason !== null);
});

test('recognizeMachine rejects an invalid mock provider response', async () => {
  const badProvider: RecognitionProvider = {
    async recognize() {
      return Promise.resolve({ machineName: 123 });
    },
  };
  await assert.rejects(
    () => recognizeMachine('mock://image.jpg', { provider: badProvider }),
    (error: unknown) => {
      assert.ok(error instanceof RecognitionError);
      assert.equal(error.kind, 'invalid_response');
      return true;
    },
  );
});

test('recognizeMachine wraps provider errors as provider_error', async () => {
  const failingProvider: RecognitionProvider = {
    async recognize() {
      throw new Error('network down');
    },
  };
  await assert.rejects(
    () => recognizeMachine('mock://image.jpg', { provider: failingProvider }),
    (error: unknown) => {
      assert.ok(error instanceof RecognitionError);
      assert.equal(error.kind, 'provider_error');
      return true;
    },
  );
});

test('mockProvider refuses empty imageUri', async () => {
  await assert.rejects(() => mockProvider.recognize(''));
});

test('isRecognitionError narrows the type', () => {
  const err = new RecognitionError('missing_image', 'x');
  assert.equal(isRecognitionError(err), true);
  assert.equal(isRecognitionError(new Error('x')), false);
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