import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';

export default function SavedMachinesScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.topSpacer} />
      <AppText variant="title">Machines sauvegardées</AppText>
      <Card style={styles.empty}>
        <AppText variant="subtitle">Aucune machine enregistrée</AppText>
        <AppText variant="body" color="textSecondary">
          Scanne une machine puis sauvegarde-la pour la retrouver ici.
        </AppText>
        <Link href="/camera" asChild>
          <PrimaryButton label="Scanner une machine" />
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'stretch' },
  topSpacer: { height: 8 },
  empty: { marginTop: 16, gap: 12, alignItems: 'flex-start' },
});