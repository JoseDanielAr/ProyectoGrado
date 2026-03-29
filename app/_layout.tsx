import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AudioSettingsProvider } from '@/contexts/audio-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDb } from '@/lib/db/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initDb().catch(error => console.warn('No se pudo inicializar la base de datos.', error));
  }, []);

  return (
    <AudioSettingsProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="prueba" options={{ title: 'Prueba' }} />
          <Stack.Screen name="prueba-texto" options={{ title: 'Texto' }} />
          <Stack.Screen name="prueba-engine" options={{ title: 'engine' }} />
          <Stack.Screen name="prueba-imagenes" options={{ title: 'Imagenes' }} />
          <Stack.Screen name="prueba-bounding-boxes" options={{ title: 'Bounding Boxes' }} />
          <Stack.Screen name="prueba-bounding-box-engine" options={{ title: 'Bounding Box engine' }} />
          <Stack.Screen name="prueba-test" options={{ title: 'Test' }} />
          <Stack.Screen name="prueba-engine-test" options={{ title: 'Engine Test' }} />
          <Stack.Screen name="prueba-conjunto" options={{ title: 'Conjunto' }} />
          <Stack.Screen name="prueba-db" options={{ title: 'Pruebas DB' }} />
          <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AudioSettingsProvider>
  );
}
