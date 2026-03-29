import Slider from '@react-native-community/slider'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAudioSettings } from '@/contexts/audio-settings-context'
import { getActiveUsuario, updateActiveUsuarioAudioConfig } from '@/lib/db/usuario-repo'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'

export default function SettingsScreen() {
  const { musicVolume, setMusicVolume, sfxVolume, setSfxVolume } = useAudioSettings()
  const [draftMusicVolume, setDraftMusicVolume] = useState(musicVolume)
  const [draftSfxVolume, setDraftSfxVolume] = useState(sfxVolume)
  const originalVolumesRef = useRef({ music: musicVolume, sfx: sfxVolume })
  const wasSavedRef = useRef(false)

  useFocusEffect(
    useCallback(() => {
      let isActive = true
      wasSavedRef.current = false

      async function loadFromDb() {
        try {
          const usuario = await getActiveUsuario()
          if (!isActive) return
          const baseMusic = usuario.ConfMusica
          const baseSfx = usuario.ConfSFX
          originalVolumesRef.current = { music: baseMusic, sfx: baseSfx }
          setDraftMusicVolume(baseMusic)
          setDraftSfxVolume(baseSfx)
          setMusicVolume(baseMusic)
          setSfxVolume(baseSfx)
        } catch (error) {
          console.warn('No se pudo cargar ajustes guardados de audio.', error)
        }
      }

      void loadFromDb()

      return () => {
        isActive = false
        if (wasSavedRef.current) return
        // Si se sale sin guardar, revertimos al valor persistido en DB.
        setMusicVolume(originalVolumesRef.current.music)
        setSfxVolume(originalVolumesRef.current.sfx)
      }
    }, [setMusicVolume, setSfxVolume])
  )

  function handleMusicSlider(next: number) {
    setDraftMusicVolume(next)
    setMusicVolume(next)
  }

  function handleSfxSlider(next: number) {
    setDraftSfxVolume(next)
    setSfxVolume(next)
  }

  async function handleSave() {
    try {
      const updated = await updateActiveUsuarioAudioConfig({
        confMusica: draftMusicVolume,
        confSfx: draftSfxVolume,
      })
      originalVolumesRef.current = { music: updated.ConfMusica, sfx: updated.ConfSFX }
      wasSavedRef.current = true
      Alert.alert('Ajustes', 'La configuracion se guardo exitosamente.')
    } catch (error) {
      console.warn('No se pudo guardar la configuración de audio en DB.', error)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Esta pantalla sí es scrollable para crecer sin límite en el futuro. */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ajustes</Text>
        <Text style={styles.subtitle}>
          Controla el audio global de la app: música de fondo y efectos de sonido.
        </Text>

        {/* Caja 1: volumen de música (cualquier pista de fondo). */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Volumen de música</Text>
          <Text style={styles.volumeValue}>{Math.round(draftMusicVolume * 100)}%</Text>

          {/* Slider continuo: el valor 0–1 coincide con el volumen de expo-av. */}
          <Slider
            style={styles.slider}
            value={draftMusicVolume}
            onValueChange={handleMusicSlider}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            minimumTrackTintColor={BLUE}
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor={BLUE}
            accessibilityLabel="Control de volumen de música"
            accessibilityHint="Desliza para cambiar el volumen entre 0 y 100 por ciento"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>0%</Text>
            <Text style={styles.sliderLabelText}>100%</Text>
          </View>
        </View>

        {/* Caja 2: volumen de efectos (clics, aciertos, etc.), separada de la música. */}
        <View style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardLabel}>Volumen de efectos de sonido</Text>
          <Text style={styles.volumeValue}>{Math.round(draftSfxVolume * 100)}%</Text>

          <Slider
            style={styles.slider}
            value={draftSfxVolume}
            onValueChange={handleSfxSlider}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            minimumTrackTintColor={BLUE}
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor={BLUE}
            accessibilityLabel="Control de volumen de efectos de sonido"
            accessibilityHint="Desliza para cambiar el volumen de los efectos entre 0 y 100 por ciento"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>0%</Text>
            <Text style={styles.sliderLabelText}>100%</Text>
          </View>
        </View>

        <Pressable
          onPress={() => void handleSave()}
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Guardar ajustes de audio">
          <Text style={styles.saveButtonText}>Guardar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: WHITE,
  },
  title: {
    color: BLUE,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: BLUE_SECONDARY,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 22,
    lineHeight: 22,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    padding: 16,
    backgroundColor: WHITE,
  },
  // Separa visualmente la tarjeta de SFX de la de música.
  cardSpaced: {
    marginTop: 16,
  },
  cardLabel: {
    color: BLUE_SECONDARY,
    fontSize: 16,
    fontWeight: '700',
  },
  volumeValue: {
    color: BLUE,
    fontSize: 36,
    fontWeight: '900',
    marginTop: 6,
  },
  slider: {
    width: '100%',
    height: 44,
    marginTop: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    color: BLUE_SECONDARY,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    width: '100%',
    minHeight: 52,
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})
