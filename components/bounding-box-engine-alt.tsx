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

interface BoundingBoxEngineAltProps {
  title: string
  textSource: string
  imageSource: ImageSourcePropType
  imageSizePx: { width: number; height: number }
  boundingBoxPixels: BoundingBoxPixels
  insideResultText?: string
  outsideResultText?: string
  onInteractionComplete?: () => void
}

export function BoundingBoxEngineAlt({
  title,
  textSource,
  imageSource,
  imageSizePx,
  boundingBoxPixels,
  insideResultText = 'bien',
  outsideResultText = 'mal',
  onInteractionComplete,
}: BoundingBoxEngineAltProps) {
  const { sfxVolume } = useAudioSettings()
  const correctSfxRef = useRef<Audio.Sound | null>(null)
  const incorrectSfxRef = useRef<Audio.Sound | null>(null)

  const textSteps = useMemo(() => parseNumberedSteps(textSource), [textSource])

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
        console.warn('No se pudieron cargar los SFX de acierto/error del bounding box ALT.', error)
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
    const { width, height } = event.nativeEvent.layout
    setImageTapArea({ width, height })
  }

  function handleImagePress(locationX: number, locationY: number) {
    if (isTyping) return
    if (imageTapArea.width <= 0 || imageTapArea.height <= 0) return
    if (isResultLocked) return

    // ALT: mapeamos el tap a coordenadas reales en pixeles de la imagen fuente.
    const xInSourcePx = (locationX / imageTapArea.width) * imageSizePx.width
    const yInSourcePx = (locationY / imageTapArea.height) * imageSizePx.height

    const isInsideBoundingBox =
      xInSourcePx >= boundingBoxPixels.minX &&
      xInSourcePx <= boundingBoxPixels.maxX &&
      yInSourcePx >= boundingBoxPixels.minY &&
      yInSourcePx <= boundingBoxPixels.maxY

    void playTapFeedbackSfx(isInsideBoundingBox)

    setFeedbackText(isInsideBoundingBox ? insideResultText : outsideResultText)
    setIsFeedbackTyping(true)
    setIsTyping(false)
    setIsResultLocked(true)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <View style={styles.topSection}>
          <Text style={styles.title}>{title}</Text>

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
            accessibilityLabel="Caja de texto de bounding boxes ALT. Toca para avanzar.">
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

        <View style={styles.separator} />

        <View style={styles.imageSection}>
          <Pressable
            onLayout={handleImageAreaLayout}
            onPress={({ nativeEvent }) => handleImagePress(nativeEvent.locationX, nativeEvent.locationY)}
            disabled={isTyping || isResultLocked}
            style={styles.imageHitArea}
            accessibilityRole="button"
            accessibilityLabel="Imagen interactiva para prueba de bounding boxes ALT">
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
