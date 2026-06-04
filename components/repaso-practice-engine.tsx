import { Audio } from 'expo-av'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAudioSettings } from '@/contexts/audio-settings-context'
import { pickNextRepasoQuestion } from '@/lib/repaso/repaso-picker'
import type { RepasoQuestion } from '@/lib/repaso/repaso-repo'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'
const GREEN_CORRECT = '#2E7D32'
const RED_WRONG = '#C62828'
const STREAK_GOAL = 10
const QUESTION_GOAL = 10
const FEEDBACK_MS = 2000

type RepasoGoalMode = 'correct-streak' | 'question-count'

interface RepasoPracticeEngineProps {
  pool: RepasoQuestion[]
  onExit: () => void
  goalMode?: RepasoGoalMode
  onGoalReached?: () => void
}

export function RepasoPracticeEngine({
  pool,
  onExit,
  goalMode = 'correct-streak',
  onGoalReached,
}: RepasoPracticeEngineProps) {
  const { sfxVolume } = useAudioSettings()
  const correctSfxRef = useRef<Audio.Sound | null>(null)
  const incorrectSfxRef = useRef<Audio.Sound | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const recentKeysRef = useRef<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<RepasoQuestion | null>(null)
  const [activeChoices, setActiveChoices] = useState<RepasoQuestion['choices']>([])
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [isQuestionLocked, setIsQuestionLocked] = useState(false)
  const [correctStreak, setCorrectStreak] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [isStreakModalVisible, setIsStreakModalVisible] = useState(false)

  useEffect(() => {
    const initial = pickNextRepasoQuestion({ pool, recentKeys: [] })
    recentKeysRef.current = initial.nextRecentKeys
    setCurrentQuestion(initial.question)
  }, [pool])

  useEffect(() => {
    if (!currentQuestion) {
      setActiveChoices([])
      return
    }
    setActiveChoices(shuffleChoices(currentQuestion.choices))
    setSelectedChoice(null)
    setIsQuestionLocked(false)
  }, [currentQuestion])

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
        console.warn('No se pudieron cargar los SFX de repaso.', error)
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
    return () => {
      if (!advanceTimerRef.current) return
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [])

  async function playCorrectSfx() {
    if (!correctSfxRef.current) return
    try {
      await correctSfxRef.current.setVolumeAsync(sfxVolume)
      await correctSfxRef.current.setPositionAsync(0)
      await correctSfxRef.current.playAsync()
    } catch {
      // Ignorar fallos puntuales de audio.
    }
  }

  async function playIncorrectSfx() {
    if (!incorrectSfxRef.current) return
    try {
      await incorrectSfxRef.current.setVolumeAsync(sfxVolume)
      await incorrectSfxRef.current.setPositionAsync(0)
      await incorrectSfxRef.current.playAsync()
    } catch {
      // Ignorar fallos puntuales de audio.
    }
  }

  const goToNextQuestion = useCallback(() => {
    const next = pickNextRepasoQuestion({ pool, recentKeys: recentKeysRef.current })
    recentKeysRef.current = next.nextRecentKeys
    setCurrentQuestion(next.question)
  }, [pool])

  const scheduleNextQuestion = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = setTimeout(() => {
      goToNextQuestion()
    }, FEEDBACK_MS)
  }, [goToNextQuestion])

  const showGoalModal = useCallback(() => {
    onGoalReached?.()
    setIsStreakModalVisible(true)
  }, [onGoalReached])

  const handleAnswer = useCallback(
    async ({ isCorrect }: { isCorrect: boolean }) => {
      if (isQuestionLocked || !currentQuestion) return
      setIsQuestionLocked(true)

      if (goalMode === 'question-count') {
        if (isCorrect) await playCorrectSfx()
        else await playIncorrectSfx()

        const nextAnswered = answeredCount + 1
        setAnsweredCount(nextAnswered)
        if (nextAnswered >= QUESTION_GOAL) {
          showGoalModal()
          return
        }
        scheduleNextQuestion()
        return
      }

      if (isCorrect) {
        await playCorrectSfx()
        const nextStreak = correctStreak + 1
        setCorrectStreak(nextStreak)
        if (nextStreak >= STREAK_GOAL) {
          showGoalModal()
          return
        }
        scheduleNextQuestion()
        return
      }

      await playIncorrectSfx()
      setCorrectStreak(0)
      scheduleNextQuestion()
    },
    [
      answeredCount,
      correctStreak,
      currentQuestion,
      goalMode,
      isQuestionLocked,
      scheduleNextQuestion,
      showGoalModal,
    ]
  )

  function handleContinueAfterStreak() {
    setIsStreakModalVisible(false)
    setCorrectStreak(0)
    setAnsweredCount(0)
    setIsQuestionLocked(false)
    goToNextQuestion()
  }

  function handleStopAfterStreak() {
    setIsStreakModalVisible(false)
    onExit()
  }

  async function handleChoicePress(choiceIndex: number) {
    if (!currentQuestion || isQuestionLocked) return
    const selected = activeChoices[choiceIndex]
    if (!selected) return
    setSelectedChoice(choiceIndex)
    await handleAnswer({ isCorrect: selected.isCorrect })
  }

  if (!currentQuestion) return null

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <View style={styles.textSection}>
          <Text style={styles.questionTitle}>Repaso</Text>
          <Text style={styles.questionPrompt}>{currentQuestion.prompt}</Text>
        </View>

        <View style={styles.choicesContainer}>
          {activeChoices.map((choice, index) => {
            const isSelected = selectedChoice === index
            const showAsCorrect = isSelected && choice.isCorrect
            const showAsWrong = isSelected && !choice.isCorrect
            return (
              <Pressable
                key={`${currentQuestion.key}-${index}-${choice.label}`}
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
      </View>

      <Modal visible={isStreakModalVisible} transparent animationType="fade" onRequestClose={handleStopAfterStreak}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¡Muy bien!</Text>
            <Text style={styles.modalSubtitle}>¿Deseas seguir?</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={handleContinueAfterStreak}
                accessibilityRole="button"
                style={({ pressed }) => [styles.modalButton, pressed && styles.choicePressed]}>
                <Text style={styles.modalButtonText}>Sí</Text>
              </Pressable>
              <Pressable
                onPress={handleStopAfterStreak}
                accessibilityRole="button"
                style={({ pressed }) => [styles.modalButtonSecondary, pressed && styles.choicePressed]}>
                <Text style={styles.modalButtonSecondaryText}>No</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function shuffleChoices(choices: RepasoQuestion['choices']) {
  const cloned = choices.map(choice => ({ ...choice }))
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = cloned[i]
    cloned[i] = cloned[j]!
    cloned[j] = temp!
  }
  return cloned
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  screen: { flex: 1, backgroundColor: WHITE, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: WHITE,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    color: BLUE,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: 10,
    color: BLUE_SECONDARY,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
  modalButtonText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '700',
  },
  modalButtonSecondaryText: {
    color: BLUE_SECONDARY,
    fontSize: 17,
    fontWeight: '700',
  },
})
