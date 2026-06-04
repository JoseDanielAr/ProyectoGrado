import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { QuizConjuntoEngine, type QuizQuestion } from '@/components/quiz-conjunto-engine'
import { completeQuizForActiveUser } from '@/lib/db/modulo-repo'
import { parseQuizConjuntoScript } from '@/lib/parse-quiz-conjunto-script'

const QUIZ_ID = 2
const FADE_MS = 220
const BLUE = '#0094ff'
const GRAY = '#6B7280'

type CompletionStage = 'quiz' | 'module'

export const QUIZ_SCRIPT = `
START TEST

QUESTION 1 - TEST ENGINE
1. "¿Cómo se llaman las versiones de insulina administrable que fueron modificadas intencionalmente con el fin de mejorar su efecto?"
Q1.1 CORRECT "Análogos de insulina"
Q1.2 INCORRECT "Insulina basal"
Q1.3 INCORRECT "Insulina prandial"
Q1.4 INCORRECT "Hormona pancreática"

QUESTION 2 - TEST ENGINE
1. "¿Qué evita que el hígado libere demasiada glucosa en estos momentos de reposo?"
Q2.1 CORRECT "Insulina basal"
Q2.2 INCORRECT "Insulina prandial"
Q2.3 INCORRECT "Análogos de Insulina"
Q2.4 INCORRECT "Insulina de acción rápida"

QUESTION 3 - TEST ENGINE
1. "¿Cuál de estas está relacionada con el acto de comer?"
Q3.1 CORRECT "Insulina prandial"
Q3.2 INCORRECT "Insulina basal"
Q3.3 INCORRECT "Análogos de Insulina"
Q3.4 INCORRECT "Insulina de reserva"

QUESTION 4 - TEST ENGINE
1. "¿En cómo se divide la producción de insulina del cuerpo entre los dos tipos (prandial y basal respectivamente)?"
Q4.1 CORRECT "50/50"
Q4.2 INCORRECT "60/40"
Q4.3 INCORRECT "70/30"
Q4.4 INCORRECT "40/60"

QUESTION 5 - TEST ENGINE
1. "¿Cuál fue el origen de la primera insulina administrada a un paciente?"
Q5.1 CORRECT "Animal"
Q5.2 INCORRECT "Vegetal"
Q5.3 INCORRECT "Artificial"
Q5.4 INCORRECT "Humana"

QUESTION 6 - TEST ENGINE
1. "¿Como se llama la combinación de una insulina basal más insulinas prandiales en cada comida?"
Q6.1 CORRECT "Esquema bolo-basal"
Q6.2 INCORRECT "Esquema prandia-basal"
Q6.3 INCORRECT "Esquema base-prandial"
Q6.4 INCORRECT "Esquema bolo-prandial"

QUESTION 7 - TEST ENGINE
1. "¿Como se llama usualmente a el aspecto necesario de manejar bien los tiempos cuando se hace uso de insulinas ultrarrápidas?"
Q7.1 CORRECT "Timing"
Q7.2 INCORRECT "Synchro"
Q7.3 INCORRECT "Framing"
Q7.4 INCORRECT "Pinpoint"

QUESTION 8 - TEST ENGINE
1. "¿Que puede pasar si te inyectas la insulina demasiado temprano antes de comer?"
Q8.1 CORRECT "Hipoglucemia"
Q8.2 INCORRECT "Hiperglucemia"
Q8.3 INCORRECT "Hiperglucagon"
Q8.4 INCORRECT "Hipoglucagon"

QUESTION 9 - TEST ENGINE
1. "¿Dónde se aplica la insulina?"
Q9.1 CORRECT "Tejido subcutáneo"
Q9.2 INCORRECT "Tejido dermal"
Q9.3 INCORRECT "Abdomen"
Q9.4 INCORRECT "Tejido muscular"

QUESTION 10 - TEST ENGINE
1. "¿Cual es el método más popular para administrar insulina?"
Q10.1 CORRECT "Pluma de Insulina"
Q10.2 INCORRECT "Insulina inhalada"
Q10.3 INCORRECT "Parches"
Q10.4 INCORRECT "Insulina en viales"

END
`

export default function LaInsulinoterapiaQuizDosScreen() {
  const router = useRouter()
  const [isCompletionVisible, setIsCompletionVisible] = useState(false)
  const [completionStage, setCompletionStage] = useState<CompletionStage>('quiz')
  const [scoreText, setScoreText] = useState<'10/10' | '9/10' | '8/10'>('10/10')
  const completionOpacity = useRef(new Animated.Value(0)).current
  const autoBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasCompletedFlowRef = useRef(false)

  const questions = useMemo(
    () => parseQuizConjuntoScript(QUIZ_SCRIPT) as QuizQuestion[],
    []
  )

  useEffect(() => {
    return () => {
      if (!autoBackTimerRef.current) return
      clearTimeout(autoBackTimerRef.current)
      autoBackTimerRef.current = null
    }
  }, [])

  const showCompletionFlow = useCallback(
    ({ score, moduloChangedToCompleted }: { score: '10/10' | '9/10' | '8/10'; moduloChangedToCompleted: boolean }) => {
      setScoreText(score)
      setIsCompletionVisible(true)
      setCompletionStage('quiz')
      Animated.timing(completionOpacity, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => {
        autoBackTimerRef.current = setTimeout(() => {
          if (!moduloChangedToCompleted) {
            router.back()
            return
          }
          Animated.timing(completionOpacity, {
            toValue: 0,
            duration: FADE_MS,
            useNativeDriver: true,
          }).start(() => {
            setCompletionStage('module')
            Animated.timing(completionOpacity, {
              toValue: 1,
              duration: FADE_MS,
              useNativeDriver: true,
            }).start(() => {
              autoBackTimerRef.current = setTimeout(() => {
                router.back()
              }, 3000)
            })
          })
        }, 3000)
      })
    },
    [completionOpacity, router]
  )

  const handleQuizPassed = useCallback(
    async ({ scoreText: score }: { attemptsLeft: number; scoreText: '10/10' | '9/10' | '8/10' }) => {
      if (hasCompletedFlowRef.current) return
      hasCompletedFlowRef.current = true

      let moduloChangedToCompleted = false
      try {
        const numericScore = score === '10/10' ? 10 : score === '9/10' ? 9 : 8
        const completionResult = await completeQuizForActiveUser({
          quizId: QUIZ_ID,
          resultado: numericScore,
        })
        moduloChangedToCompleted = completionResult.moduloChangedToCompleted
      } catch (error) {
        console.warn('No se pudo completar el quiz 2.', error)
      }

      showCompletionFlow({ score, moduloChangedToCompleted })
    },
    [showCompletionFlow]
  )

  const handleQuizFailed = useCallback(() => {
    router.back()
  }, [router])

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <QuizConjuntoEngine
        title="Quiz"
        questions={questions}
        defaultImageSource={require('@/assets/InsulinApp/Mascota/MascotaBase.png')}
        onQuizPassed={result => void handleQuizPassed(result)}
        onQuizFailed={handleQuizFailed}
      />

      {isCompletionVisible ? (
        <Animated.View style={[styles.completionLayer, { opacity: completionOpacity }]}>
          <View style={styles.completionContent}>
            {completionStage === 'quiz' ? (
              <>
                <Text style={styles.completionTitle}>¡Felicitaciones!</Text>
                <Text style={styles.completionSubtitle}>
                  Tu puntaje fue {scoreText}.{'\n'}Nuevo modulo disponible
                </Text>
              </>
            ) : (
              <Text style={styles.completionTitle}>Modulo{'\n'}Completado</Text>
            )}
          </View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  completionLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  completionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTitle: {
    color: BLUE,
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
  },
  completionSubtitle: {
    marginTop: 12,
    color: GRAY,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
})
