import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  generateId,
  mapRowToMachineScan,
  toMachineScanInput,
  toRecognitionResult,
} from './mapping';
import type { MachineScanRow } from './types';
import type {
  MachineExercise,
  MachineRecognitionResult,
} from '@/features/machine-scan/types';

const exercise: MachineExercise = {
  name: 'Presse à cuisses classique',
  difficulty: 'débutant',
  setup: 'Place les pieds sur la plateforme.',
  execution: 'Pousse la plateforme.',
  commonMistakes: ['Verrouiller les genoux'],
  safetyNotes: ['Garde le dos collé'],
};

const recognition: MachineRecognitionResult = {
  machineName: 'Presse à cuisses inclinée',
  machineType: 'lower_body_machine',
  isSportMachine: true,
  confidence: 0.91,
  description: 'Machine guidée pour les jambes.',
  primaryMuscles: ['quadriceps', 'fessiers'],
  secondaryMuscles: ['ischio-jambiers'],
  possibleExercises: [exercise],
  alternativeNames: ['Leg press'],
  needsConfirmation: false,
  uncertaintyReason: null,
};

function validRow(overrides: Partial<MachineScanRow> = {}): MachineScanRow {
  return {
    id: 'abc',
    imageUri: 'file:///scan.jpg',
    machineName: 'Presse à cuisses inclinée',
    machineType: 'lower_body_machine',
    confidence: 0.91,
    description: 'Machine guidée pour les jambes.',
    primaryMuscles: JSON.stringify(['quadriceps', 'fessiers']),
    secondaryMuscles: JSON.stringify(['ischio-jambiers']),
    possibleExercises: JSON.stringify([exercise]),
    alternativeNames: JSON.stringify(['Leg press']),
    needsConfirmation: 0,
    uncertaintyReason: null,
    createdAt: '2026-06-29T10:00:00.000Z',
    ...overrides,
  };
}

test('mapRowToMachineScan parses a valid row', () => {
  const scan = mapRowToMachineScan(validRow());
  assert.equal(scan.id, 'abc');
  assert.equal(scan.machineName, 'Presse à cuisses inclinée');
  assert.equal(scan.confidence, 0.91);
  assert.deepEqual(scan.primaryMuscles, ['quadriceps', 'fessiers']);
  assert.deepEqual(scan.secondaryMuscles, ['ischio-jambiers']);
  assert.equal(scan.possibleExercises.length, 1);
  assert.equal(scan.possibleExercises[0].name, exercise.name);
  assert.equal(scan.needsConfirmation, false);
  assert.equal(scan.uncertaintyReason, null);
});

test('mapRowToMachineScan converts needsConfirmation integer to boolean', () => {
  const confirmed = mapRowToMachineScan(validRow({ needsConfirmation: 1 }));
  assert.equal(confirmed.needsConfirmation, true);
  const unconfirmed = mapRowToMachineScan(validRow({ needsConfirmation: 0 }));
  assert.equal(unconfirmed.needsConfirmation, false);
});

test('mapRowToMachineScan keeps a non-null uncertaintyReason', () => {
  const scan = mapRowToMachineScan(
    validRow({
      needsConfirmation: 1,
      uncertaintyReason: 'Image floue',
    }),
  );
  assert.equal(scan.uncertaintyReason, 'Image floue');
});

test('mapRowToMachineScan is resilient to corrupted JSON arrays', () => {
  const scan = mapRowToMachineScan(
    validRow({
      primaryMuscles: '{not valid json',
      possibleExercises: 'also broken',
    }),
  );
  assert.deepEqual(scan.primaryMuscles, []);
  assert.deepEqual(scan.possibleExercises, []);
});

test('mapRowToMachineScan preserves cutoutUri when present', () => {
  const scan = mapRowToMachineScan(
    validRow({ cutoutUri: 'file:///cutouts/machine-cutout-1.png' }),
  );
  assert.equal(scan.cutoutUri, 'file:///cutouts/machine-cutout-1.png');
});

test('mapRowToMachineScan maps a missing or null cutoutUri to undefined', () => {
  const withoutColumn = mapRowToMachineScan(validRow());
  assert.equal(withoutColumn.cutoutUri, undefined);
  const withNull = mapRowToMachineScan(validRow({ cutoutUri: null }));
  assert.equal(withNull.cutoutUri, undefined);
});

test('toMachineScanInput builds the storage input from a recognition result', () => {
  const input = toMachineScanInput(recognition, 'file:///scan.jpg');
  assert.equal(input.imageUri, 'file:///scan.jpg');
  assert.equal(input.machineName, recognition.machineName);
  assert.equal(input.machineType, recognition.machineType);
  assert.equal(input.confidence, recognition.confidence);
  assert.equal(input.needsConfirmation, recognition.needsConfirmation);
  assert.equal(input.uncertaintyReason, recognition.uncertaintyReason);
  assert.deepEqual(input.primaryMuscles, recognition.primaryMuscles);
  assert.deepEqual(input.possibleExercises, recognition.possibleExercises);
});

test('toMachineScanInput preserves an optional cutoutUri', () => {
  const withoutCutout = toMachineScanInput(recognition, 'file:///scan.jpg');
  assert.equal(withoutCutout.cutoutUri, undefined);
  const withCutout = toMachineScanInput(
    recognition,
    'file:///scan.jpg',
    'file:///cutouts/machine-cutout-1.png',
  );
  assert.equal(withCutout.cutoutUri, 'file:///cutouts/machine-cutout-1.png');
});

test('toRecognitionResult extracts recognition fields from a scan', () => {
  const scan = mapRowToMachineScan(validRow());
  const result = toRecognitionResult(scan);
  // Phase 7.3 backward compat: saved records (which predate the field
  // or passed the save guard) are always sport machines.
  assert.equal(result.isSportMachine, true);
  assert.equal(result.machineName, scan.machineName);
  assert.equal(result.confidence, scan.confidence);
  assert.equal(result.needsConfirmation, scan.needsConfirmation);
  assert.deepEqual(result.primaryMuscles, scan.primaryMuscles);
  assert.deepEqual(result.possibleExercises, scan.possibleExercises);
});

test('generateId returns unique non-empty ids', () => {
  const a = generateId();
  const b = generateId();
  assert.ok(a.length > 0);
  assert.ok(b.length > 0);
  assert.notEqual(a, b);
});
