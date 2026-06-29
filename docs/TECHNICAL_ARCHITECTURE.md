# Technical Architecture — Machine Scan POC

## Stack

- Expo
- Expo Router
- TypeScript
- React Native
- expo-camera
- expo-sqlite
- React Native Skia
- React Native Reanimated
- Zod
- Zustand

## Project Structure

```txt
app/
  index.tsx
  camera.tsx
  scan-result.tsx
  saved-machines.tsx
  machine/
    [id].tsx

src/
  features/
    camera/
      components/

    machine-scan/
      api/
      components/
      storage/
      types/

  shared/
    components/
    theme/
    utils/
```

## Feature Boundaries

### Camera Feature

Responsible for:

- Camera permission.
- Camera preview.
- Capturing a photo.
- Returning local image URI.

Not responsible for:

- AI calls.
- Machine details.
- Storage.
- Reveal effect.

### Machine Scan Feature

Responsible for:

- Recognition API client.
- Recognition response schema.
- Recognition response normalization.
- Scan result state.
- Reveal animation.
- Machine result card.
- Exercise list.
- Storage repository.

Result UI components (Phase 4) live in
`src/features/machine-scan/components/` and are pure presentational
components independent from Expo Router:

- `MachineResultCard`: orchestrates the full machine fiche (name, type,
  confidence, description, alternative names, muscles, exercises).
- `RecognitionConfidence`: confidence percent, "À confirmer" badge and
  uncertainty reason for low-confidence results.
- `MuscleTags`: primary and secondary muscle pills.
- `ExerciseList`: list of exercises with difficulty badge, setup,
  execution, common mistakes, and safety notes.

The `scan-result` route (`src/app/scan-result.tsx`) owns the runtime
state machine (missing / loading / success / error) and wires
`recognizeMachine` to the components. It branches on `result.ok` without
try/catch for expected business errors; a defensive `.catch()` only
covers impossible failures as `provider_error`.

### Storage

Use local SQLite for POC.

Implementation (Phase 5) lives in `src/features/machine-scan/storage/`:

- `db.ts`: opens a single `SQLiteDatabase` (`machine-scan.db`) via
  `openDatabaseAsync` and exposes `initMachineScanDatabase()` returning a
  `StorageResult<void>`. The schema creates the `machine_scans` table and a
  `createdAt DESC` index. Initialized once at app startup in `_layout.tsx`.
- `machine-scan-repository.ts`: CRUD repository. All public functions return
  `StorageResult<TData>` and never throw for expected business errors:
  - `saveMachineScan(input)` → `StorageResult<MachineScan>`
  - `listSavedMachineScans()` → `StorageResult<MachineScan[]>`
  - `getMachineScanById(id)` → `StorageResult<MachineScan>` (`not_found` if absent)
  - `deleteMachineScan(id)` → `StorageResult<void>`
- `mapping.ts`: pure serialization helpers (`mapRowToMachineScan`,
  `toMachineScanInput`, `toRecognitionResult`, `generateId`). Resilient to
  corrupted JSON (returns empty arrays instead of throwing). Unit-tested in
  Node via `mapping.test.ts`.
- `image-persistence.ts`: copies the captured photo into
  `Paths.document/machine-scans/` so images survive app restarts. Falls back
  to the original URI if copying fails.

Storage result shape (follows the project Error Handling Rules):

```ts
type StorageResult<TData> =
  | { ok: true; data: TData }
  | {
      ok: false;
      error: {
        kind: 'database_error' | 'not_found' | 'invalid_input';
        message: string;
        cause?: unknown;
      };
    };
```

Saved entity:

```ts
export type MachineScan = {
  id: string;
  imageUri: string;
  machineName: string;
  machineType: string;
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
```

Arrays (`primaryMuscles`, `secondaryMuscles`, `possibleExercises`,
`alternativeNames`) are stored as JSON `TEXT` columns and parsed back on
read. `needsConfirmation` is stored as `INTEGER` (0/1).

Exercise entity:

```ts
export type MachineExercise = {
  name: string;
  difficulty: "débutant" | "intermédiaire" | "avancé";
  setup: string;
  execution: string;
  commonMistakes: string[];
  safetyNotes: string[];
};
```

## AI Provider Strategy

Use an adapter.

```txt
recognizeMachine(imageUri)
  -> provider adapter
  -> raw AI response
  -> Zod validation
  -> conservative confidence fix (needsConfirmation forced < 0.60)
  -> normalized MachineRecognitionResult
```

Implementation (Phase 3):

- Types: `src/features/machine-scan/types` (`MachineExercise`,
  `MachineRecognitionResult`, `MachineScan`).
- Schema: `src/features/machine-scan/api/schema.ts`
  (`machineRecognitionSchema`, strict Zod).
- Errors: `src/features/machine-scan/api/errors.ts`
  (`RecognitionResult` discriminated union with error kinds
  `missing_image | invalid_response | provider_error`). The public
  recognition API returns this typed result instead of throwing for
  expected business errors.
- Provider interface: `RecognitionProvider` in
  `src/features/machine-scan/api/mock-provider.ts`.
- Public API: `recognizeMachine(imageUri, options?)` in
  `src/features/machine-scan/api/recognize.ts`. Returns
  `Promise<RecognitionResult>`; never throws for expected states.
- Provider selection is injectable through `options.provider`
  (defaults to `mockProvider`), keeping providers replaceable.

Providers must be replaceable.

Initial provider:

- Mock provider.

Next providers:

- Gemini Vision.
- OpenAI Vision.

Provider selection:

```txt
EXPO_PUBLIC_AI_PROVIDER=mock | remote
```

Remote backend selection:

```txt
AI_PROVIDER=mock | gemini | openai
```

## Recognition Flow

```txt
Camera capture
  -> imageUri
  -> scan-result screen
  -> recognizeMachine(imageUri)
  -> validate response
  -> display result
  -> allow save
```

## Visual Effect Strategy

POC effect levels:

### Level 1

No segmentation.

Use:

- Captured photo background.
- Dark overlay.
- Animated focus ring.
- Animated particles.
- Result label.

### Level 2

Use approximate bounding box.

Use:

- Particles around bounding box.
- Object area zoom.
- Background blur.
- Fake depth shadow.

### Level 3

Use real segmentation mask.

Use:

- Extracted machine layer.
- Machine scale/translate/rotate.
- Background disintegration.
- Label attached to machine.

The POC should reach Level 2 before attempting Level 3.

## Data Flow

```txt
Photo URI
  -> Recognition result
  -> Machine detail model
  -> Local SQLite save
  -> Saved machines list
  -> Machine detail screen
```

## Error Handling

The app must handle:

- Camera permission denied.
- Camera unavailable.
- Capture failure.
- Missing image URI.
- AI timeout.
- Invalid AI JSON.
- Low confidence recognition.
- SQLite save failure.
- Saved machine not found.

## Demo Mode

The app must support a stable demo mode.

Demo mode should allow:

- Opening scan result without a real remote AI call.
- Showing a constant mock machine.
- Testing save/list/detail flow.
- Testing reveal effect.
