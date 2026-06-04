import { Audio } from 'expo-av'
import { Image } from 'expo-image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType, type LayoutChangeEvent } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { renderInlineRichText } from '@/components/inline-rich-text'
import { RichTypewriter } from '@/components/rich-typewriter'
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
  /** Si true, no envuelve en SafeAreaView (p. ej. dentro del quiz). */
  embedded?: boolean
  /**
   * Modo quiz: sin texto de feedback; tras el tap se notifica de inmediato
   * (el padre reproduce SFX y avanza tras su propio delay).
   */
  autoAdvanceOnAnswer?: boolean
  /** Tras mostrar el feedback (bien/mal) y que el usuario pulse la caja de texto otra vez. */
  onInteractionComplete?: (result: { isCorrect: boolean }) => void
}

export function BoundingBoxEngine({
  title,
  textSource,
  imageSource,
  imageSizePx,
  boundingBoxPixels,
  insideResultText = 'bien',
  outsideResultText = 'mal',
  embedded = false,
  autoAdvanceOnAnswer = false,
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
  const lastTapWasInsideRef = useRef(false)

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

    lastTapWasInsideRef.current = isInsideBoundingBox
    setIsResultLocked(true)

    if (autoAdvanceOnAnswer) {
      onInteractionComplete?.({ isCorrect: isInsideBoundingBox })
      return
    }

    void playTapFeedbackSfx(isInsideBoundingBox)

    // Mostramos resultado en la caja de texto segun caiga dentro o fuera.
    setFeedbackText(isInsideBoundingBox ? insideResultText : outsideResultText)
    setIsFeedbackTyping(true)
    setIsTyping(false)
  }

  const screenContent = (
      <View style={[styles.screen, embedded && styles.screenEmbedded]}>
        {/* Bloque superior: titulo + caja de texto */}
        <View style={styles.topSection}>
          <Text style={styles.title}>{title}</Text>

          {/* Solo la caja de texto avanza el dialogo para no interferir con la imagen interactiva */}
          <Pressable
            onPress={() => {
              if (isResultLocked) {
                if (autoAdvanceOnAnswer) return
                if (!feedbackText) return
                if (isFeedbackTyping) {
                  setIsFeedbackTyping(false)
                  return
                }
                onInteractionComplete?.({ isCorrect: lastTapWasInsideRef.current })
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
                  <RichTypewriter
                    key={`feedback-${feedbackText}`}
                    text={feedbackText}
                    typing={true}
                    minDelay={14}
                    maxDelay={28}
                    baseStyle={styles.typeText}
                    onTypingEnd={() => setIsFeedbackTyping(false)}
                  />
                ) : (
                  renderInlineRichText({ text: feedbackText, baseStyle: styles.typeText })
                )
              ) : isTyping ? (
                <RichTypewriter
                  key={`step-${stepIndex}`}
                  text={textSteps[stepIndex] ?? ''}
                  typing={true}
                  minDelay={10}
                  maxDelay={22}
                  baseStyle={styles.typeText}
                  onTypingEnd={() => setIsTyping(false)}
                />
              ) : (
                renderInlineRichText({ text: textSteps[stepIndex] ?? '', baseStyle: styles.typeText })
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
  )

  if (embedded) return <View style={styles.safeArea}>{screenContent}</View>

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {screenContent}
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
  screenEmbedded: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
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
