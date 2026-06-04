import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { QuizConjuntoEngine, type QuizQuestion } from '@/components/quiz-conjunto-engine'
import { completeQuizForActiveUser } from '@/lib/db/modulo-repo'
import { parseQuizConjuntoScript } from '@/lib/parse-quiz-conjunto-script'

const QUIZ_ID = 1
const FADE_MS = 220
const BLUE = '#0094ff'
const GRAY = '#6B7280'

type CompletionStage = 'quiz' | 'module'

export const QUIZ_SCRIPT = `
START TEST

QUESTION 1 - BOUNDING BOX ENGINE
1. "¿Dónde estaría el páncreas en este cuerpo?"
Image: cuerpo.jpg
Bounding box edges: 723x1244, 1235x1244, 725x1476, 1235x1476
Image size: 1902x2569

QUESTION 2 - TEST ENGINE
1. "¿Que celulas del pancreas producen la insulina?"
Q2.1 CORRECT "Beta"
Q2.2 INCORRECT "Alfa"
Q2.3 INCORRECT "Gamma"
Q2.4 INCORRECT "Omega"

QUESTION 3 - TEST ENGINE
1. "Nos has comido en un tiempo, y te empieza a faltar azúcar en la sangre. ¿Que celular te ayudan a arreglar esto?"
Q3.1 CORRECT "Alfa"
Q3.2 INCORRECT "Beta"
Q3.3 INCORRECT "Gamma"
Q3.4 INCORRECT "Omega"

QUESTION 4 - TEST ENGINE
1. "¿Que tipo de diabetes ocurre porque tus músculos no reciben la insulina producida?"
Q4.1 CORRECT "2"
Q4.2 INCORRECT "1"
Q4.3 INCORRECT "Gestacional"
Q4.4 INCORRECT "Otros tipos"

QUESTION 5 - TEST ENGINE
1. "¿Que tipo de diabetes ocurre porque el sistema inmune ataca a las células beta?"
Q5.1 CORRECT "1"
Q5.2 INCORRECT "2"
Q5.3 INCORRECT "Gestacional"
Q5.4 INCORRECT "Otros tipos"

QUESTION 6 - TEST ENGINE
1. "En diabetes gestacional, ¿A quien se le diagnostica la diabetes?"
Q6.1 CORRECT "La madre"
Q6.2 INCORRECT "El bebe"
Q6.3 INCORRECT "El padre"
Q6.4 INCORRECT "Bebe y madre"

QUESTION 7 - TEST ENGINE
1. "Si tengo diabetes porque mis células Beta tienen un defecto genético, el tipo es…"
Q7.1 CORRECT "Otros tipos"
Q7.2 INCORRECT "1"
Q7.3 INCORRECT "2"
Q7.4 INCORRECT "Gestacional"

QUESTION 8 - TEST ENGINE
1. "Cual es el tipo de diabetes más común?"
Q8.1 CORRECT "2"
Q8.2 INCORRECT "1"
Q8.3 INCORRECT "Gestacional"
Q8.4 INCORRECT "Otros tipos"

QUESTION 9 - TEST ENGINE
1. "¿Cómo se conoce la condición de tener el nivel de glucosa encima de rangos normales?"
Q9.1 CORRECT "Hiperglucemia"
Q9.2 INCORRECT "Hipoglucemia"
Q9.3 INCORRECT "Macroglucemia"
Q9.4 INCORRECT "Microglucemia"

QUESTION 10 - TEST ENGINE
1. "¿Cual de estos es un síntoma de la hiperglucemia?"
Q10.1 CORRECT "Sed excesiva"
Q10.2 INCORRECT "Falta de hambre"
Q10.3 INCORRECT "Palpitaciones fuertes"
Q10.4 INCORRECT "Subida de peso"

END
`

const QUIZ_IMAGE_MAP = {
  'cuerpo.jpg': require('@/assets/Clases/1/cuerpo.jpg'),
} as const

export default function LaDiabetesQuizUnoScreen() {
  const router = useRouter()
  const [isCompletionVisible, setIsCompletionVisible] = useState(false)
  const [completionStage, setCompletionStage] = useState<CompletionStage>('quiz')
  const [scoreText, setScoreText] = useState<'10/10' | '9/10' | '8/10'>('10/10')
  const completionOpacity = useRef(new Animated.Value(0)).current
  const autoBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasCompletedFlowRef = useRef(false)

  const questions = useMemo(() => {
    const parsed = parseQuizConjuntoScript(QUIZ_SCRIPT)
    return parsed.map(question => {
      if (question.kind === 'bounding-box') {
        const imageSource = QUIZ_IMAGE_MAP[question.imageKey as keyof typeof QUIZ_IMAGE_MAP]
        if (!imageSource) throw new Error(`Imagen de quiz no mapeada: ${question.imageKey}`)
        return {
          ...question,
          imageSource,
          insideResultText: '¡Muy bien!',
          outsideResultText: 'No es ahí exactamente.',
        } satisfies QuizQuestion
      }
      return question satisfies QuizQuestion
    })
  }, [])

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
        console.warn('No se pudo completar el quiz 1.', error)
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
