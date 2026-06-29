import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '@/shared/components';

export default function MachineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen style={styles.screen}>
      <View style={styles.topSpacer} />
      <AppText variant="caption" color="textMuted">
        ID : {id ?? 'inconnu'}
      </AppText>
      <AppText variant="title">Détail de la machine</AppText>
      <Card style={styles.card}>
        <AppText variant="subtitle" color="textSecondary">
          À venir
        </AppText>
        <AppText variant="body" color="textSecondary">
          Nom, confiance, description, muscles, exercices, instructions,
          erreurs courantes, consignes de sécurité.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'stretch', gap: 12 },
  topSpacer: { height: 8 },
  card: { marginTop: 8, gap: 8 },
});