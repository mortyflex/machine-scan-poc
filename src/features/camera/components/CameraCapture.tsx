import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
  type CameraCapturedPicture,
} from 'expo-camera';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';
import { appFonts } from '@/shared/theme/typography';

type CaptureState =
  | { status: 'idle' }
  | { status: 'capturing' }
  | { status: 'error'; message: string };

export function CameraCapture() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capture, setCapture] = useState<CaptureState>({ status: 'idle' });
  const cameraRef = useRef<CameraView>(null);

  const frameWidth = Math.min(width * 0.82, 360);
  const frameHeight = frameWidth * 0.64;

  useEffect(() => {
    if (permission === null) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = useCallback(async () => {
    const ref = cameraRef.current;
    if (!ref || !cameraReady) return;
    setCapture({ status: 'capturing' });
    try {
      const picture: CameraCapturedPicture = await ref.takePictureAsync({
        quality: 0.8,
      });
      if (!picture?.uri) {
        setCapture({ status: 'error', message: 'Aucune image capturée.' });
        return;
      }
      router.replace({
        pathname: '/scan-result',
        params: { imageUri: picture.uri },
      });
    } catch (error) {
      setCapture({
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Erreur lors de la capture.',
      });
    }
  }, [cameraReady, router]);

  if (permission === null) {
    return (
      <Screen style={styles.center}>
        <AppText variant="body" color="textSecondary" align="center">
          Vérification des permissions caméra…
        </AppText>
      </Screen>
    );
  }

  if (!permission.granted) {
    const denied = permission.status === 'denied' && !permission.canAskAgain;
    return (
      <Screen style={styles.center}>
        <Card style={styles.deniedCard}>
          <AppText variant="title" align="center">
            Accès caméra refusé
          </AppText>
          <AppText variant="body" color="textSecondary" align="center">
            {denied
              ? "L'accès à la caméra a été refusé. Active-la dans les réglages de l'app."
              : "L'app a besoin de la caméra pour scanner une machine."}
          </AppText>
          <PrimaryButton
            label="Redemander la permission"
            onPress={() => void requestPermission()}
          />
        </Card>
      </Screen>
    );
  }

  const capturing = capture.status === 'capturing';

  return (
    <View style={styles.screen}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onMountError={(event) =>
          setCapture({
            status: 'error',
            message: event.message || 'La caméra est indisponible.',
          })
        }
      />

      <View style={styles.scrim} pointerEvents="none" />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <Pressable
            style={styles.topButton}
            onPress={() => router.replace('/')}
            hitSlop={12}
          >
            <Text style={styles.topButtonText}>Annuler</Text>
          </Pressable>
          <Text style={styles.topTitle}>Scanner une machine</Text>
          <View style={styles.topButtonPlaceholder} />
        </View>

        <View style={styles.frameArea} pointerEvents="none">
          <View style={[styles.frame, { width: frameWidth, height: frameHeight }]}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.instruction}>
            Place la machine dans le cadre
          </Text>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 18 }]}>
          {capture.status === 'error' ? (
            <Card style={styles.errorCard}>
              <AppText variant="subtitle" color="danger">
                Capture impossible
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {capture.message}
              </AppText>
            </Card>
          ) : null}

          <View style={styles.captureRow}>
            <View style={styles.sidePlaceholder} />
            <Pressable
              style={[
                styles.captureButton,
                (!cameraReady || capturing) && styles.captureButtonDisabled,
              ]}
              onPress={handleCapture}
              disabled={!cameraReady || capturing}
            >
              {capturing ? (
                <ActivityIndicator color="#111418" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </Pressable>
            <View style={styles.sidePlaceholder} />
          </View>

          <Text style={styles.captureHint}>
            {capturing
              ? 'Capture…'
              : cameraReady
                ? 'Appuie pour capturer'
                : 'Initialisation de la caméra…'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const CORNER = 28;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  deniedCard: { alignItems: 'center', gap: 12, width: '100%' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  topButtonText: {
    color: '#FFFFFF',
    fontFamily: appFonts.bodySemiBold,
    fontSize: 16,
  },
  topButtonPlaceholder: {
    width: 64,
  },
  topTitle: {
    color: '#FFFFFF',
    fontFamily: appFonts.heading,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  frameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  frame: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: -CORNER_WIDTH / 2,
    left: -CORNER_WIDTH / 2,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: -CORNER_WIDTH / 2,
    right: -CORNER_WIDTH / 2,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: -CORNER_WIDTH / 2,
    left: -CORNER_WIDTH / 2,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: -CORNER_WIDTH / 2,
    right: -CORNER_WIDTH / 2,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 8,
  },
  instruction: {
    color: '#FFFFFF',
    fontFamily: appFonts.bodySemiBold,
    fontSize: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomBar: {
    alignItems: 'center',
    gap: 10,
  },
  errorCard: {
    gap: 6,
    width: '88%',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  sidePlaceholder: {
    width: 40,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  captureHint: {
    color: '#FFFFFF',
    fontFamily: appFonts.bodyMedium,
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
