import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, useColorScheme } from "react-native";

import { initMachineScanDatabase } from "@/features/machine-scan/storage";
import { AppText, Screen } from "@/shared/components";
import { useAppTheme } from "@/shared/theme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const appTheme = useAppTheme();
  const [initState, setInitState] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    initMachineScanDatabase().then((result) => {
      if (cancelled) return;
      setInitState(result.ok ? "ready" : "error");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (initState === "loading") {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={appTheme.colors.primary} />
        <AppText variant="body" color="textSecondary" align="center">
          Préparation de l’espace de stockage…
        </AppText>
      </Screen>
    );
  }

  if (initState === "error") {
    return (
      <Screen style={styles.center}>
        <AppText variant="title" color="danger" align="center">
          Stockage indisponible
        </AppText>
        <AppText variant="body" color="textSecondary" align="center">
          La base locale n’a pas pu être initialisée. Redémarre l’app.
        </AppText>
      </Screen>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="scan-result" />
        <Stack.Screen name="saved-machines" />
        <Stack.Screen name="machine/[id]" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
});
