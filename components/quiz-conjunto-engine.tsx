import { Audio } from 'expo-av'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BoundingBoxEngine } from '@/components/bounding-box-engine'
import { useAudioSettings } from '@/contexts/audio-settings-context'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'
const GREEN_CORRECT = '#2E7D32'
const RED_WRONG = '#C62828'

const MAX_ATTEMPTS = 3
const QUIZ_SECONDS = 300
const TRANSITION_MS = 220
const FAIL_OVERLAY_MS = 300
const QUESTION_TRANSITION_MS = 180

export interface QuizChoice {
  label: string
  isCorrect: boolean
}

export interface BoundingBoxArea {
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
}

export interface QuizTestQuestion {
  kind: 'test'
  id: number
  prompt: string
  choices: QuizChoice[]
  imageSource?: ImageSourcePropType
}

export interface QuizBoundingQuestion {
  kind: 'bounding-box'
  id: number
  prompt: string
  imageKey: string
  imageSource: ImageSourcePropType
  imageSizePx: { width: number; height: number }
  boundingBoxPixels: { minX: number; maxX: number; minY: number; maxY: number }
  insideResultText?: string
  outsideResultText?: string
}

export type QuizQuestion = QuizTestQuestion | QuizBoundingQuestion

interface QuizConjuntoEngineProps {
  title: string
  questions: QuizQuestion[]
  defaultImageSource?: ImageSourcePropType
  onQuizPassed: (result: { attemptsLeft: number; scoreText: '10/10' | '9/10' | '8/10' }) => void
  onQuizFailed: () => void
}

export function QuizConjuntoEngine({
  title,
  questions,
  defaultImageSource,
  onQuizPassed,
  onQuizFailed,
}: QuizConjuntoEngineProps) {
  const { sfxVolume } = useAudioSettings()
  const correctSfxRef = useRef<Audio.Sound | null>(null)
  const incorrectSfxRef = useRef<Audio.Sound | null>(null)
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [isQuestionLocked, setIsQuestionLocked] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [countdownStart, setCountdownStart] = useState(3)
  const [quizStarted, setQuizStarted] = useState(false)
  const [timeIsOver, setTimeIsOver] = useState(false)
  const [attemptsAreOver, setAttemptsAreOver] = useState(false)
  const [overlayMessage, setOverlayMessage] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_SECONDS)
  const [activeChoices, setActiveChoices] = useState<QuizChoice[]>([])
  const contentOpacity = useRef(new Animated.Value(0)).current
  const failOverlayOpacity = useRef(new Animated.Value(0)).current
  const failBackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextQuestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTransitioningRef = useRef(false)

  const currentQuestion = questions[questionIndex] ?? null

  useEffect(() => {
    let isMounted = true
    async function loadSfx() {
      try {
        const { sound: correctSound } = await Audio.Sound.createAsync(require('@/assets/Sfx/Correcto.mp3'), {
          shouldPlay: false,
          volume: sfxVolume,
        })
        const { sound: incorrectSound } = await Audio.Sound.createAsync(require('@/assets/Sfx/Incorrecto.mp3'), {
          shouldPlay: false,
          volume: sfxVolume,
        })
        if (!isMounted) {
          await correctSound.unloadAsync()
          await incorrectSound.unloadAsync()
          return
        }
        correctSfxRef.current = correctSound
        incorrectSfxRef.current = incorrectSound
      } catch (error) {
        console.warn('No se pudieron cargar los SFX del quiz.', error)
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
  }, [sfxVolume])

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: TRANSITION_MS,
      useNativeDriver: true,
    }).start()
  }, [contentOpacity])

  useEffect(() => {
    if (!currentQuestion || currentQuestion.kind !== 'test') {
      setActiveChoices([])
      return
    }
    setActiveChoices(shuffleChoices(currentQuestion.choices))
    setSelectedChoice(null)
  }, [currentQuestion])

  useEffect(() => {
    if (quizStarted) return

    const interval = setInterval(() => {
      setCountdownStart(previous => {
        const next = previous - 1
        if (next < 0) {
          clearInterval(interval)
          Animated.timing(contentOpacity, {
            toValue: 0,
            duration: TRANSITION_MS,
            useNativeDriver: true,
          }).start(() => {
            setQuizStarted(true)
            Animated.timing(contentOpacity, {
              toValue: 1,
              duration: TRANSITION_MS,
              useNativeDriver: true,
            }).start()
          })
          return previous
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [contentOpacity, quizStarted])

  useEffect(() => {
    if (!quizStarted) return
    if (timeIsOver || attemptsAreOver) return

    const timerInterval = setInterval(() => {
      setSecondsLeft(previous => {
        if (previous <= 1) {
          clearInterval(timerInterval)
          setTimeIsOver(true)
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [attemptsAreOver, quizStarted, timeIsOver])

  const handleFail = useCallback(
    (message: string) => {
      setOverlayMessage(message)
      Animated.timing(failOverlayOpacity, {
        toValue: 1,
        duration: FAIL_OVERLAY_MS,
        useNativeDriver: true,
      }).start(() => {
        failBackTimeoutRef.current = setTimeout(() => {
          onQuizFailed()
        }, 3000)
      })
    },
    [failOverlayOpacity, onQuizFailed]
  )

  useEffect(() => {
    return () => {
      if (failBackTimeoutRef.current) clearTimeout(failBackTimeoutRef.current)
      if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!timeIsOver) return
    handleFail('Se acabo el tiempo')
  }, [handleFail, timeIsOver])

  useEffect(() => {
    if (!attemptsAreOver) return
    handleFail('Se acabaron los intentos.')
  }, [attemptsAreOver, handleFail])

  async function playCorrectSfx() {
    if (!correctSfxRef.current) return
    try {
      await correctSfxRef.current.setVolumeAsync(sfxVolume)
      await correctSfxRef.current.setPositionAsync(0)
      await correctSfxRef.current.playAsync()
    } catch {
      // Ignoramos fallos puntuales de audio.
    }
  }

  async function playIncorrectSfx() {
    if (!incorrectSfxRef.current) return
    try {
      await incorrectSfxRef.current.setVolumeAsync(sfxVolume)
      await incorrectSfxRef.current.setPositionAsync(0)
      await incorrectSfxRef.current.playAsync()
    } catch {
      // Ignoramos fallos puntuales de audio.
    }
  }

  function getScoreText(nextAttemptsLeft: number): '10/10' | '9/10' | '8/10' {
    if (nextAttemptsLeft >= 3) return '10/10'
    if (nextAttemptsLeft === 2) return '9/10'
    return '8/10'
  }

  function transitionToNextQuestion() {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: QUESTION_TRANSITION_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        isTransitioningRef.current = false
        return
      }
      setQuestionIndex(previous => previous + 1)
      setIsQuestionLocked(false)
      requestAnimationFrame(() => {
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: QUESTION_TRANSITION_MS,
          useNativeDriver: true,
        }).start(() => {
          isTransitioningRef.current = false
        })
      })
    })
  }

  function goToNextQuestionOrFinish(nextAttemptsLeft: number) {
    const nextIndex = questionIndex + 1
    if (nextIndex >= questions.length) {
      onQuizPassed({
        attemptsLeft: nextAttemptsLeft,
        scoreText: getScoreText(nextAttemptsLeft),
      })
      return
    }
    transitionToNextQuestion()
  }

  async function handleQuestionResult({ isCorrect }: { isCorrect: boolean }) {
    if (isQuestionLocked) return
    setIsQuestionLocked(true)

    let nextAttempts = attemptsLeft
    if (isCorrect) {
      await playCorrectSfx()
    } else {
      await playIncorrectSfx()
      nextAttempts = attemptsLeft - 1
      setAttemptsLeft(nextAttempts)
      if (nextAttempts <= 0) {
        setAttemptsAreOver(true)
        return
      }
    }

    nextQuestionTimeoutRef.current = setTimeout(() => {
      goToNextQuestionOrFinish(nextAttempts)
    }, 2000)
  }

  function formatSeconds(value: number) {
    const mins = Math.floor(value / 60)
    const secs = value % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  async function handleChoicePress(choiceIndex: number) {
    if (!currentQuestion) return
    if (isQuestionLocked) return

    const selected = activeChoices[choiceIndex]
    if (!selected) return
    setSelectedChoice(choiceIndex)
    await handleQuestionResult({ isCorrect: selected.isCorrect })
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <View style={styles.timerContainer}>
          <View style={styles.timerPill}>
            <Text style={styles.timerText}>{quizStarted ? formatSeconds(secondsLeft) : '05:00'}</Text>
          </View>
          <Text style={styles.attemptsText}>Intentos: {attemptsLeft}</Text>
        </View>

        <Animated.View style={[styles.quizBody, { opacity: contentOpacity }]}>
          {!quizStarted ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdownStart}</Text>
            </View>
          ) : currentQuestion?.kind === 'bounding-box' ? (
            <BoundingBoxEngine
              key={`bbox-q-${currentQuestion.id}`}
              embedded
              autoAdvanceOnAnswer
              title={title}
              textSource={`1. "${currentQuestion.prompt}"`}
              imageSource={currentQuestion.imageSource}
              imageSizePx={currentQuestion.imageSizePx}
              boundingBoxPixels={currentQuestion.boundingBoxPixels}
              onInteractionComplete={result => {
                if (isQuestionLocked) return
                void handleQuestionResult({ isCorrect: result.isCorrect })
              }}
            />
          ) : currentQuestion?.kind === 'test' ? (
            <>
              <View style={styles.textSection}>
                <Text style={styles.questionTitle}>{title}</Text>
                <Text style={styles.questionPrompt}>{currentQuestion.prompt}</Text>
              </View>
              <View style={styles.choicesContainer}>
                {activeChoices.map((choice, index) => {
                  const isSelected = selectedChoice === index
                  const showAsCorrect = isSelected && choice.isCorrect
                  const showAsWrong = isSelected && !choice.isCorrect
                  return (
                    <Pressable
                      key={`${currentQuestion.id}-${index}-${choice.label}`}
                      onPress={() => void handleChoicePress(index)}
                      disabled={isQuestionLocked}
                      style={({ pressed }) => [
                        styles.choiceButton,
                        showAsCorrect && styles.choiceButtonCorrect,
                        showAsWrong && styles.choiceButtonWrong,
                        isSelected && !showAsCorrect && !showAsWrong && styles.choiceButtonSelected,
                        pressed && !isQuestionLocked && styles.choicePressed,
                      ]}>
                      <Text style={styles.choiceText}>{choice.label}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </>
          ) : null}
        </Animated.View>
      </View>

      {(timeIsOver || attemptsAreOver) && (
        <Animated.View style={[styles.failOverlay, { opacity: failOverlayOpacity }]}>
          <Text style={styles.failText}>{overlayMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  screen: { flex: 1, backgroundColor: WHITE, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  timerContainer: {
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerPill: {
    backgroundColor: BLUE,
    borderRadius: 10,
    minHeight: 42,
    minWidth: 110,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: { color: WHITE, fontSize: 22, fontWeight: '900' },
  attemptsText: { color: BLUE_SECONDARY, fontSize: 17, fontWeight: '800' },
  quizBody: { flex: 1 },
  countdownContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countdownText: { color: BLUE, fontSize: 84, fontWeight: '900' },
  textSection: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    padding: 12,
    backgroundColor: WHITE,
  },
  questionTitle: { color: BLUE, fontSize: 24, fontWeight: '800' },
  questionPrompt: { color: BLUE_SECONDARY, fontSize: 18, fontWeight: '600', marginTop: 8, lineHeight: 24 },
  choicesContainer: { marginTop: 12, gap: 8 },
  choiceButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  choiceButtonSelected: { opacity: 0.8 },
  choiceButtonCorrect: { backgroundColor: GREEN_CORRECT },
  choiceButtonWrong: { backgroundColor: RED_WRONG },
  choicePressed: { opacity: 0.88 },
  choiceText: { color: WHITE, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  failOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  failText: { color: WHITE, fontSize: 42, fontWeight: '900', textAlign: 'center' },
})

function shuffleChoices(choices: QuizChoice[]) {
  const cloned = choices.map(choice => ({ ...choice }))
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = cloned[i]
    cloned[i] = cloned[j]!
    cloned[j] = temp!
  }
  return cloned
}
