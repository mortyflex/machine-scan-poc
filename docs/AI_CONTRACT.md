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

### confidence

Number between `0` and `1`.

Rules:

- `0.85` or more: strong recognition.
- `0.60` to `0.84`: usable but should be visually treated as uncertain.
- Below `0.60`: must set `needsConfirmation` to `true`.

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

## Prompt

```txt
Tu es un expert en musculation, biomécanique et machines de salle de sport.

Analyse l'image fournie. Identifie la machine de sport visible au premier plan.

Réponds uniquement en JSON valide avec ce schéma :

{
  "machineName": string,
  "machineType": string,
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
