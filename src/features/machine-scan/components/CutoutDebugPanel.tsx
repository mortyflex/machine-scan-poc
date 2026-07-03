import { Pressable, StyleSheet, Text, View } from 'react-native';

export type CutoutDebugStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'failed'
  | 'disabled';

export type CutoutDebugPanelProps = {
  provider: 'disabled' | 'remote';
  apiBaseUrl: string;
  status: CutoutDebugStatus;
  errorKind?: string;
  /** External provider HTTP status forwarded by the backend, if any. */
  providerStatus?: number;
  /** Safe preview of the provider error message (never a secret). */
  providerMessage?: string;
  visualMode: 'real-cutout' | 'photo-fallback-cover';
  onRetry?: () => void;
  /** Extra bottom spacing so the panel doesn't cover action buttons. */
  bottomOffset?: number;
};

/**
 * Dev-only diagnostic overlay (Phase 6.6.1): shows on-device whether the
 * app actually reads EXPO_PUBLIC_CUTOUT_PROVIDER / EXPO_PUBLIC_API_BASE_URL
 * and what the cutout pipeline did. Never rendered in production — callers
 * must gate it behind `__DEV__`.
 */
export function CutoutDebugPanel({
  provider,
  apiBaseUrl,
  status,
  errorKind,
  providerStatus,
  providerMessage,
  visualMode,
  onRetry,
  bottomOffset = 8,
}: CutoutDebugPanelProps) {
  const canRetry =
    Boolean(onRetry) && (status === 'failed' || status === 'disabled');

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { paddingBottom: bottomOffset }]}
    >
      <View style={styles.panel}>
        <Text style={styles.title}>Cutout debug</Text>
        <Text style={styles.line}>provider: {provider}</Text>
        <Text style={styles.line}>api: {apiBaseUrl || 'empty'}</Text>
        <Text style={styles.line}>status: {status}</Text>
        <Text style={styles.line}>error: {errorKind ?? 'none'}</Text>
        {providerStatus !== undefined ? (
          <Text style={styles.line}>provider status: {providerStatus}</Text>
        ) : null}
        {providerMessage ? (
          <Text style={styles.line} numberOfLines={4}>
            provider message: {providerMessage}
          </Text>
        ) : null}
        <Text style={styles.line}>visual mode: {visualMode}</Text>
        {canRetry ? (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryLabel}>Relancer le détourage</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  panel: {
    backgroundColor: 'rgba(17,17,17,0.82)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 1,
    maxWidth: 260,
  },
  title: {
    color: '#FFD866',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  line: {
    color: '#EDEDED',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  retryButton: {
    marginTop: 6,
    backgroundColor: '#FFD866',
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
  },
  retryLabel: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '700',
  },
});
