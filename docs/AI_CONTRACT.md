# AI Contract — Machine Recognition

## Goal

Given a photo of a gym machine, return a strict JSON object describing the machine and possible exercises.

## Input

```json
{
  "image": "base64 or uploaded image file",
  "locale": "fr",
  "context": {
    "environment": "gym",
    "goal": "identify machine and explain exercises"
  }
}
```

## Output

```json
{
  "machineName": "Presse à cuisses inclinée",
  "machineType": "lower_body_machine",
  "isSportMachine": true,
  "confidence": 0.87,
  "description": "Machine guidée pour travailler principalement les quadriceps, les fessiers et les ischio-jambiers.",
  "primaryMuscles": ["quadriceps", "fessiers"],
  "secondaryMuscles": ["ischio-jambiers", "mollets"],
  "possibleExercises": [
    {
      "name": "Presse à cuisses classique",
      "difficulty": "débutant",
      "setup": "Place les pieds largeur épaules sur la plateforme.",
      "execution": "Descends lentement puis pousse sans verrouiller les genoux.",
      "commonMistakes": ["Décoller le bassin", "Verrouiller les genoux"],
      "safetyNotes": [
        "Garde le dos collé au dossier",
        "Utilise une charge progressive"
      ]
    }
  ],
  "alternativeNames": ["Leg press", "Presse inclinée"],
  "needsConfirmation": false,
  "uncertaintyReason": null
}
```

## Required Fields

### machineName

Human-readable French name of the machine.

Examples:

- Presse à cuisses inclinée
- Tirage vertical
- Chest press
- Leg curl assis
- Smith machine
- Poulie vis-à-vis

### machineType

Stable machine category.

Examples:

- lower_body_machine
- upper_body_machine
- cable_machine
- free_weight_station
- cardio_machine
- unknown
- not_sport_equipment (Phase 7.3: the photo shows an everyday object,
  not usable gym equipment)

### isSportMachine

Boolean, required since Phase 7.3. A provider response without it is
invalid — the server rejects it, there is no default for fresh AI
responses.

- `true`: the object is a gym machine or a usable training accessory
  (weight machine, bench, dumbbell, kettlebell, cable station, rower,
  elliptical, treadmill, smith machine…).
- `false`: the object is not sport-related or not usable as equipment
  (mouse, office chair, phone, bottle, computer, keyboard, decorative
  object, person alone, unusable blurry photo…).

When `false`, the result is normalized (server-side and app-side):
`needsConfirmation = true`, `possibleExercises = []`,
`primaryMuscles = []`, `secondaryMuscles = []`, and the app blocks
validation and save entirely.

Backward compatibility: old saved records predate the field. They can
only exist because they passed validation, so the storage mapping
restores `isSportMachine: true` when reading them. This default never
applies to fresh provider responses.

### confidence

Number between `0` and `1`.

Rules:

- `0.85` or more: strong recognition.
- `0.60` to `0.84`: usable but should be visually treated as uncertain.
- Below `0.60`: must set `needsConfirmation` to `true`.

Enforcement:

- The app validates every response with a strict Zod schema (`src/features/machine-scan/api/schema.ts`).
- If the provider returns `confidence < 0.60` with `needsConfirmation = false`,
  the app forces `needsConfirmation = true` and fills `uncertaintyReason` when missing.
- This guarantees a conservative state even if a remote provider omits it.

### needsConfirmation

Must be `true` when:

- The machine is partially hidden.
- Several machines are visible.
- The photo is blurry.
- The machine is not identifiable.
- The image does not show a gym machine.
- The confidence is below `0.60`.

## Rules

- Return JSON only.
- Do not return Markdown.
- Do not include comments.
- Do not include trailing commas.
- Do not provide medical diagnosis.
- Do not recommend exact weights.
- Do not create impossible exercises.
- Do not invent a specific machine when the image is unclear.
- Prefer conservative answers over hallucinated machines.
- Respond in French.

## Provider Contract

The mobile app never trusts raw AI JSON. Flow:

```txt
recognizeMachine(imageUri)
  -> provider adapter (mock | remote)
  -> raw AI response
  -> Zod validation (machineRecognitionSchema)
  -> conservative confidence fix (needsConfirmation forced < 0.60)
  -> MachineRecognitionResult (typed)
```

Error kinds exposed by the app:

- `missing_image`: no `imageUri` provided or unreadable local file.
- `invalid_response`: Zod validation failed.
- `provider_error`: the provider threw, or the backend returned non-2xx.
- `network_error`: the recognition backend is unreachable or timed out.

These are returned by `recognizeMachine` as a typed
`RecognitionResult` discriminated union in
`src/features/machine-scan/api/errors.ts`. The public recognition API
never throws for these expected business errors; callers branch on
`result.ok`. A provider may still throw internally, but the public API
converts that into `{ ok: false, error: { kind: 'provider_error', ... } }`.

## Cutout Backend Contract (Phase 6.6)

Separate from recognition: the cutout pipeline isolates the main object
as a transparent PNG. The mobile app never talks to the segmentation
provider directly and never holds its key.

Endpoint:

```txt
POST ${EXPO_PUBLIC_API_BASE_URL}/api/machine-cutout
```

Request (JSON):

```json
{
  "imageBase64": "...",
  "mimeType": "image/jpeg"
}
```

Success response (200):

```json
{
  "cutoutBase64": "...",
  "mimeType": "image/png",
  "method": "remote"
}
```

Error response (400 / 502 / 503):

```json
{
  "error": {
    "kind": "invalid_input | cutout_disabled | cutout_failed | provider_error | invalid_response",
    "message": "..."
  }
}
```

App-side error kinds (`generateMachineCutout`, typed `CutoutResult`,
never throws for expected states):

- `invalid_input`: empty `imageUri` or unreadable local file.
- `cutout_disabled`: `EXPO_PUBLIC_CUTOUT_PROVIDER` is `disabled`/unknown.
- `cutout_unavailable`: the server has cutout disabled.
- `network_error`: backend unreachable or timeout (20s).
- `cutout_failed`: backend non-2xx or local file write failure.
- `invalid_response`: response is not valid JSON matching the contract
  (validated with Zod).

Server provider selection (`server/.env`, never mobile):

```txt
CUTOUT_PROVIDER=disabled | remove-bg
REMOVE_BG_API_KEY=<secret, server-side only>
```

## Phase 7 — Real machine recognition backend provider

Decision:

- mobile keeps mock recognition by default
- remote recognition is handled by a backend endpoint
- Gemini provider is server-only
- the app sends imageBase64 to backend
- backend returns a validated MachineRecognitionResult
- no Gemini key is exposed to the mobile app
- recognition errors are visible and never silently replaced by mock
  data in remote mode

Endpoint:

```txt
POST ${EXPO_PUBLIC_RECOGNITION_API_BASE_URL}/api/machine-recognition
```

Request (JSON):

```json
{
  "imageBase64": "...",
  "mimeType": "image/jpeg"
}
```

Success response (200): a flat `MachineRecognitionResult` JSON object
(validated server-side with the same Zod schema as the app, and
re-validated app-side).

Error response (400 / 502 / 503):

```json
{
  "error": {
    "kind": "invalid_input | recognition_disabled | provider_error | invalid_response | network_error",
    "message": "..."
  }
}
```

Server provider selection (`server/.env`, never mobile):

```txt
RECOGNITION_PROVIDER=mock | gemini | disabled
GEMINI_API_KEY=<secret, server-side only>
GEMINI_RECOGNITION_MODEL=gemini-3.1-flash-lite
```

Mobile provider selection:

```txt
EXPO_PUBLIC_RECOGNITION_PROVIDER=mock | remote (default mock)
EXPO_PUBLIC_RECOGNITION_API_BASE_URL=http://<host>:3000
  (falls back to EXPO_PUBLIC_API_BASE_URL)
```

Server-side business rules (Gemini provider):

- Non-machine objects are reported honestly: `isSportMachine = false`,
  `machineType = "not_sport_equipment"`, `possibleExercises` may be
  empty (the schema allows an empty array since Phase 7), muscles stay
  empty.
- `needsConfirmation` is forced to `true` when confidence < 0.75.
- Phase 7.3: when `isSportMachine = false`, the server clears
  `possibleExercises`, `primaryMuscles`, `secondaryMuscles` and forces
  `needsConfirmation = true`, even if the model filled them.
- A response missing `isSportMachine` fails validation
  (`invalid_response`) — it is never defaulted.
- Out-of-enum `machineType` values are coerced to `unknown` instead of
  failing the scan.
- The Gemini key and the image payload are never logged.

GET `/api/machine-recognition/debug` returns safe diagnostics
(provider, model, `hasGeminiApiKey` boolean) and never the key value.

## Phase 7.3 — Not-machine recognition guard

QA finding:

- Gemini can correctly identify non-gym objects, but the app still
  allowed validation.

Decision:

- recognition contract now includes `isSportMachine`
- non-sport objects cannot be validated or saved
- UI shows a dedicated state with Refaire / Annuler
- server normalizes non-machine results by clearing muscles and
  exercises

## Prompt

```txt
Tu es un expert en musculation, biomécanique et machines de salle de sport.

Analyse l'image fournie. Identifie la machine de sport visible au premier plan.

Réponds uniquement en JSON valide avec ce schéma :

{
  "machineName": string,
  "machineType": string,
  "isSportMachine": boolean,
  "confidence": number,
  "description": string,
  "primaryMuscles": string[],
  "secondaryMuscles": string[],
  "possibleExercises": [
    {
      "name": string,
      "difficulty": "débutant" | "intermédiaire" | "avancé",
      "setup": string,
      "execution": string,
      "commonMistakes": string[],
      "safetyNotes": string[]
    }
  ],
  "alternativeNames": string[],
  "needsConfirmation": boolean,
  "uncertaintyReason": string | null
}

Règles :
- Retourne isSportMachine=false si l'image ne montre pas clairement une machine de sport, un équipement de sport, ou un accessoire d'entraînement exploitable.
- Ne force jamais une machine de musculation à partir d'une souris, d'une chaise, d'un téléphone, d'un meuble, d'un animal, ou d'un objet du quotidien.
- Si isSportMachine=false : machineName nomme honnêtement l'objet ou dit "Objet non sportif", machineType="not_sport_equipment", needsConfirmation=true, possibleExercises=[], primaryMuscles=[], secondaryMuscles=[], et uncertaintyReason explique que ce n'est pas une machine de sport.
- Si la machine n'est pas identifiable avec confiance, mets needsConfirmation à true.
- Si plusieurs machines sont visibles et qu'il est impossible de savoir laquelle est le sujet principal, mets needsConfirmation à true.
- Si l'image ne montre pas une machine de salle de sport, mets needsConfirmation à true.
- Ne donne pas de diagnostic médical.
- Ne recommande pas de charge précise.
- Ne crée pas d'exercice impossible sur la machine.
- Réponds en français.
```

## Mock Result

Use this result for local development:

```json
{
  "machineName": "Presse à cuisses inclinée",
  "machineType": "lower_body_machine",
  "isSportMachine": true,
  "confidence": 0.91,
  "description": "Machine guidée permettant de travailler principalement les quadriceps, les fessiers et les ischio-jambiers avec un mouvement de poussée des jambes.",
  "primaryMuscles": ["quadriceps", "fessiers"],
  "secondaryMuscles": ["ischio-jambiers", "mollets"],
  "possibleExercises": [
    {
      "name": "Presse à cuisses classique",
      "difficulty": "débutant",
      "setup": "Place le dos contre le dossier et les pieds largeur épaules sur la plateforme.",
      "execution": "Déverrouille la sécurité, descends lentement jusqu'à une flexion contrôlée, puis pousse la plateforme sans verrouiller brutalement les genoux.",
      "commonMistakes": [
        "Décoller le bassin",
        "Verrouiller les genoux",
        "Descendre trop bas sans contrôle"
      ],
      "safetyNotes": [
        "Garde le dos collé au dossier",
        "Commence avec une charge modérée",
        "Contrôle la descente"
      ]
    },
    {
      "name": "Presse pieds hauts",
      "difficulty": "intermédiaire",
      "setup": "Place les pieds légèrement plus haut sur la plateforme.",
      "execution": "Effectue le même mouvement de poussée en gardant une trajectoire contrôlée.",
      "commonMistakes": [
        "Arrondir le bas du dos",
        "Perdre le contact avec le dossier"
      ],
      "safetyNotes": [
        "Réduis l'amplitude si le bassin se décolle",
        "Ne force pas une profondeur inconfortable"
      ]
    }
  ],
  "alternativeNames": ["Leg press", "Presse inclinée"],
  "needsConfirmation": false,
  "uncertaintyReason": null
}
```
