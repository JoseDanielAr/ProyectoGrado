import { Audio } from 'expo-av'
import { useCallback, useEffect, useRef } from 'react'

import { useAudioSettings } from '@/contexts/audio-settings-context'

/**
 * Precarga el efecto de botón del menú y expone `playMenuButtonTap()` para usarlo
 * en cualquier botón del menú principal, respetando el volumen global de SFX.
 */
export function useMenuButtonSfx() {
  const { sfxVolume } = useAudioSettings()
  const soundRef = useRef<Audio.Sound | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadSfx() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/Sfx/Boton1.mp3'),
          { shouldPlay: false, volume: sfxVolume }
        )
        if (!isMounted) {
          await sound.unloadAsync()
          return
        }
        soundRef.current = sound
      } catch (error) {
        console.warn('No se pudo cargar el efecto de botón.', error)
      }
    }

    void loadSfx()

    return () => {
      isMounted = false
      if (!soundRef.current) return
      soundRef.current.unloadAsync().catch(() => {})
      soundRef.current = null
    }
  }, [])

  const playMenuButtonTap = useCallback(async () => {
    const sound = soundRef.current
    if (!sound) return

    try {
      await sound.setVolumeAsync(sfxVolume)
      await sound.setPositionAsync(0)
      await sound.playAsync()
    } catch {
      // Ignoramos fallos puntuales para no interrumpir la navegación.
    }
  }, [sfxVolume])

  return { playMenuButtonTap }
}
