import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { PrototypeDisclaimerGate } from '@/components/prototype-disclaimer-gate';
import { AudioSettingsProvider } from '@/contexts/audio-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDb } from '@/lib/db/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void (async () => {
      try {
        await initDb();
      } catch (error) {
        console.warn('No se pudo inicializar la base de datos.', error);
      }
    })();
  }, []);

  return (
    <PrototypeDisclaimerGate>
      <AudioSettingsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="repaso" options={{ title: 'Repaso' }} />
            <Stack.Screen name="repaso-session" options={{ title: 'Repaso' }} />
            <Stack.Screen name="misiones" options={{ title: 'Misiones Diarias' }} />
            <Stack.Screen name="modulos" options={{ title: 'Modulos' }} />
            <Stack.Screen name="modulos/tutorial" options={{ title: 'Tutorial' }} />
            <Stack.Screen name="modulos/tutorial-conjunto" options={{ title: 'Tutorial' }} />
            <Stack.Screen name="modulos/la-diabetes" options={{ title: 'La Diabetes' }} />
            <Stack.Screen name="modulos/la-diabetes-clase-1" options={{ title: 'El Pancreas' }} />
            <Stack.Screen name="modulos/la-diabetes-clase-2" options={{ title: 'La diabetes' }} />
            <Stack.Screen name="modulos/la-diabetes-clase-3" options={{ title: 'Los Tipos de Diabetes' }} />
            <Stack.Screen name="modulos/la-diabetes-clase-4" options={{ title: 'Sintomas de la DIabetes' }} />
            <Stack.Screen name="modulos/la-diabetes-quiz-1" options={{ title: 'Quiz' }} />
            <Stack.Screen name="modulos/la-insulinoterapia" options={{ title: 'La Insulinoterapia' }} />
            <Stack.Screen name="modulos/la-insulinoterapia-clase-5" options={{ title: 'Introduccion' }} />
            <Stack.Screen name="modulos/la-insulinoterapia-clase-6" options={{ title: 'Los dos tipos de insulina' }} />
            <Stack.Screen name="modulos/la-insulinoterapia-clase-7" options={{ title: 'Dentro de los tipos de insulina' }} />
            <Stack.Screen name="modulos/la-insulinoterapia-clase-8" options={{ title: 'Métodos de administración' }} />
            <Stack.Screen name="modulos/la-insulinoterapia-quiz-2" options={{ title: 'Quiz' }} />
            <Stack.Screen name="modulos/modulo-3" options={{ title: 'Control de la glucosa' }} />
            <Stack.Screen name="modulos/modulo-3-clase-9" options={{ title: 'Como medir la glucosa' }} />
            <Stack.Screen name="modulos/modulo-3-clase-10" options={{ title: 'Hipoglucemia y hiperglucemia' }} />
            <Stack.Screen name="modulos/modulo-3-clase-11" options={{ title: 'Cuidados practicos de la insulinoterapia' }} />
            <Stack.Screen name="modulos/modulo-3-clase-12" options={{ title: 'Objetivos glucemicos' }} />
            <Stack.Screen name="modulos/modulo-3-clase/[claseId]" options={{ title: 'Clase' }} />
            <Stack.Screen name="modulos/modulo-3-quiz-3" options={{ title: 'Quiz' }} />
            <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AudioSettingsProvider>
    </PrototypeDisclaimerGate>
  );
}
