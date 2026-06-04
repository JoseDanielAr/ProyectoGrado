import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { RepasoPracticeEngine } from '@/components/repaso-practice-engine'
import { tryCompleteMisionAfterRepasoQuestions, shouldUseRepasoQuestionGoal } from '@/lib/misiones/misiones-repo'
import { getRepasoQuestionPool, type RepasoQuestion } from '@/lib/repaso/repaso-repo'

export default function RepasoSessionScreen() {
  const router = useRouter()
  const [pool, setPool] = useState<RepasoQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [goalMode, setGoalMode] = useState<'correct-streak' | 'question-count'>('correct-streak')

  useEffect(() => {
    let isActive = true

    async function loadPool() {
      try {
        const [questions, useQuestionGoal] = await Promise.all([
          getRepasoQuestionPool(),
          shouldUseRepasoQuestionGoal(),
        ])
        if (!isActive) return
        if (!questions.length) {
          Alert.alert('', 'Debes completar al menos un modulo antes de continuar', [
            { text: 'OK', onPress: () => router.back() },
          ])
          return
        }
        setPool(questions)
        setGoalMode(useQuestionGoal ? 'question-count' : 'correct-streak')
      } catch (error) {
        console.warn('No se pudo cargar el pool de repaso.', error)
        if (!isActive) return
        Alert.alert('', 'No se pudo cargar el repaso', [{ text: 'OK', onPress: () => router.back() }])
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadPool()
    return () => {
      isActive = false
    }
  }, [router])

  const handleExit = useCallback(() => {
    router.back()
  }, [router])

  const handleGoalReached = useCallback(() => {
    void tryCompleteMisionAfterRepasoQuestions()
  }, [])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0094ff" />
        </View>
      </SafeAreaView>
    )
  }

  if (!pool.length) return null

  return (
    <RepasoPracticeEngine
      pool={pool}
      onExit={handleExit}
      goalMode={goalMode}
      onGoalReached={goalMode === 'question-count' ? handleGoalReached : undefined}
    />
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
