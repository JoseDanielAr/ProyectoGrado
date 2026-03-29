import { Audio } from 'expo-av'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'

import { useAudioSettings } from '@/contexts/audio-settings-context'
import { useMenuButtonSfx } from '@/hooks/use-menu-button-sfx'
import { getActiveUsuario } from '@/lib/db/usuario-repo'

// Colores únicos de la pantalla: blanco para fondo y azul para acciones/interfaz.
const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
// Azul secundario reservado para elementos de apoyo visual.
const BLUE_SECONDARY = '#1B78BA'

interface MenuButton {
  label: string
  onPress: () => void
}

function PrimaryButton({ label, onPress }: MenuButton) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      {/* Texto del botón en blanco para máximo contraste sobre el azul */}
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

export default function HomeScreen() {
  const router = useRouter()
  const { musicVolume, isMusicTemporarilyMuted } = useAudioSettings()
  const { playMenuButtonTap } = useMenuButtonSfx()
  const menuMusicRef = useRef<Audio.Sound | null>(null)
  const effectiveMusicVolume = isMusicTemporarilyMuted ? 0 : musicVolume

  const [puntaje, setPuntaje] = useState(0)
  const [racha, setRacha] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function startMenuMusic() {
      try {
        // Cargamos y reproducimos la música del menú en bucle.
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/Musica/Menu.mp3'),
          {
            isLooping: true,
            shouldPlay: true,
            volume: effectiveMusicVolume,
          }
        )

        if (!isMounted) {
          await sound.unloadAsync()
          return
        }

        menuMusicRef.current = sound
      } catch (error) {
        // Evitamos romper la UI si el audio falla (por ejemplo, si falta el archivo).
        console.warn('No se pudo cargar la música del menú.', error)
      }
    }

    startMenuMusic()

    // Liberamos memoria al salir de la pantalla para no solapar audios.
    return () => {
      isMounted = false
      if (!menuMusicRef.current) return
      menuMusicRef.current.unloadAsync().catch(() => {})
      menuMusicRef.current = null
    }
  }, [])

  useEffect(() => {
    // Sincronizamos el volumen del audio actual con el valor global de ajustes.
    if (!menuMusicRef.current) return
    menuMusicRef.current.setVolumeAsync(effectiveMusicVolume).catch(() => {})
  }, [effectiveMusicVolume])

  useFocusEffect(
    useCallback(() => {
      let isActive = true

      async function loadUserStats() {
        try {
          const usuario = await getActiveUsuario()
          if (!isActive) return
          setPuntaje(usuario.Puntaje)
          setRacha(usuario.Racha)
        } catch (error) {
          console.warn('No se pudo leer el usuario activo.', error)
        }
      }

      void loadUserStats()
      return () => {
        isActive = false
      }
    }, [])
  )

  // Esta función mantiene los botones funcionales mientras creamos las rutas finales.
  function showComingSoon(featureName: string) {
    Alert.alert('Próximamente', `${featureName} estará disponible en una siguiente versión.`)
  }

  // Cada acción del menú reproduce primero el SFX y luego ejecuta la acción real.
  function withMenuTap(action: () => void) {
    return () => {
      void playMenuButtonTap()
      action()
    }
  }

  const menuButtons: MenuButton[] = [
    { label: 'Modulos', onPress: withMenuTap(() => showComingSoon('Modulos')) },
    { label: 'Repaso', onPress: withMenuTap(() => showComingSoon('Repaso')) },
    { label: 'Misiones Diarias', onPress: withMenuTap(() => showComingSoon('Misiones Diarias')) },
    { label: 'Prueba', onPress: withMenuTap(() => router.push('/prueba')) },
    { label: 'Ajustes', onPress: withMenuTap(() => router.push('/settings')) },
  ]

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {/* 1) Logo del icono en la parte superior */}
        <Image
          source={require('@/assets/InsulinApp/Logo/logoIcono.png')}
          contentFit="contain"
          style={styles.logoIcon}
          accessibilityLabel="Logo ícono de InsulinApp"
        />

        {/* 2) Logo de texto debajo del ícono */}
        <Image
          source={require('@/assets/InsulinApp/Logo/LogoTexto.png')}
          contentFit="contain"
          style={styles.logoText}
          accessibilityLabel="Logo de texto InsulinApp"
        />

        {/* 3) Tarjetas de puntaje y racha lado a lado */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Puntaje</Text>
            <Text style={styles.statValue}>{puntaje}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Racha</Text>
            <Text style={styles.statValue}>{racha}</Text>
          </View>
        </View>

        {/* Línea divisoria sutil para separar métricas de la botonera principal */}
        <View style={styles.separator} />

        {/* 4-7) Botonera principal del menú */}
        <View style={styles.buttonsContainer}>
          {menuButtons.map(button => (
            <PrimaryButton key={button.label} label={button.label} onPress={button.onPress} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: WHITE,
  },
  logoIcon: {
    width: 164,
    height: 164,
    marginTop: 4,
  },
  logoText: {
    width: 238,
    height: 58,
    marginTop: 2,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  statCard: {
    flex: 1,
    borderColor: BLUE_SECONDARY,
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
  statTitle: {
    color: BLUE_SECONDARY,
    fontSize: 16,
    fontWeight: '700',
  },
  statValue: {
    color: BLUE_SECONDARY,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  // Divisor gris fino entre tarjetas y acciones para mejorar jerarquía visual.
  separator: {
    width: '100%',
    height: 1,
    marginTop: 18,
    backgroundColor: '#D9D9D9',
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  button: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})
