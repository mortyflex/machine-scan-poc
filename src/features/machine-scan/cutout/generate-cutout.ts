import type { CutoutProvider, CutoutResult } from './types';

function resolveProvider(): CutoutProvider {
  const value = process.env.EXPO_PUBLIC_CUTOUT_PROVIDER ?? 'disabled';
  return value === 'remote' ? 'remote' : 'disabled';
}

export async function generateMachineCutout(
  imageUri: string,
): Promise<CutoutResult> {
  if (!imageUri || imageUri.trim().length === 0) {
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'Aucune image fournie pour le détourage.',
      },
    };
  }

  if (resolveProvider() !== 'remote') {
    return {
      ok: false,
      error: {
        kind: 'cutout_disabled',
        message: 'Le détourage est désactivé.',
      },
    };
  }

  // Lazy import: only load the (expo-file-system dependent) provider when the
  // remote cutout provider is actually enabled. Keeps tests runnable in
  // plain Node without the React Native runtime.
  const { requestRemoteCutout } = await import('./remote-cutout-provider');
  return requestRemoteCutout(imageUri);
}
