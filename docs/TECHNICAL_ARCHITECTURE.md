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
- `MachineRevealEffect` (Phase 6.3): honest CapWords-style reveal using
  Reanimated only (no Skia). Default `photo-card` mode shows the full
  photo (`contentFit: contain`, no crop) on a bright neutral card with
  sober dust fragments, a gentle settle, a soft drop shadow, and a
  premium typographic label — it never fakes an object cutout. The
  `real-cutout` mode (future-ready `cutoutUri`, transparent PNG/WebP)
  animates a real detoured object with an elliptical shadow; it only
  activates when a real cutout is provided. `effectLevel: 'photo-card' |
  'real-cutout'` (default inferred from `cutoutUri`). Independent from
  Expo Router. Kept exported; the main scan flow now uses
  `ScanValidationStage`.
- `ScanValidationStage` (Phase 6.4): CapWords-like validation step shown
  after recognition success and before the full fiche. Light bg, soft
  yellow glow, full photo in a stable-ratio card (no squeeze, no fake
  cutout) or real `cutoutUri`, premium label, and confirm/retake/reject
  actions. Future-ready for real segmentation.
- `ScanValidationActions` (Phase 6.4): `Refaire` / `Valider` / `Rejeter`
  action row used by the validation stage.
- `SkiaCutoutStage` (Phase 6.5): pure visual Skia renderer for the
  validation object. Renders a `Canvas` with background, subtle dotted
  pattern, yellow radial glow, soft elliptical shadow, and either a real
  `cutoutUri` object (future-ready) or an honest photo-card fallback (no
  squeeze, no fake cutout). Independent from Expo Router / SQLite / AI.
  `ScanValidationStage` now delegates the object visual to
  `SkiaCutoutStage` and keeps the actions in React Native.

The `scan-result` route (`src/app/scan-result.tsx`) owns the runtime
state machine (missing / loading / success / error) and wires
`recognizeMachine` to the components. It branches on `result.ok` without
try/catch for expected business errors; a defensive `.catch()` only
covers impossible failures as `provider_error`.

### Cutout Feature (Phase 6.6)

`src/features/machine-scan/cutout/`:

- `types.ts`: `CutoutProvider` (`disabled | remote`), `CutoutMethod`
  (`none | remote`), `CutoutErrorKind`
  (`invalid_input | cutout_disabled | cutout_unavailable | cutout_failed |
  network_error | invalid_response`), and the `CutoutResult` discriminated
  union.
- `generate-cutout.ts`: public API
  `generateMachineCutout(imageUri): Promise<CutoutResult>`. Never throws
  for expected states. Provider selection reads
  `EXPO_PUBLIC_CUTOUT_PROVIDER` (default `disabled`; unknown values are
  treated as disabled). The remote provider is lazy-imported so tests run
  in plain Node.
- `remote-cutout-provider.ts`: reads the local photo as base64
  (`expo-file-system` `File.base64()`), POSTs
  `{ imageBase64, mimeType }` JSON to
  `${EXPO_PUBLIC_API_BASE_URL}/api/machine-cutout` with a 20s timeout,
  validates the response with Zod, writes the returned transparent PNG
  into the durable `machine-scan-cutouts/` folder under the document
  directory, and returns a local `cutoutUri`. All expected failures map
  to typed error kinds (timeout/backend down → `network_error`, non-2xx →
  `cutout_failed`, server disabled → `cutout_unavailable`, bad JSON →
  `invalid_response`).

Cutout backend (`server/`, run with `npm run server:dev`):

- `server/index.ts`: Node HTTP server (port 3000 by default),
  `POST /api/machine-cutout` (base64 JSON in, base64 PNG out) and
  `GET /health`. Loads the repo-root `.env` if present.
- `server/cutout/types.ts`: `ServerCutoutResult` typed union +
  `CUTOUT_PROVIDER` resolution (`disabled | remove-bg`, default disabled).
- `server/cutout/cutout-service.ts`: provider dispatch + input validation.
- `server/cutout/providers/disabled.ts`: honest disabled provider
  (503 `cutout_disabled`, never fakes a cutout).
- `server/cutout/providers/remove-bg.ts`: remove.bg integration
  (`REMOVE_BG_API_KEY`, server-side only, isolated and replaceable).

Secret keys never reach the mobile bundle: only
`EXPO_PUBLIC_CUTOUT_PROVIDER` and `EXPO_PUBLIC_API_BASE_URL` are allowed
app-side.

`scan-result` flow: after recognition success, `generateMachineCutout`
runs (brief `Détourage de l'objet…` stage while remote is working); its
failure is non-blocking — the validation stage falls back to the honest
photo card with a discrete `Détourage indisponible` hint. `cutoutUri` is
passed to `ScanValidationStage`, the details visual, and the save input.

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
  cutoutUri?: string;
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

`cutoutUri` (Phase 6.6) is a nullable `TEXT` column. Databases created
before Phase 6.6 are migrated idempotently at init
(`PRAGMA table_info` check + `ALTER TABLE ... ADD COLUMN cutoutUri TEXT`);
older rows stay valid with `cutoutUri = NULL` (mapped to `undefined`).
Saved list (`SavedMachineCard`) and machine detail prefer `cutoutUri`
over `imageUri` when present.

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
  `missing_image | invalid_response | provider_error | network_error`).
  The public recognition API returns this typed result instead of
  throwing for expected business errors.
- Provider interface: `RecognitionProvider` in
  `src/features/machine-scan/api/mock-provider.ts`.
- Public API: `recognizeMachine(imageUri, options?)` in
  `src/features/machine-scan/api/recognize.ts`. Returns
  `Promise<RecognitionResult>`; never throws for expected states.
- Provider selection is injectable through `options.provider`
  (defaults to `mockProvider`), keeping providers replaceable.

Providers must be replaceable.

### Real Recognition Backend (Phase 7)

Recognition runs server-side; the mobile app never holds an AI key.

Mobile side (`src/features/machine-scan/api/`):

- `recognition-config.ts`: reads `EXPO_PUBLIC_RECOGNITION_PROVIDER`
  (`mock` default, `remote`; unknown values fall back to mock) and
  `EXPO_PUBLIC_RECOGNITION_API_BASE_URL` (falls back to
  `EXPO_PUBLIC_API_BASE_URL`).
- `validate-recognition.ts`: shared Zod validation + conservative
  confidence fix, used by both the mock and remote paths.
- `remote-recognition-provider.ts`: reads the local photo as base64
  (`expo-file-system` `File.base64()`), POSTs `{ imageBase64, mimeType }`
  JSON to `${base URL}/api/machine-recognition` with a 30s timeout, and
  validates the response with the strict shared schema. Lazy-imported by
  `recognizeMachine` so tests run in plain Node. Expected failures map to
  typed kinds: unreadable image → `missing_image`, backend down/timeout →
  `network_error`, non-2xx → `provider_error`, bad JSON/schema →
  `invalid_response`. Remote failures are shown to the user — they are
  never silently replaced by mock data.

Recognition backend (`server/recognition/`, same Node server as cutout):

- `types.ts`: `ServerRecognitionResult` typed union +
  `RECOGNITION_PROVIDER` resolution (`mock` default, `gemini`,
  `disabled`).
- `recognition-service.ts`: input validation + provider dispatch +
  safe debug info (`GET /api/machine-recognition/debug` reports
  provider/model and key presence, never the key value).
- `schema.ts`: re-exports the mobile Zod schema so both sides validate
  the exact same contract.
- `providers/mock.ts`: stable mock result for keyless end-to-end runs.
- `providers/gemini.ts`: Gemini vision integration (`GEMINI_API_KEY`,
  server-side only; `GEMINI_RECOGNITION_MODEL`, default
  `gemini-3.1-flash-lite`). Sends the image inline with a French
  system instruction and a structured-output JSON schema, Zod-validates
  the candidate, coerces out-of-enum `machineType` to `unknown`, and
  forces `needsConfirmation` below confidence 0.75. `fetch` is
  injectable for tests.

Endpoint: `POST /api/machine-recognition` (base64 JSON in, flat
validated `MachineRecognitionResult` out; typed error JSON with mapped
status codes otherwise — `invalid_input` 400, `recognition_disabled`
503, others 502).

## Recognition Flow

```txt
Camera capture (full-screen preview, scan frame)
  -> imageUri
  -> scan-result screen
  -> recognizeMachine(imageUri)
  -> validate response (Zod)
  -> loading stage (photo card + "Analyse…")
  -> validation stage (ScanValidationStage: object/photo-card + label)
  -> user confirms
  -> details stage (MachineResultCard + save)
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
