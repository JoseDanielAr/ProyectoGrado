import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { BoundingBoxEngine } from '@/components/bounding-box-engine'
import { PruebaTestEngine } from '@/components/prueba-test-engine'
import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'
import { parsePruebaTestEngineScript } from '@/lib/parse-prueba-test-engine-script'

const FADE_MS = 220
const CLASE_ID = 0
const BLUE = '#0094ff'
const GRAY = '#6B7280'

/** Bloque ENGINE TEXTO — inicio del tutorial (imagen MascotaFeliz en paso 1, default en paso 2). */
const TUTORIAL_INTRO_TEXTO_SOURCE = [
  '1. "¡Hola, y bienvenido/a a InsulinApp!" (Shift to MascotaFeliz)',
  '2. "Soy Lina, y te voy a acompañar a lo largo del proceso en esta aplicación." (Cut to default)',
  '3. " En esta aplicación, haremos ejercicios, clases, y quizes para que tu puedas entender mejor tu proceso médico."',
  '4. "¿Qué es la diabetes? ¿Qué es la insulina? ¿Qué es la insulinoterapia? Juntos veremos esto, y mucho más."',
  '5. "Antes de empezar, me gustaría mostrarte los ejercicios que vamos a utilizar en este curso."',
  '6. "Primero, yo podría mostrarte una imagen, y pedir que interactúes con esta."',
  '7. "En esta toca el circulo con un 1…."',
].join('\n')

const TUTORIAL_BOUNDING_TEXT_SOURCE = '1. " Presiona el circulo donde este el 1."'

const TUTORIAL_TEST_SCRIPT = `
1. "Tambien te puedo hacer preguntas de opción múltiple en cualquier momento. Veámoslo."
2. "Te dije mi nombre al inicio. ¿Te acuerdas de cómo me llamo?" START TEST
Q2.1. CORRECT "Lina"
Q2.2. INCORRECT "Maria"
Q2.3. INCORRECT "Paola"
Q2.4. INCORRECT "Linda"
2.0.1. "No, es Lina." BACK TO NORMAL PATH
2.1.1. "¡Me alegro que te acordaras!" BACK TO NORMAL PATH
3. "¿Ves como es de fácil responder a las pruebas?"
`

const TUTORIAL_OUTRO_TEXTO_SOURCE = ['1. "Eso sería todo. Ahora podremos empezar los módulos. ¡Aquí vamos!"', 'END'].join('\n')

const outsideFeedbackLines = [
  'Como puedes ver, te lo haré saber cuando tu respuesta esté equivocada.',
  'Descuida, equivocarse aquí no afectara el puntaje en las clases. Pero sí en los quizzes.',
].join('\n\n')

type TutorialConjuntoPhase = 'introTexto' | 'bbox' | 'test' | 'outroTexto'
type CompletionStage = 'lesson' | 'module'

export default function TutorialConjuntoScreen() {
  const router = useRouter()
  const [phase, setPhase] = useState<TutorialConjuntoPhase>('introTexto')
  const [awardedPoints, setAwardedPoints] = useState(0)
  const [isCompletionVisible, setIsCompletionVisible] = useState(false)
  const [completionStage, setCompletionStage] = useState<CompletionStage>('lesson')
  const contentOpacity = useRef(new Animated.Value(0)).current
  const completionOpacity = useRef(new Animated.Value(0)).current
  const transitionLock = useRef(false)
  const hasCompletedFlowRef = useRef(false)
  const autoBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const testPlan = useMemo(() => parsePruebaTestEngineScript(TUTORIAL_TEST_SCRIPT.trim()), [])

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start()

    return () => {
      if (!autoBackTimerRef.current) return
      clearTimeout(autoBackTimerRef.current)
      autoBackTimerRef.current = null
    }
  }, [contentOpacity])

  const transitionTo = useCallback(
    (next: TutorialConjuntoPhase) => {
      if (transitionLock.current) return
      transitionLock.current = true
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return
        setPhase(next)
        requestAnimationFrame(() => {
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: FADE_MS,
            useNativeDriver: true,
          }).start(() => {
            transitionLock.current = false
          })
        })
      })
    },
    [contentOpacity]
  )

  const handleLessonEnd = useCallback(async () => {
    if (hasCompletedFlowRef.current) return
    hasCompletedFlowRef.current = true

    let lessonPoints = 0
    let moduloChangedToCompleted = false
    try {
      const result = await completeClaseForActiveUser({ claseId: CLASE_ID })
      lessonPoints = result.puntajeDadoClase
      moduloChangedToCompleted = result.moduloChangedToCompleted
    } catch (error) {
      console.warn('No se pudo completar la clase del tutorial.', error)
    }

    setAwardedPoints(lessonPoints)

    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(() => {
      setIsCompletionVisible(true)
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
    })
  }, [completionOpacity, contentOpacity, router])

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Animated.View style={[styles.layer, { opacity: contentOpacity }]}>
        {phase === 'introTexto' ? (
          <PruebaTextoEngine
            title="Tutorial"
            textSource={TUTORIAL_INTRO_TEXTO_SOURCE}
            imageAssetMap={{
              MascotaFeliz: require('@/assets/InsulinApp/Mascota/MascotaFeliz.png'),
            }}
            onAttemptAdvancePastEnd={() => transitionTo('bbox')}
          />
        ) : null}

        {phase === 'bbox' ? (
          <BoundingBoxEngine
            title="Tutorial"
            textSource={TUTORIAL_BOUNDING_TEXT_SOURCE}
            imageSource={require('@/assets/InsulinApp/BoundingBoxes/BoundingBoxTest.png')}
            imageSizePx={{ width: 2048, height: 2048 }}
            boundingBoxPixels={{ minX: 186, maxX: 851, minY: 313, maxY: 959 }}
            insideResultText="¡Bien! Así se hace. Toca esta caja para seguir."
            outsideResultText={outsideFeedbackLines}
            onInteractionComplete={() => transitionTo('test')}
          />
        ) : null}

        {phase === 'test' ? (
          <PruebaTestEngine
            title="Tutorial"
            textSource={testPlan.textSource}
            choicesTriggerStep={testPlan.choicesTriggerStep}
            choices={testPlan.choices}
            correctOutcomeTextSource={testPlan.correctOutcomeTextSource}
            incorrectOutcomeTextSource={testPlan.incorrectOutcomeTextSource}
            onAttemptAdvancePastEnd={() => transitionTo('outroTexto')}
          />
        ) : null}

        {phase === 'outroTexto' ? (
          <PruebaTextoEngine
            title="Tutorial"
            textSource={TUTORIAL_OUTRO_TEXTO_SOURCE}
            onAttemptAdvancePastEnd={() => {
              void handleLessonEnd()
            }}
          />
        ) : null}
      </Animated.View>

      {isCompletionVisible ? (
        <Animated.View style={[styles.completionLayer, { opacity: completionOpacity }]}>
          <View style={styles.completionContent}>
            {completionStage === 'lesson' ? (
              <>
                <Text style={styles.completionTitle}>¡Enhorabuena!</Text>
                <Text style={styles.completionSubtitle}>Has ganado {awardedPoints} puntos.</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  layer: {
    flex: 1,
  },
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
