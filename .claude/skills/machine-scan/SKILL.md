# Machine Scan Skill

Use this skill when working on machine recognition, AI response schemas, exercise data, and scan flows.

## Rules

- Keep recognition provider replaceable.
- Mock provider first.
- Validate all AI outputs with Zod.
- Never trust raw AI JSON.
- If confidence is low, show confirmation state.
- Do not invent unsafe exercises.
- Do not recommend exact weights.
- Keep responses in French for the POC.
- Keep machine recognition independent from camera capture.
- Keep machine recognition independent from local persistence.

## Expected Output Shape

Use the schema from `docs/AI_CONTRACT.md`.

Required fields:

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

## Error Cases

Handle:

- Missing image.
- Invalid AI response.
- Low confidence.
- Non-machine image.
- Network failure.
- Provider timeout.

## Files Usually Involved

- `src/features/machine-scan/types`
- `src/features/machine-scan/api`
- `src/features/machine-scan/components`
- `docs/AI_CONTRACT.md`
- `docs/ROADMAP.md`
- `docs/TEST_PLAN.md`
