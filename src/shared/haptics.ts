import * as Haptics from 'expo-haptics';

/**
 * Centralized haptic feedback (Phase 6.6.10+): one tiny vocabulary used
 * across the app so the feel stays consistent. Every call is fire-and-
 * forget and swallows errors — haptics must never break a flow on
 * devices/simulators without an engine.
 *
 * Vocabulary:
 * - tapLight    → any button/back press acknowledgment
 * - tapMedium   → a meaningful moment starts (capture, reveal)
 * - select      → picking an item in a list
 * - notifySuccess → an outcome the user waited for (save, cutout, confirm)
 * - notifyError   → an operation failed
 */

export function tapLight(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function tapMedium(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function tapHeavy(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function select(): void {
  Haptics.selectionAsync().catch(() => {});
}

export function notifySuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {},
  );
}

export function notifyError(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
    () => {},
  );
}
