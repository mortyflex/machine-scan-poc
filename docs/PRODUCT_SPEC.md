# Product Spec — Machine Scan POC

## Vision

The app helps gym users understand the machines around them.

Instead of searching manually, the user takes a photo of a gym machine. The app identifies it, explains what it is used for, shows possible exercises, and saves it in a personal machine library.

## Core User Story

As a gym user, I want to take a photo of a machine so that I can instantly understand what exercises I can do with it.

## Product Promise

Scan a gym machine. Understand it instantly. Save it for later.

## Main Flow

1. User opens the app.
2. User taps "Scanner une machine".
3. Camera opens.
4. User takes a photo.
5. App freezes the photo.
6. App sends the image to the recognition service.
7. App shows a premium reveal animation.
8. App displays the machine name and muscles.
9. User opens the machine detail.
10. User saves the machine.
11. Machine appears in saved machines.

## Screens

### Home

Must contain:

- App title.
- Short product explanation.
- Primary CTA: "Scanner une machine".
- Secondary CTA: "Machines sauvegardées".

### Camera

Must contain:

- Camera preview.
- Camera permission state.
- Permission denied state.
- Capture button.
- Capture loading state.
- Error state.

### Scan Result

Must contain:

- Captured image.
- Loading state.
- Premium reveal effect.
- Machine name.
- Confidence.
- Description.
- Primary muscles.
- Secondary muscles.
- Possible exercises.
- Save button.
- Error state.
- Low-confidence state.

### Machine Detail

Must contain:

- Machine name.
- Confidence.
- Description.
- Primary muscles.
- Secondary muscles.
- Possible exercises.
- Setup instructions.
- Execution instructions.
- Common mistakes.
- Safety notes.
- Created date if saved.

### Saved Machines

Must contain:

- Empty state.
- List of saved machines.
- Machine cards.
- Navigation to detail.
- Optional delete action.

## MVP Requirements

- The app must work on iOS first.
- Android support should not be intentionally broken.
- AI can be mocked at first.
- The reveal effect can use a fake bounding box at first.
- The app must persist saved machines locally.
- The app must support a stable demo mode.

## UX Tone

The app should feel:

- Premium.
- Fast.
- Mobile-first.
- Camera-first.
- Useful inside a real gym.
- Less like a chatbot, more like a smart scanner.

Avoid:

- Chatbot-first UX.
- Generic AI gradients everywhere.
- Overloaded screens.
- Medical claims.
- Complex onboarding.
- Fake precision.
- Unsafe training advice.

## Safety and Fitness Boundaries

The app can explain machine usage.

The app must not:

- Diagnose injuries.
- Prescribe exact loads.
- Replace medical or coaching advice.
- Recommend dangerous form.
- Invent exercises when the machine is unclear.

## Success Criteria

The POC is successful when:

- User can take a photo.
- User can see a machine result.
- User can save the machine.
- User can reopen the machine later.
- The reveal animation feels premium.
- The app remains usable with mock AI.
- The app remains usable if remote AI fails.
