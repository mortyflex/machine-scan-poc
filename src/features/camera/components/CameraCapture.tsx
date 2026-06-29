import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
  type CameraCapturedPicture,
} from 'expo-camera';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';

type CaptureState =
  | { status: 'idle' }
  | { status: 'capturing' }
  | { status: 'error'; message: string };

export function CameraCapture() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capture, setCapture] = useState<CaptureState>({ status: 'idle' });
  const cameraRef = useRef<CameraView>(null);

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
              : 'L\'app a besoin de la caméra pour scanner une machine.'}
          </AppText>
          <PrimaryButton
            label="Redemander la permission"
            onPress={() => void requestPermission()}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen safe={false} style={styles.screen}>
      <CameraView
        ref={cameraRef}
        style={styles.preview}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onMountError={(event) =>
          setCapture({
            status: 'error',
            message: event.message || 'La caméra est indisponible.',
          })
        }
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.overlayTop} />

        <View style={styles.overlayBottom}>
          {capture.status === 'error' && (
            <Card style={styles.errorCard}>
              <AppText variant="subtitle" color="danger">
                Capture impossible
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {capture.message}
              </AppText>
            </Card>
          )}

          <PrimaryButton
            label={
              capture.status === 'capturing'
                ? 'Capture…'
                : cameraReady
                  ? 'Capturer'
                  : 'Initialisation…'
            }
            onPress={handleCapture}
            disabled={capture.status === 'capturing' || !cameraReady}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  deniedCard: { alignItems: 'center', gap: 12, width: '100%' },
  preview: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  overlayTop: { flex: 1 },
  overlayBottom: { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  errorCard: { gap: 6 },
});