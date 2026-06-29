import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import {
  SavedMachineCard,
  SavedMachinesEmptyState,
} from '@/features/machine-scan/components';
import {
  listSavedMachineScans,
  type StorageErrorKind,
} from '@/features/machine-scan/storage';
import type { MachineScan } from '@/features/machine-scan/types';
import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';
import { spacing, useAppTheme } from '@/shared/theme';

type ListState =
  | { status: 'loading' }
  | { status: 'success'; machines: MachineScan[] }
  | { status: 'error'; kind: StorageErrorKind };

export default function SavedMachinesScreen() {
  const theme = useAppTheme();
  const [state, setState] = useState<ListState>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setState({ status: 'loading' });
      listSavedMachineScans().then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setState({ status: 'success', machines: result.data });
        } else {
          setState({ status: 'error', kind: result.error.kind });
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const renderContent = () => {
    if (state.status === 'loading') {
      return (
        <Card style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.primary} />
          <AppText variant="body" color="textSecondary" align="center">
            Chargement des machines…
          </AppText>
        </Card>
      );
    }

    if (state.status === 'error') {
      return (
        <Card style={styles.stateCard}>
          <AppText variant="subtitle" color="danger">
            Chargement impossible
          </AppText>
          <AppText variant="body" color="textSecondary">
            Les machines sauvegardées sont indisponibles pour le moment.
          </AppText>
        </Card>
      );
    }

    if (state.machines.length === 0) {
      return <SavedMachinesEmptyState />;
    }

    return (
      <FlatList
        data={state.machines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SavedMachineCard machine={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Machines sauvegardées</AppText>
        <Link href="/camera" replace asChild>
          <PrimaryButton label="Scanner une machine" variant="ghost" />
        </Link>
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'stretch',
  },
  content: {
    flex: 1,
  },
  stateCard: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  separator: {
    height: spacing.sm,
  },
});
