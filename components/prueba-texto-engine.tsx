import { Audio } from 'expo-av'
import { Image } from 'expo-image'
import TypeWriter from 'react-native-typewriter'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAudioSettings } from '@/contexts/audio-settings-context'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'

/**
 * Vocabulario de guion (órdenes entre paréntesis al final de una línea numerada):
 *
 * - `(Shift to <Nombre>)` — cambio de imagen con transición: fade out → cambio → fade in (Animated).
 * - `(Cut to <Nombre>)` — cambio de imagen inmediato, sin fundido.
 *
 * `<Nombre>` puede ser `default` (mascota animada Base/Habla) o una clave definida en `imageAssetMap`.
 * Compatibilidad: si usas solo `customImageSource` + `imageCommands` legacy, `custom` sigue siendo la clave interna.
 */
const LEGACY_CUSTOM_KEY = '__legacy_custom__'

interface PruebaTextoEngineProps {
  title: string
  textSource: string
  /** Tras el último paso, si el usuario toca de nuevo (sin más líneas), se dispara este callback. */
  onAttemptAdvancePastEnd?: () => void
  muteBackgroundMusic?: boolean
  /** Mapa nombre → imagen estática para órdenes Shift/Cut del guion. */
  imageAssetMap?: Record<string, ImageSourcePropType>
  /** @deprecated Preferir guion con (Shift to …) / (Cut to …) y `imageAssetMap`. */
  customImageSource?: ImageSourcePropType
  /** @deprecated Preferir guion con paréntesis. */
  imageCommands?: PruebaTextoImageCommand[]
}

export interface PruebaTextoImageCommand {
  step: number
  target: 'default' | 'custom'
}

export interface ImageDirective {
  transition: 'shift' | 'cut'
  targetKey: string
}

export function PruebaTextoEngine({
  title,
  textSource,
  onAttemptAdvancePastEnd,
  muteBackgroundMusic = false,
  imageAssetMap = {},
  customImageSource,
  imageCommands = [],
}: PruebaTextoEngineProps) {
  const { setMusicTemporarilyMuted, sfxVolume } = useAudioSettings()

  const { displayTexts, directiveByStep } = useMemo(
    () => mergeScriptAndLegacyCommands(textSource, imageCommands),
    [textSource, imageCommands]
  )

  const mascotTalkSfxRef = useRef<Audio.Sound | null>(null)
  const [isMascotTalkSfxReady, setIsMascotTalkSfxReady] = useState(false)

  const [stepIndex, setStepIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [isMascotTalkingFrame, setIsMascotTalkingFrame] = useState(false)

  /** default = mascota Base/Habla animada; static = una sola imagen fija. */
  const [visualMode, setVisualMode] = useState<'default' | 'static'>('default')
  const [staticSource, setStaticSource] = useState<ImageSourcePropType | null>(null)

  const mascotOpacity = useRef(new Animated.Value(1)).current
  // Evita reaplicar la directiva del mismo paso si el efecto se dispara más de una vez.
  const lastImageDirectiveStepIndexRef = useRef<number | null>(null)

  useEffect(() => {
    if (!muteBackgroundMusic) return

    setMusicTemporarilyMuted(true)
    return () => setMusicTemporarilyMuted(false)
  }, [muteBackgroundMusic, setMusicTemporarilyMuted])

  useEffect(() => {
    let isMounted = true

    async function loadMascotTalkSfx() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/Sfx/SFXMascotaHabla.mp3'),
          {
            shouldPlay: false,
            isLooping: true,
            volume: sfxVolume,
          }
        )

        if (!isMounted) {
          await sound.unloadAsync()
          return
        }

        mascotTalkSfxRef.current = sound
        setIsMascotTalkSfxReady(true)
      } catch (error) {
        console.warn('No se pudo cargar el SFX de habla de la mascota.', error)
      }
    }

    void loadMascotTalkSfx()

    return () => {
      isMounted = false
      setIsMascotTalkSfxReady(false)
      if (!mascotTalkSfxRef.current) return
      mascotTalkSfxRef.current.unloadAsync().catch(() => {})
      mascotTalkSfxRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isTyping) {
      setIsMascotTalkingFrame(false)
      return
    }

    const animationInterval = setInterval(() => {
      setIsMascotTalkingFrame(previousFrame => !previousFrame)
    }, 300)

    return () => clearInterval(animationInterval)
  }, [isTyping])

  useEffect(() => {
    if (!isMascotTalkSfxReady) return

    async function syncTalkingAudio() {
      const sound = mascotTalkSfxRef.current
      if (!sound) return

      try {
        await sound.setVolumeAsync(sfxVolume)

        if (isTyping) {
          await sound.playAsync()
          return
        }

        await sound.stopAsync()
      } catch {
        // Ignorar fallos puntuales de audio.
      }
    }

    void syncTalkingAudio()
  }, [isTyping, sfxVolume, isMascotTalkSfxReady])

  useEffect(() => {
    if (lastImageDirectiveStepIndexRef.current === stepIndex) return
    lastImageDirectiveStepIndexRef.current = stepIndex

    const stepNumber = stepIndex + 1
    const directive = directiveByStep.get(stepNumber)
    if (!directive) return

    const resolved = resolveImageTarget(directive.targetKey, imageAssetMap, customImageSource)
    if (!resolved.ok) return

    const nextMode = resolved.mode
    const nextStatic = resolved.staticSource

    if (directive.transition === 'cut') {
      mascotOpacity.stopAnimation()
      mascotOpacity.setValue(1)
      setVisualMode(nextMode)
      setStaticSource(nextStatic)
      return
    }

    // Shift: fade out → swap → fade in
    Animated.timing(mascotOpacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return
      setVisualMode(nextMode)
      setStaticSource(nextStatic)
      Animated.timing(mascotOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start()
    })
  }, [customImageSource, directiveByStep, imageAssetMap, mascotOpacity, stepIndex])

  function handleTextBoxPress() {
    if (isTyping) {
      setIsTyping(false)
      return
    }

    const nextIndex = stepIndex + 1
    if (nextIndex >= displayTexts.length) {
      onAttemptAdvancePastEnd?.()
      return
    }
    setStepIndex(nextIndex)
    setIsTyping(true)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.storyBody}>
          <View style={styles.imageStage} accessibilityElementsHidden>
            <Animated.View style={[styles.mascotLayer, { opacity: mascotOpacity }]}>
              <Image
                source={
                  visualMode === 'static' && staticSource
                    ? staticSource
                    : isMascotTalkingFrame
                      ? require('@/assets/InsulinApp/Mascota/MascotaHabla.png')
                      : require('@/assets/InsulinApp/Mascota/MascotaBase.png')
                }
                contentFit="contain"
                style={styles.mascotImage}
              />
            </Animated.View>
          </View>

          <Pressable
            onPress={handleTextBoxPress}
            style={styles.textBox}
            accessibilityRole="button"
            accessibilityLabel="Caja de texto. Toca para avanzar el dialogo.">
            <Text style={styles.textHint}>Toca para continuar</Text>
            <View style={styles.textContent}>
              {isTyping ? (
                <TypeWriter
                  key={stepIndex}
                  style={styles.typeText}
                  typing={1}
                  minDelay={10}
                  maxDelay={22}
                  onTypingEnd={() => setIsTyping(false)}>
                  {displayTexts[stepIndex] ?? ''}
                </TypeWriter>
              ) : (
                <Text style={styles.typeText}>{displayTexts[stepIndex] ?? ''}</Text>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

export function mergeScriptAndLegacyCommands(
  source: string,
  legacy: PruebaTextoImageCommand[]
): { displayTexts: string[]; directiveByStep: Map<number, ImageDirective> } {
  const { displayTexts, directiveByStep } = parseNumberedScript(source)

  legacy.forEach(command => {
    if (directiveByStep.has(command.step)) return
    directiveByStep.set(command.step, {
      transition: 'shift',
      targetKey: command.target === 'default' ? 'default' : LEGACY_CUSTOM_KEY,
    })
  })

  return { displayTexts, directiveByStep }
}

export function parseNumberedScript(source: string): { displayTexts: string[]; directiveByStep: Map<number, ImageDirective> } {
  const directiveByStep = new Map<number, ImageDirective>()
  const displayTexts: string[] = []

  const lines = source
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s*(.*)$/)
    if (!match) continue

    const stepNumber = Number(match[1])
    let remainder = match[2]?.trim() ?? ''

    const parenMatch = remainder.match(/\s*\((Shift|Cut)\s+to\s+([^)]+)\)\s*$/i)
    if (parenMatch) {
      const transition = parenMatch[1].toLowerCase() === 'cut' ? 'cut' : 'shift'
      const targetKey = parenMatch[2].trim()
      remainder = remainder.slice(0, parenMatch.index).trim()
      directiveByStep.set(stepNumber, { transition, targetKey })
    }

    const quoted = remainder.match(/^"(.*)"$/)
    const displayText = quoted ? quoted[1] : remainder

    displayTexts.push(displayText)
  }

  if (!displayTexts.length) displayTexts.push('')
  return { displayTexts, directiveByStep }
}

export function resolveImageTarget(
  key: string,
  imageAssetMap: Record<string, ImageSourcePropType>,
  legacyCustom?: ImageSourcePropType
): { ok: true; mode: 'default' | 'static'; staticSource: ImageSourcePropType | null } | { ok: false } {
  const normalized = key.trim()
  const lower = normalized.toLowerCase()

  if (lower === 'default') return { ok: true, mode: 'default', staticSource: null }

  if (normalized === LEGACY_CUSTOM_KEY || lower === 'custom') {
    if (!legacyCustom) return { ok: false }
    return { ok: true, mode: 'static', staticSource: legacyCustom }
  }

  const direct = imageAssetMap[normalized]
  if (direct) return { ok: true, mode: 'static', staticSource: direct }

  const insensitiveKey = Object.keys(imageAssetMap).find(k => k.toLowerCase() === lower)
  if (insensitiveKey) {
    return { ok: true, mode: 'static', staticSource: imageAssetMap[insensitiveKey] }
  }

  return { ok: false }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: WHITE,
  },
  title: {
    color: BLUE,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
  },
  storyBody: {
    flex: 1,
  },
  imageStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  mascotLayer: {
    width: '100%',
    height: '100%',
  },
  textBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    padding: 14,
    backgroundColor: WHITE,
  },
  textContent: {
    flex: 1,
  },
  textHint: {
    color: BLUE_SECONDARY,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    opacity: 0.85,
  },
  typeText: {
    color: BLUE_SECONDARY,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
})
