import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';

export default function HomeScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.topSpacer} />

      <View style={styles.header}>
        <AppText variant="display">Machine Scan</AppText>
        <AppText variant="body" color="textSecondary" align="center">
          Photographie une machine de gym pour identifier son nom, ses muscles
          et les exercices possibles.
        </AppText>
      </View>

      <View style={styles.main} />

      <View style={styles.actions}>
        <Link href="/camera" asChild>
          <PrimaryButton label="Scanner une machine" />
        </Link>
        <Link href="/saved-machines" asChild>
          <PrimaryButton label="Machines sauvegardées" variant="ghost" />
        </Link>
      </View>

      <Card style={styles.hint}>
        <AppText variant="caption" color="textSecondary">
          Mode démo disponible — la reconnaissance IA simulée arrive dans une
          prochaine phase.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'stretch',
  },
  topSpacer: {
    height: 24,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  main: { flexGrow: 1 },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  hint: {
    marginBottom: 8,
  },
});