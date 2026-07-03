---
name: skia-cutout
description: Use this skill for Skia rendering, cutoutUri display, glow/shadow effects, and CapWords-like object validation visuals.
---

# Skia Cutout Skill

Use this skill when working on Skia validation rendering and object cutout display.

## Core Rule

Skia renders the cutout.

Skia does not create the cutout by itself.

The real object cutout must come from:

```txt
cutoutUri
```

## Good Rendering

If `cutoutUri` exists:

```txt
Canvas
  light background
  subtle dotted pattern
  soft yellow radial glow
  soft shadow
  transparent object cutout centered
  label below in React Native or Skia
```

## Bad Rendering

Do not render:

- cropped rectangle as object
- squeezed photo
- tiny full photo inside huge white card
- fake segmentation
- big gray blobs behind the label
- confusing visual elements

## Fallback Rule

If no `cutoutUri` exists:

- show honest photo fallback
- do not pretend it is a cutout
- explain cutout unavailable if needed

## Performance Rules

- Keep Skia layers simple.
- Use deterministic elements.
- Avoid random on every render.
- Avoid heavy JS image processing.
- Avoid infinite animations after success.
- Keep Expo Go compatibility.
