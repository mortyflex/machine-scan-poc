import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

export type PhotoFallbackCardProps = {
  imageUri: string;
  variant?: 'loading' | 'validation' | 'details';
};

/**
 * Shared honest photo fallback (Phase 6.6.2): a premium white card that the
 * photo fills entirely with a cover-style crop — wide, centered, no narrow
 * vertical strip, no deformation. Used by every no-cutout state so loading,
 * validation, and details stay visually consistent. This is a photo
 * preview, never presented as an object cutout.
 */
export function PhotoFallbackCard({
  imageUri,
  variant = 'validation',
}: PhotoFallbackCardProps) {
  return (
    <View style={[styles.card, variantStyles[variant]]}>
      <Image
        source={{ uri: imageUri }}
        style={styles.photo}
        contentFit="cover"
        transition={150}
      />
    </View>
  );
}

const variantStyles: Record<
  NonNullable<PhotoFallbackCardProps['variant']>,
  ViewStyle
> = {
  loading: {
    width: '86%',
    maxWidth: 380,
    height: 280,
    borderRadius: 30,
  },
  validation: {
    width: '86%',
    maxWidth: 380,
    height: 280,
    borderRadius: 30,
  },
  details: {
    width: '100%',
    height: 280,
    borderRadius: 24,
  },
};

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
