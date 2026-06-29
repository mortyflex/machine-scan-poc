import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{}}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ title: 'Caméra' }} />
        <Stack.Screen name="scan-result" options={{ title: 'Résultat' }} />
        <Stack.Screen name="saved-machines" options={{ title: 'Sauvegardées' }} />
        <Stack.Screen name="machine/[id]" options={{ title: 'Machine' }} />
      </Stack>
    </ThemeProvider>
  );
}