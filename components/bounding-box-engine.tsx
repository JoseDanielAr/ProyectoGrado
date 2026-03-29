import { Audio } from 'expo-av'
import { Image } from 'expo-image'
import TypeWriter from 'react-native-typewriter'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType, type LayoutChangeEvent } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAudioSettings } from '@/contexts/audio-settings-context'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'

interface BoundingBoxPixels {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface BoundingBoxEngineProps {
  title: string
  textSource: string
  imageSource: ImageSourcePropType
  imageSizePx: { width: number; height: number }
  boundingBoxPixels: BoundingBoxPixels
  insideResultText?: string
  outsideResultText?: string
  /** Tras mostrar el feedback (bien/mal) y que el usuario pulse la caja de texto otra vez. */
  onInteractionComplete?: () => void
}

export function BoundingBoxEngine({
  title,
  textSource,
  imageSource,
  imageSizePx,
  boundingBoxPixels,
  insideResultText = 'bien',
  outsideResultText = 'mal',
  onInteractionComplete,
}: BoundingBoxEngineProps) {
  const { sfxVolume } = useAudioSettings()
  const correctSfxRef = useRef<Audio.Sound | null>(null)
  const incorrectSfxRef = useRef<Audio.Sound | null>(null)

  const textSteps = useMemo(() => parseNumberedSteps(textSource), [textSource])
  const boundingBoxPercent = useMemo(
    () => toPercentBoundingBox({ imageSizePx, boundingBoxPixels }),
    [boundingBoxPixels, imageSizePx]
  )

  useEffect(() => {
    let isMounted = true

    async function loadSfx() {
      try {
        const [correctLoaded, incorrectLoaded] = await Promise.all([
          Audio.Sound.createAsync(require('@/assets/Sfx/Correcto.mp3'), { shouldPlay: false }),
          Audio.Sound.createAsync(require('@/assets/Sfx/Incorrecto.mp3'), { shouldPlay: false }),
        ])
        if (!isMounted) {
          await correctLoaded.sound.unloadAsync()
          await incorrectLoaded.sound.unloadAsync()
          return
        }
        correctSfxRef.current = correctLoaded.sound
        incorrectSfxRef.current = incorrectLoaded.sound
      } catch (error) {
        console.warn('No se pudieron cargar los SFX de acierto/error del bounding box.', error)
      }
    }

    void loadSfx()

    return () => {
      isMounted = false
      correctSfxRef.current?.unloadAsync().catch(() => {})
      incorrectSfxRef.current?.unloadAsync().catch(() => {})
      correctSfxRef.current = null
      incorrectSfxRef.current = null
    }
  }, [])

  const playTapFeedbackSfx = useCallback(
    async (isInside: boolean) => {
      const sound = isInside ? correctSfxRef.current : incorrectSfxRef.current
      if (!sound) return

      try {
        await sound.setVolumeAsync(sfxVolume)
        await sound.setPositionAsync(0)
        await sound.playAsync()
      } catch {
        // No bloquear la UI por fallos puntuales de audio.
      }
    },
    [sfxVolume]
  )

  const [stepIndex, setStepIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [feedbackText, setFeedbackText] = useState<string | null>(null)
  const [isFeedbackTyping, setIsFeedbackTyping] = useState(false)
  const [isResultLocked, setIsResultLocked] = useState(false)
  const [imageTapArea, setImageTapArea] = useState({ width: 0, height: 0 })

  function handleImageAreaLayout(event: LayoutChangeEvent) {
    // Guardamos dimensiones reales del area tocable para mapear taps.
    const { width, height } = event.nativeEvent.layout
    setImageTapArea({ width, height })
  }

  function handleImagePress(locationX: number, locationY: number) {
    // Failsafe: sin texto completo no se habilita la interacción de imagen.
    if (isTyping) return
    // Solo evaluamos taps si el area ya fue medida.
    if (imageTapArea.width <= 0 || imageTapArea.height <= 0) return
    // Si ya existe resultado final, no permitimos volver a evaluar taps.
    if (isResultLocked) return

    // Convertimos el tap a coordenadas porcentuales del area visible de la imagen.
    const xPercent = locationX / imageTapArea.width
    const yPercent = locationY / imageTapArea.height

    const isInsideBoundingBox =
      xPercent >= boundingBoxPercent.minXPercent &&
      xPercent <= boundingBoxPercent.maxXPercent &&
      yPercent >= boundingBoxPercent.minYPercent &&
      yPercent <= boundingBoxPercent.maxYPercent

    void playTapFeedbackSfx(isInsideBoundingBox)

    // Mostramos resultado en la caja de texto segun caiga dentro o fuera.
    setFeedbackText(isInsideBoundingBox ? insideResultText : outsideResultText)
    setIsFeedbackTyping(true)
    setIsTyping(false)
    setIsResultLocked(true)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* Bloque superior: titulo + caja de texto */}
        <View style={styles.topSection}>
          <Text style={styles.title}>{title}</Text>

          {/* Solo la caja de texto avanza el dialogo para no interferir con la imagen interactiva */}
          <Pressable
            onPress={() => {
              if (isResultLocked) {
                if (!feedbackText) return
                if (isFeedbackTyping) {
                  setIsFeedbackTyping(false)
                  return
                }
                onInteractionComplete?.()
                return
              }

              if (isTyping) {
                setIsTyping(false)
                return
              }

              const nextIndex = stepIndex + 1
              if (nextIndex >= textSteps.length) return
              setStepIndex(nextIndex)
              setIsTyping(true)
            }}
            style={styles.textBox}
            accessibilityRole="button"
            accessibilityLabel="Caja de texto de bounding boxes. Toca para avanzar.">
            <View style={styles.textContent}>
              {feedbackText ? (
                isFeedbackTyping ? (
                  <TypeWriter
                    key={`feedback-${feedbackText}`}
                    style={styles.typeText}
                    typing={1}
                    minDelay={14}
                    maxDelay={28}
                    onTypingEnd={() => setIsFeedbackTyping(false)}>
                    {feedbackText}
                  </TypeWriter>
                ) : (
                  <Text style={styles.typeText}>{feedbackText}</Text>
                )
              ) : isTyping ? (
                <TypeWriter
                  key={stepIndex}
                  style={styles.typeText}
                  typing={1}
                  minDelay={10}
                  maxDelay={22}
                  onTypingEnd={() => setIsTyping(false)}>
                  {textSteps[stepIndex] ?? ''}
                </TypeWriter>
              ) : (
                <Text style={styles.typeText}>{textSteps[stepIndex] ?? ''}</Text>
              )}
            </View>
          </Pressable>
        </View>

        {/* Separador visual entre texto e imagen, similar al menu principal */}
        <View style={styles.separator} />

        {/* Bloque inferior: imagen centrada para test de bounding boxes */}
        <View style={styles.imageSection}>
          <Pressable
            onLayout={handleImageAreaLayout}
            onPress={({ nativeEvent }) => handleImagePress(nativeEvent.locationX, nativeEvent.locationY)}
            disabled={isTyping || isResultLocked}
            style={styles.imageHitArea}
            accessibilityRole="button"
            accessibilityLabel="Imagen interactiva para prueba de bounding boxes">
            <Image source={imageSource} contentFit="fill" style={styles.testImage} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

function parseNumberedSteps(source: string) {
  const lines = source
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const steps = lines
    .map(line => {
      const match = line.match(/^(\d+)\.\s*(.*)$/)
      if (!match) return null
      const rawText = match[2]?.trim() ?? ''
      return rawText.replace(/^"(.*)"$/, '$1')
    })
    .filter((value): value is string => Boolean(value))

  if (steps.length) return steps
  return ['']
}

function toPercentBoundingBox({
  imageSizePx,
  boundingBoxPixels,
}: {
  imageSizePx: { width: number; height: number }
  boundingBoxPixels: BoundingBoxPixels
}) {
  const width = imageSizePx.width || 1
  const height = imageSizePx.height || 1

  return {
    minXPercent: boundingBoxPixels.minX / width,
    maxXPercent: boundingBoxPixels.maxX / width,
    minYPercent: boundingBoxPixels.minY / height,
    maxYPercent: boundingBoxPixels.maxY / height,
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  screen: {
    flex: 1,
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  topSection: {
    flex: 3,
  },
  title: {
    color: BLUE,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
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
  typeText: {
    color: BLUE_SECONDARY,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  imageSection: {
    flex: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    width: '100%',
    height: 1,
    marginTop: 10,
    backgroundColor: '#D9D9D9',
  },
  imageHitArea: {
    width: '100%',
    height: '92%',
    maxWidth: 600,
    aspectRatio: 1,
    alignSelf: 'center',
  },
  testImage: {
    width: '100%',
    height: '100%',
  },
})
