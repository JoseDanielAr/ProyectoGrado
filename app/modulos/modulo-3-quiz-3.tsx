import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { QuizConjuntoEngine, type QuizQuestion } from '@/components/quiz-conjunto-engine'
import { completeQuizForActiveUser } from '@/lib/db/modulo-repo'
import { parseQuizConjuntoScript } from '@/lib/parse-quiz-conjunto-script'

const QUIZ_ID = 3
const FADE_MS = 220
const BLUE = '#0094ff'
const GRAY = '#6B7280'

type CompletionStage = 'quiz' | 'module'

export const QUIZ_SCRIPT = `
START TEST

QUESTION 1 - TEST ENGINE
1. "¿Cual es el dispositivo más común para el monitoreo de la glucosa?"
Q1.1 CORRECT "Glucometro"
Q1.2 INCORRECT "CGM"
Q1.3 INCORRECT "Insulometro"
Q1.4 INCORRECT "Glucobaro"

QUESTION 2 - TEST ENGINE
1. "El CGM muestra no solo el nivel de glucosa actual. Tambien la dirección hacia la que esta cambiando, y otra característica. ¿Cual es?"
Q2.1 CORRECT "Velocidad"
Q2.2 INCORRECT "Tipo"
Q2.3 INCORRECT "Rango deseado"
Q2.4 INCORRECT "El glucagon"

QUESTION 3 - TEST ENGINE
1. "Si el CGM muestra una flecha completamente horizontal, ¿qué significa en cuanto a cómo esta cambiando la glucosa?"
Q3.1 CORRECT "Está estable"
Q3.2 INCORRECT "Sube lentamente"
Q3.3 INCORRECT "Sube rápidamente"
Q3.4 INCORRECT "Baja lentamente"

QUESTION 4 - TEST ENGINE
1. "¿En general, se hablamos de hipoglucemia cuando bajamos de nivel de glucosa?"
Q4.1 CORRECT "70 mg/dL"
Q4.2 INCORRECT "50 mg/dL"
Q4.3 INCORRECT "100 mg/dL"
Q4.4 INCORRECT "120 mg/dL"

QUESTION 5 - TEST ENGINE
1. "¿Cual de estos es un síntoma de la hipoglucemia?"
Q5.1 CORRECT "Sentimiento de susto"
Q5.2 INCORRECT "Falta de energía"
Q5.3 INCORRECT "Sed intensa"
Q5.4 INCORRECT "Falta de sed"

QUESTION 6 - TEST ENGINE
1. "¿Qué regla práctica existe para combatir la hipoglucemia?"
Q6.1 CORRECT "Regla del 15"
Q6.2 INCORRECT "Regla del 30"
Q6.3 INCORRECT "Regla de carbohidratos"
Q6.4 INCORRECT "Regla del azúcar"

QUESTION 7 - TEST ENGINE
1. "Cual de estos NO es una zona de aplicación de insulina"
Q7.1 CORRECT "Muñecas"
Q7.2 INCORRECT "Abdomen"
Q7.3 INCORRECT "Muslos"
Q7.4 INCORRECT "Gluteos"

QUESTION 8 - TEST ENGINE
1. "¿Cuál es la zona de absorción más rápida para la insulina inyectada?"
Q8.1 CORRECT "Abdomen"
Q8.2 INCORRECT "Brazos"
Q8.3 INCORRECT "Muslos"
Q8.4 INCORRECT "Gluteos"

QUESTION 9 - TEST ENGINE
1. "En las buenas prácticas de inyección, ¿en qué se dividen las zonas?"
Q9.1 CORRECT "Cuadrantes"
Q9.2 INCORRECT "Pares"
Q9.3 INCORRECT "Tres"
Q9.4 INCORRECT "No se dividen"

QUESTION 10 - TEST ENGINE
1. "¿A qué temperatura se debe guardar la insulina de reserva?"
Q10.1 CORRECT "2 a 8 grados"
Q10.2 INCORRECT "-5 a 5 grados"
Q10.3 INCORRECT "0 a 10 grados"
Q10.4 INCORRECT "4 a 12 grados"

END
`

export default function ModuloTresQuizTresScreen() {
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
        console.warn('No se pudo completar el quiz 3.', error)
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
        title="Quiz módulo 3"
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
