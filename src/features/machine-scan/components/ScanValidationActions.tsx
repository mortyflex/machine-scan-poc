import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ScanValidationActionsProps = {
  onConfirm: () => void;
  onRetake: () => void;
  onReject?: () => void;
  confirmLabel?: string;
};

export function ScanValidationActions({
  onConfirm,
  onRetake,
  onReject,
  confirmLabel = 'Valider',
}: ScanValidationActionsProps) {
  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [
          styles.sideButton,
          pressed && styles.pressed,
        ]}
        onPress={onRetake}
      >
        <Text style={styles.sideText}>Refaire</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.confirmButton,
          pressed && styles.pressed,
        ]}
        onPress={onConfirm}
      >
        <Text style={styles.confirmText}>{confirmLabel}</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.sideButton,
          pressed && styles.pressed,
        ]}
        onPress={onReject}
        disabled={!onReject}
      >
        <Text style={[styles.sideText, !onReject && styles.sideTextDisabled]}>
          Rejeter
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  sideButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D9D9D6',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1.5,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
  sideTextDisabled: {
    color: '#BFC2BB',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
});
