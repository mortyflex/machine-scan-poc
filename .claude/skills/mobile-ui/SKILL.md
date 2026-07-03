---
name: mobile-ui
description: Use this skill for mobile-first screens, layout, animation, visual polish, and CapWords-like interaction design.
---

# Mobile UI Skill

Use this skill for screens, layout, animation, visual polish, and interaction flow.

## Rules

- Mobile-first.
- Camera-first.
- Large touch targets.
- Strong spacing.
- Clear hierarchy.
- No generic AI slop.
- No overloaded screens.
- No fake visual claims.
- Always handle loading, empty, error, and success states.

## CapWords Target

The desired UX resembles CapWords:

```txt
camera full screen
object inside scan frame
capture
object cutout validation screen
confirm / retake / reject
details after confirm
```

## Capture Screen Target

The capture screen should have:

- camera full screen
- no black side bars
- safe area overlay
- scan corner brackets
- instruction text
- premium circular capture button
- simple cancel/back action

## Validation Screen Target

The validation screen should have:

- light background
- subtle dotted pattern
- real cutout object centered if available
- soft yellow glow behind object
- soft shadow below object
- label below object
- confirm / retake / reject actions

Without cutoutUri:

- show honest fallback
- do not show fake cutout
- do not squeeze the photo

## Result Screen Target

The result screen should show:

- machine visual at top
- cutoutUri first when available
- original photo fallback if no cutout
- machine name
- confidence
- description
- muscles
- exercises
- save button
