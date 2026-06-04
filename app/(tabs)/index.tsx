import { Audio } from 'expo-av'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'

import { useAudioSettings } from '@/contexts/audio-settings-context'
import { useMenuButtonSfx } from '@/hooks/use-menu-button-sfx'
import { getActiveUsuario } from '@/lib/db/usuario-repo'
import { isTodayMissionCompleted, syncDailyMision } from '@/lib/misiones/misiones-repo'

// Colores únicos de la pantalla: blanco para fondo y azul para acciones/interfaz.
const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
// Azul secundario reservado para elementos de apoyo visual.
const BLUE_SECONDARY = '#1B78BA'
const ORANGE = '#D97706'
const ORANGE_SECONDARY = '#B45309'

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
  const { playbackMusicVolume } = useAudioSettings()
  const { playMenuButtonTap } = useMenuButtonSfx()
  const menuMusicRef = useRef<Audio.Sound | null>(null)

  const [puntaje, setPuntaje] = useState(0)
  const [racha, setRacha] = useState(0)
  const [isRachaHighlighted, setIsRachaHighlighted] = useState(false)

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
            volume: playbackMusicVolume,
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
    menuMusicRef.current.setVolumeAsync(playbackMusicVolume).catch(() => {})
  }, [playbackMusicVolume])

  useFocusEffect(
    useCallback(() => {
      let isActive = true

      async function loadUserStats() {
        try {
          await syncDailyMision()
          const [usuario, missionCompletedToday] = await Promise.all([
            getActiveUsuario(),
            isTodayMissionCompleted(),
          ])
          if (!isActive) return
          setPuntaje(usuario.Puntaje)
          setRacha(usuario.Racha)
          setIsRachaHighlighted(missionCompletedToday)
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

  // Cada acción del menú reproduce primero el SFX y luego ejecuta la acción real.
  function withMenuTap(action: () => void) {
    return () => {
      void playMenuButtonTap()
      action()
    }
  }

  const menuButtons: MenuButton[] = [
    { label: 'Modulos', onPress: withMenuTap(() => router.push('/modulos')) },
    // Repaso y Misiones quedarán conectados cuando se definan sus pantallas.
    { label: 'Repaso', onPress: withMenuTap(() => router.push('/repaso')) },
    { label: 'Misiones Diarias', onPress: withMenuTap(() => router.push('/misiones')) },
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
          <View
            style={[
              styles.statCard,
              isRachaHighlighted && styles.statCardRachaHighlight,
            ]}>
            <Text style={[styles.statTitle, isRachaHighlighted && styles.statTitleRachaHighlight]}>
              Racha
            </Text>
            <Text style={[styles.statValue, isRachaHighlighted && styles.statValueRachaHighlight]}>
              {racha}
            </Text>
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
  statCardRachaHighlight: {
    borderColor: ORANGE_SECONDARY,
  },
  statTitleRachaHighlight: {
    color: ORANGE,
  },
  statValueRachaHighlight: {
    color: ORANGE_SECONDARY,
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
    gap: 20,
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
