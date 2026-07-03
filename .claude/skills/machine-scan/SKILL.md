---
name: machine-scan
description: Use this skill for gym machine recognition, AI response schemas, scan flow, result state, and machine exercise data.
---

# Machine Scan Skill

Use this skill for recognition logic, schemas, scan flow, and machine exercise data.

## Rules

- Keep recognition provider replaceable.
- Keep mock provider available.
- Validate AI/provider outputs with Zod.
- Never trust raw AI JSON.
- Use typed result unions for expected UI states.
- Do not use custom Error classes for expected business errors.
- Do not recommend exact weights.
- Do not invent unsafe exercises.
- Keep responses in French in the POC UI.
- Keep recognition independent from camera capture.
- Keep recognition independent from storage.

## Recognition Result Shape

Public recognition APIs should return:

```ts
type RecognitionResult =
  | {
      ok: true;
      data: MachineRecognitionResult;
    }
  | {
      ok: false;
      error: {
        kind: RecognitionErrorKind;
        message: string;
        cause?: unknown;
      };
    };
```

## Required Machine Data

A recognized machine should include:

- machineName
- machineType
- confidence
- description
- primaryMuscles
- secondaryMuscles
- possibleExercises
- alternativeNames
- needsConfirmation
- uncertaintyReason

## Scan Flow

The intended scan flow is:

```txt
capture photo
→ recognize machine
→ generate cutoutUri
→ show validation screen
→ user confirms
→ show machine details
→ user saves
```

Do not show full details before the validation stage unless the user confirms.
