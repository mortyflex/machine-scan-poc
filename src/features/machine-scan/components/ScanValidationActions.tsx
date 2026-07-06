import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ScanValidationActionsProps = {
  onConfirm: () => void;
  onRetake: () => void;
  onReject?: () => void;
  confirmLabel?: string;
};

/**
 * Validation actions (Phase 6.6.6): premium pill buttons over the warm
 * stage — graphite confirm pill with check icon and soft shadow, glassy
 * translucent side pills with icons. Pure RN styling, no native deps,
 * large touch targets, press scale feedback.
 */
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
        hitSlop={6}
      >
        <Ionicons name="camera-outline" size={19} color="#1A1A1A" />
        <Text style={styles.sideText}>Refaire</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.confirmButton,
          pressed && styles.confirmPressed,
        ]}
        onPress={onConfirm}
        hitSlop={6}
      >
        <View style={styles.confirmCheck}>
          <Ionicons name="checkmark" size={17} color="#111111" />
        </View>
        <Text style={styles.confirmText}>{confirmLabel}</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.sideButton,
          pressed && styles.pressed,
        ]}
        onPress={onReject}
        disabled={!onReject}
        hitSlop={6}
      >
        <Ionicons
          name="close-outline"
          size={20}
          color={onReject ? '#1A1A1A' : '#BFC2BB'}
        />
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
    gap: 10,
    width: '100%',
  },
  sideButton: {
    flex: 1,
    height: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.08)',
    backgroundColor: 'rgba(255,255,255,0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  confirmButton: {
    flex: 1.45,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#161616',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD65C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
  sideTextDisabled: {
    color: '#BFC2BB',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  confirmPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.18,
  },
});
