import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { tapLight } from '@/shared/haptics';
import { appFonts } from '@/shared/theme/typography';

export type BackButtonProps = {
  label?: string;
  onPress?: () => void;
};

/**
 * Premium back button (Phase 6.6.10): white circular/pill button with a
 * chevron, soft shadow, ≥44 px touch target. Defaults to router.back()
 * with a safe fallback to home when there is no history.
 */
export function BackButton({ label, onPress }: BackButtonProps) {
  const router = useRouter();

  const handlePress =
    onPress ??
    (() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        label ? styles.withLabel : null,
        pressed && styles.pressed,
      ]}
      onPress={() => {
        tapLight();
        handlePress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Retour'}
    >
      <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  withLabel: {
    width: undefined,
    paddingLeft: 12,
    paddingRight: 18,
    gap: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  label: {
    color: '#1A1A1A',
    fontFamily: appFonts.heading,
    fontSize: 15,
  },
});
