import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { getActiveUsuario } from '@/lib/db/usuario-repo'

/** La música de fondo suena a este factor del valor configurado en Ajustes (p. ej. 100% → 5% real). */
export const MUSIC_PLAYBACK_VOLUME_FACTOR = 0.05

export function getPlaybackMusicVolume({
  musicVolume,
  isMusicTemporarilyMuted,
}: {
  musicVolume: number
  isMusicTemporarilyMuted: boolean
}) {
  if (isMusicTemporarilyMuted) return 0
  return musicVolume * MUSIC_PLAYBACK_VOLUME_FACTOR
}

interface AudioSettingsContextValue {
  musicVolume: number
  /** Volumen real de reproducción de música de fondo (ajuste × factor 1/3). */
  playbackMusicVolume: number
  setMusicVolume: (nextVolume: number) => void
  /** Silencio temporal para música en pantallas específicas (sin tocar ajustes globales). */
  isMusicTemporarilyMuted: boolean
  setMusicTemporarilyMuted: (isMuted: boolean) => void
  /** Volumen global de efectos de sonido (0–1), para cualquier SFX futuro. */
  sfxVolume: number
  setSfxVolume: (nextVolume: number) => void
}

const AudioSettingsContext = createContext<AudioSettingsContextValue | null>(null)

interface AudioSettingsProviderProps {
  children: ReactNode
}

export function AudioSettingsProvider({ children }: AudioSettingsProviderProps) {
  // Estado global de volumen para reutilizar en cualquier música actual o futura.
  const [musicVolume, setMusicVolumeState] = useState(0.6)
  // Bandera para mutear temporalmente la música en una pantalla puntual.
  const [isMusicTemporarilyMuted, setMusicTemporarilyMuted] = useState(false)
  // Volumen independiente para efectos (clics, aciertos, etc.).
  const [sfxVolume, setSfxVolumeState] = useState(0.75)
  // Evita renderizar la app con volúmenes por defecto antes de leer DB.
  const [isHydratedFromDb, setIsHydratedFromDb] = useState(false)

  const setMusicVolume = useCallback((nextVolume: number) => {
    // Limitamos el valor para mantenerlo siempre entre 0 y 1.
    const clampedVolume = Math.max(0, Math.min(1, nextVolume))
    setMusicVolumeState(clampedVolume)
  }, [])

  const setSfxVolume = useCallback((nextVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, nextVolume))
    setSfxVolumeState(clampedVolume)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadSavedAudioFromDb() {
      try {
        const usuario = await getActiveUsuario()
        if (!isMounted) return
        setMusicVolume(usuario.ConfMusica)
        setSfxVolume(usuario.ConfSFX)
      } catch (error) {
        console.warn('No se pudo cargar la configuración de audio desde DB.', error)
      } finally {
        if (!isMounted) return
        setIsHydratedFromDb(true)
      }
    }

    void loadSavedAudioFromDb()
    return () => {
      isMounted = false
    }
  }, [])

  const playbackMusicVolume = getPlaybackMusicVolume({
    musicVolume,
    isMusicTemporarilyMuted,
  })

  const value = useMemo(
    () => ({
      musicVolume,
      playbackMusicVolume,
      setMusicVolume,
      isMusicTemporarilyMuted,
      setMusicTemporarilyMuted,
      sfxVolume,
      setSfxVolume,
    }),
    [
      musicVolume,
      playbackMusicVolume,
      setMusicVolume,
      isMusicTemporarilyMuted,
      sfxVolume,
      setSfxVolume,
    ]
  )

  if (!isHydratedFromDb) return null

  return <AudioSettingsContext.Provider value={value}>{children}</AudioSettingsContext.Provider>
}

export function useAudioSettings() {
  const context = useContext(AudioSettingsContext)
  if (context) return context

  throw new Error('useAudioSettings debe usarse dentro de AudioSettingsProvider.')
}
