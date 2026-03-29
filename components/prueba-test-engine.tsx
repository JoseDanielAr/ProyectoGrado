import { Audio } from 'expo-av'
import { Image } from 'expo-image'
import TypeWriter from 'react-native-typewriter'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  mergeScriptAndLegacyCommands,
  type ImageDirective,
  type PruebaTextoImageCommand,
  resolveImageTarget,
} from '@/components/prueba-texto-engine'
import { useAudioSettings } from '@/contexts/audio-settings-context'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'
const GREEN_CORRECT = '#2E7D32'
const RED_WRONG = '#C62828'
const IMAGE_FADE_MS = 220
const BUTTON_SLIDE_MS = 280
const BUTTON_STAGGER_MS = 100
const SLIDE_OFFSET = 420

function shuffleChoicesInRandomOrder(items: PruebaTestChoice[]): PruebaTestChoice[] {
  const copy = items.map(entry => ({ ...entry }))
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]!
    copy[j] = tmp!
  }
  return copy
}

export interface PruebaTestChoice {
  label: string
  isCorrect: boolean
}

interface PruebaTestEngineProps {
  title: string
  /** Guion numerado (mismo formato que PruebaTextoEngine). */
  textSource: string
  /** Paso 1-based: al terminar de escribirse este paso, la imagen hace fade out y aparecen las opciones. */
  choicesTriggerStep: number
  /** Orden en pantalla: se baraja al mostrar el test; `isCorrect` sigue ligado al texto de cada opción. */
  choices: PruebaTestChoice[]
  /** Guion opcional tras respuesta correcta (Shift/Cut soportados). */
  correctOutcomeTextSource?: string
  /** Guion opcional tras respuesta incorrecta. */
  incorrectOutcomeTextSource?: string
  muteBackgroundMusic?: boolean
  imageAssetMap?: Record<string, ImageSourcePropType>
  customImageSource?: ImageSourcePropType
  imageCommands?: PruebaTextoImageCommand[]
  /** Camino principal agotado: última línea mostrada, usuario toca de nuevo la caja de texto. */
  onAttemptAdvancePastEnd?: () => void
}

type ChoiceUiPhase = 'off' | 'fading' | 'sliding' | 'ready' | 'answered'

export function PruebaTestEngine({
  title,
  textSource,
  choicesTriggerStep,
  choices,
  correctOutcomeTextSource = '',
  incorrectOutcomeTextSource = '',
  muteBackgroundMusic = false,
  imageAssetMap = {},
  customImageSource,
  imageCommands = [],
  onAttemptAdvancePastEnd,
}: PruebaTestEngineProps) {
  const { setMusicTemporarilyMuted, sfxVolume } = useAudioSettings()

  const { displayTexts, directiveByStep: introDirectiveByStep } = useMemo(
    () => mergeScriptAndLegacyCommands(textSource, imageCommands ?? []),
    [textSource, imageCommands]
  )

  const mascotTalkSfxRef = useRef<Audio.Sound | null>(null)
  const [isMascotTalkSfxReady, setIsMascotTalkSfxReady] = useState(false)

  const [stepIndex, setStepIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  const [visualMode, setVisualMode] = useState<'default' | 'static'>('default')
  const [staticSource, setStaticSource] = useState<ImageSourcePropType | null>(null)
  const [isMascotTalkingFrame, setIsMascotTalkingFrame] = useState(false)

  const mascotOpacity = useRef(new Animated.Value(1)).current
  const lastImageDirectiveKeyRef = useRef<string | null>(null)

  const [choiceUi, setChoiceUi] = useState<ChoiceUiPhase>('off')
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null)
  const hasLaunchedChoiceUiRef = useRef(false)
  const hasAnsweredRef = useRef(false)

  const [shuffledChoices, setShuffledChoices] = useState<PruebaTestChoice[] | null>(null)

  const buttonSlideX = useRef(choices.map(() => new Animated.Value(SLIDE_OFFSET))).current

  const displayedChoices = shuffledChoices ?? choices

  const [outcomePhase, setOutcomePhase] = useState<'none' | 'correct' | 'incorrect'>('none')
  const [outcomeDisplayTexts, setOutcomeDisplayTexts] = useState<string[]>([])
  const [outcomeDirectiveByStep, setOutcomeDirectiveByStep] = useState<Map<number, ImageDirective>>(new Map())
  const [outcomeStepIndex, setOutcomeStepIndex] = useState(0)
  const [outcomeIsTyping, setOutcomeIsTyping] = useState(false)

  const typingActive = outcomePhase !== 'none' ? outcomeIsTyping : isTyping

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
    if (!typingActive) {
      setIsMascotTalkingFrame(false)
      return
    }

    const animationInterval = setInterval(() => {
      setIsMascotTalkingFrame(previousFrame => !previousFrame)
    }, 300)

    return () => clearInterval(animationInterval)
  }, [typingActive])

  useEffect(() => {
    if (!isMascotTalkSfxReady) return

    async function syncTalkingAudio() {
      const sound = mascotTalkSfxRef.current
      if (!sound) return

      try {
        await sound.setVolumeAsync(sfxVolume)

        if (typingActive) {
          await sound.playAsync()
          return
        }

        await sound.stopAsync()
      } catch {
        // Ignorar errores puntuales de audio.
      }
    }

    void syncTalkingAudio()
  }, [typingActive, sfxVolume, isMascotTalkSfxReady])

  const activePhaseKey =
    outcomePhase === 'none' ? `intro-${stepIndex}` : `${outcomePhase}-${outcomeStepIndex}`
  const activeStepNumber = outcomePhase === 'none' ? stepIndex + 1 : outcomeStepIndex + 1
  const activeDirectiveMap = outcomePhase === 'none' ? introDirectiveByStep : outcomeDirectiveByStep

  useEffect(() => {
    if (lastImageDirectiveKeyRef.current === activePhaseKey) return
    lastImageDirectiveKeyRef.current = activePhaseKey

    const directive = activeDirectiveMap.get(activeStepNumber)
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

    Animated.timing(mascotOpacity, {
      toValue: 0,
      duration: IMAGE_FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return
      setVisualMode(nextMode)
      setStaticSource(nextStatic)
      Animated.timing(mascotOpacity, {
        toValue: 1,
        duration: IMAGE_FADE_MS,
        useNativeDriver: true,
      }).start()
    })
  }, [
    activeDirectiveMap,
    activePhaseKey,
    activeStepNumber,
    customImageSource,
    imageAssetMap,
    mascotOpacity,
  ])

  useEffect(() => {
    if (outcomePhase !== 'none') return
    if (choiceUi !== 'off') return
    if (stepIndex + 1 !== choicesTriggerStep) return
    if (isTyping) return
    if (hasLaunchedChoiceUiRef.current) return

    hasLaunchedChoiceUiRef.current = true
    const ordered = shuffleChoicesInRandomOrder(choices)
    setShuffledChoices(ordered)
    setChoiceUi('fading')

    Animated.timing(mascotOpacity, {
      toValue: 0,
      duration: IMAGE_FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return
      setChoiceUi('sliding')
      ordered.forEach((_, i) => buttonSlideX[i]?.setValue(SLIDE_OFFSET))

      let finishedCount = 0
      ordered.forEach((_, i) => {
        Animated.timing(buttonSlideX[i], {
          toValue: 0,
          duration: BUTTON_SLIDE_MS,
          delay: i * BUTTON_STAGGER_MS,
          useNativeDriver: true,
        }).start(({ finished: slideFinished }) => {
          if (!slideFinished) return
          finishedCount += 1
          if (finishedCount >= ordered.length) setChoiceUi('ready')
        })
      })
    })
  }, [choiceUi, choices, choicesTriggerStep, buttonSlideX, isTyping, mascotOpacity, outcomePhase, stepIndex])

  const resolveChoice = useCallback(
    (choiceIndex: number) => {
      if (choiceUi !== 'ready') return
      if (hasAnsweredRef.current) return
      hasAnsweredRef.current = true

      setSelectedChoiceIndex(choiceIndex)
      setChoiceUi('answered')

      const pool = shuffledChoices ?? choices
      const isCorrect = pool[choiceIndex]?.isCorrect ?? false
      const rawSource = isCorrect ? correctOutcomeTextSource : incorrectOutcomeTextSource
      const { displayTexts: od, directiveByStep: odd } = mergeScriptAndLegacyCommands(rawSource ?? '', [])
      setOutcomeDisplayTexts(od)
      setOutcomeDirectiveByStep(odd)
      setOutcomePhase(isCorrect ? 'correct' : 'incorrect')
      setOutcomeStepIndex(0)
      setOutcomeIsTyping(true)
      lastImageDirectiveKeyRef.current = null

      // La mascota permanece oculta (opacidad 0) durante la rama condicional;
      // vuelve a mostrarse en returnToMainPathAfterOutcome tras el último paso (p. ej. "Sigamos...").
      mascotOpacity.stopAnimation()
      mascotOpacity.setValue(0)
    },
    [
      choiceUi,
      choices,
      shuffledChoices,
      correctOutcomeTextSource,
      incorrectOutcomeTextSource,
      mascotOpacity,
    ]
  )

  function returnToMainPathAfterOutcome() {
    setOutcomePhase('none')
    setOutcomeIsTyping(false)
    setOutcomeStepIndex(0)
    setOutcomeDisplayTexts([])
    setOutcomeDirectiveByStep(new Map())
    setChoiceUi('off')
    setSelectedChoiceIndex(null)
    setShuffledChoices(null)
    hasAnsweredRef.current = false
    lastImageDirectiveKeyRef.current = null

    const nextMainIndex = choicesTriggerStep
    if (nextMainIndex >= displayTexts.length) return

    setStepIndex(nextMainIndex)
    setIsTyping(true)

    Animated.timing(mascotOpacity, {
      toValue: 1,
      duration: IMAGE_FADE_MS,
      useNativeDriver: true,
    }).start()
  }

  const handleScreenPress = () => {
    if (outcomePhase !== 'none') {
      if (outcomeIsTyping) {
        setOutcomeIsTyping(false)
        return
      }

      const nextIndex = outcomeStepIndex + 1
      if (nextIndex >= outcomeDisplayTexts.length) {
        returnToMainPathAfterOutcome()
        return
      }

      setOutcomeStepIndex(nextIndex)
      setOutcomeIsTyping(true)
      return
    }

    const onQuestionStep = stepIndex + 1 === choicesTriggerStep
    if (onQuestionStep && choiceUi !== 'off' && selectedChoiceIndex === null) return

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

  const showChoiceButtons =
    choiceUi === 'sliding' || choiceUi === 'ready' || choiceUi === 'answered'
  const awaitingChoice = choiceUi === 'ready' && selectedChoiceIndex === null

  const textHint =
    outcomePhase !== 'none'
      ? 'Toca para continuar'
      : awaitingChoice
        ? 'Elige una respuesta'
        : choiceUi === 'fading' || choiceUi === 'sliding'
          ? '…'
          : 'Toca para continuar'

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.storyBody}>
          <View style={styles.imageStage} accessibilityElementsHidden={showChoiceButtons}>
            <Animated.View
              pointerEvents={showChoiceButtons ? 'none' : 'auto'}
              style={[styles.mascotLayer, { opacity: mascotOpacity }]}>
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

            {showChoiceButtons ? (
              <View style={[styles.choicesColumn, styles.choicesOnTop]} pointerEvents="box-none">
                {displayedChoices.map((choice, i) => {
                  const slideStyle = { transform: [{ translateX: buttonSlideX[i] ?? 0 }] }
                  const choicesLocked =
                    choiceUi !== 'ready' || selectedChoiceIndex !== null
                  const picked = selectedChoiceIndex
                  const showAsCorrect =
                    picked === i && displayedChoices[picked]?.isCorrect === true
                  const showAsWrong =
                    picked === i && displayedChoices[picked]?.isCorrect === false

                  return (
                    <Animated.View key={`choice-slot-${i}`} style={[styles.choiceAnimatedWrap, slideStyle]}>
                      <Pressable
                        onPress={() => {
                          if (choicesLocked) return
                          resolveChoice(i)
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: choicesLocked }}
                        style={({ pressed }) => [
                          styles.choiceButton,
                          showAsCorrect ? styles.choiceButtonCorrect : null,
                          showAsWrong ? styles.choiceButtonWrong : null,
                          pressed && !choicesLocked ? styles.choiceButtonPressed : null,
                        ]}>
                        <Text style={styles.choiceButtonText}>{choice.label}</Text>
                      </Pressable>
                    </Animated.View>
                  )
                })}
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={handleScreenPress}
            style={styles.textBox}
            accessibilityRole="button"
            accessibilityLabel="Caja de texto del test. Toca para avanzar cuando puedas.">
            <Text style={styles.textHint}>{textHint}</Text>
            <View style={styles.textContent}>
              {outcomePhase !== 'none' ? (
                outcomeIsTyping ? (
                  <TypeWriter
                    key={`out-${outcomePhase}-${outcomeStepIndex}`}
                    style={styles.typeText}
                    typing={1}
                    minDelay={10}
                    maxDelay={22}
                    onTypingEnd={() => setOutcomeIsTyping(false)}>
                    {outcomeDisplayTexts[outcomeStepIndex] ?? ''}
                  </TypeWriter>
                ) : (
                  <Text style={styles.typeText}>{outcomeDisplayTexts[outcomeStepIndex] ?? ''}</Text>
                )
              ) : isTyping ? (
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
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choicesColumn: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  choicesOnTop: {
    zIndex: 2,
  },
  choiceAnimatedWrap: {
    width: '100%',
  },
  choiceButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  choiceButtonPressed: {
    opacity: 0.9,
  },
  choiceButtonCorrect: {
    backgroundColor: GREEN_CORRECT,
  },
  choiceButtonWrong: {
    backgroundColor: RED_WRONG,
  },
  choiceButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
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
