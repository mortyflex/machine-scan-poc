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

### Storage

Use local SQLite for POC.

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
  -> normalized MachineRecognitionResult
```

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
