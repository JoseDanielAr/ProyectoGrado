import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTestEngine } from '@/components/prueba-test-engine'
import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'
import { parsePruebaTestEngineScript } from '@/lib/parse-prueba-test-engine-script'

const FADE_MS = 220
const CLASE_ID = 5
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const INTRO_TEXTO_SOURCE = [
  '1. "¡Bienvenido/a al módulo 2! Veo que superaste el quiz del modulo anterior, te felicito."',
  '2. "Ya vimos los fundamentos para entender todo lo que se aproxima. Ya sabemos qué es la diabetes, los tipos que hay, sus causas, y sus síntomas."',
  '3. "Como ya tenemos una base sobre la que apoyarnos, vamos a pasar al siguiente tema: **La Insulinoterapia**."',
  '4. "Ya sabemos que la raíz del problema son los fallos en el funcionamiento de la insulina, sea porque estas son destruidas o porque las células no las reciben."',
  '5. "Entonces, ¿Cómo combatimos esto? Es términos simples, ya que nos falta insulina…"',
  '6. "**¡Ayudemos a nuestro cuerpo a tener más!** Esa es la base de la insulinoterapia." (Shift to MascotaFeliz)',
  '7. "Este tratamiento médico consiste en administrar insulina desde afuera del cuerpo para suplir o complementar la que el páncreas ya no puede producir en cantidad suficiente." (Cut to default)',
  '8. "Este es uno de los pilares más importantes del manejo de la diabetes, y también uno de los más incomprendidos y temidos sin razón, pero eso lo veremos más adelante."',
  '9. "De hecho, necesitar insulina es parte del curso esperado de la enfermedad. Que la necesites no significa que sea un fallo por parte del paciente."',
  '10. "Es algo natural de tener la enfermedad. Entonces, como paciente diabetico, recuerda: **es un paso normal en tu tratamiento**."',
  '11. "De hecho, hoy en dia, **todas las personas con DM1** y aproximadamente el 50% de pacientes con DM2 requieren de insulina administrada."',
].join('\n')

const TEST_ONE_SCRIPT = `
1. "Con lo que ya hemos aprendido, creo que debes saber por qué aquellos con DM1, necesitan siempre la insulinoterapia. Después de todo, es porque la insulina producida por ellos es…" START TEST
Q1.1. CORRECT "Destruida"
Q1.2. INCORRECT "Defectuosa"
Q1.3. INCORRECT "Bloqueada"
Q1.4. INCORRECT "Insuficiente"
1.0.1. "No. Recuerda, en DM1, el sistema inmune **destruye** a la insulina producida." BACK TO NORMAL PATH
1.1.1. "Muy bien. El sistema inmune actúa contra la insulina producida, destruyendola." BACK TO NORMAL PATH
2. "Es por esto que aquellos con DM1 dependen de la insulina suministrada. Toda la que producen es eliminada por su cuerpo."
`

const HISTORIA_TEXTO_SOURCE = [
  '1. "Hace poco más de un siglo, a diferencia de hoy, un diagnóstico de DM1 era fatal. Los pacientes no tenían forma de hacer uso de la glucosa como energía."',
  '2. "Pero afortunadamente todo cambió en 1922, cuando dos investigadores, **Frederick Banting** y **Charles Best**, lograron extraer, y purificar insulina del páncreas de un animal."',
  '3. "Intentaron usarlo como tratamiento en un adolescente de 12 años. Este estaba en estado crítico, y cuando se le administró la insulina…"',
  '4. "¡Este hizo una **recuperación dramática**! Esto asombró a la comunidad médica mundial, y se empezó a distribuir esta insulina de origen animal por todo el mundo." (Shift to MascotaFeliz)',
  '5. "Las vidas que salvó este descubrimiento son incontables, y dio paso a la insulinoterapia que conocemos hoy." (Cut to default)',
  '6. "A pesar de que la insulina de origen animal ya no es utilizada hoy en día, no podemos minimizar su importancia como un paso histórico en la historia de la medicina."',
  '7. "¿Por qué ya no es utilizada? Verás, estas tienen limitaciones muy importantes. Debido a su origen, estas eran difíciles de obtener, podían generar reacciones inmunológicas, y existía el riesgo de contaminación con virus."',
  '8. "Entonces, en 1982, con la llegada de la ingeniería genética, se pudo hacer algo extraordinario: **producir insulina idéntica a la humana** en laboratorios, con ayuda de microorganismos."',
  '9. "Modificando genéticamente una bacteria llamada Escherichia coli, obtuvimos un hito histórico: la primera proteína terapéutica producida por ingeniería genética en ser aprobada para uso en humanos."',
  '10. "Esta fue distribuida bajo el nombre **Humulin**. Y la ciencia no paró ahí, se llegó incluso a modificar deliberadamente la estructura de la insulina para crear versiones con propiedades mejoradas, ajustadas a necesidades clínicas específicas."',
  '11. "Estas versiones modificadas se llaman **análogos de insulina**, y se continúan investigando y produciendo hasta el día de hoy."',
  '12. "De veras es fascinante. Espero te haya gustado esta introducción a la insulinoterapia y su historia. Hagamos un repaso rápido…"',
].join('\n')

const TEST_TWO_SCRIPT = `
1. "¿Recuerdas cuál fue el origen de la primera insulina que se pudo distribuir a pacientes?" START TEST
Q1.1. CORRECT "Animal"
Q1.2. INCORRECT "Vegetal"
Q1.3. INCORRECT "Microorganismos"
Q1.4. INCORRECT "Magia"
1.0.1. "No. Recuerda, fue de origen animal" BACK TO NORMAL PATH
1.1.1. "Muy bien." BACK TO NORMAL PATH
2. "Vamos a lo siguiente…"
`

const TEST_THREE_SCRIPT = `
1. "¿Como se le llama a las variantes de la insulina humana, hechas para obtener versiones mejoradas?" START TEST
Q1.1. CORRECT "Análogos"
Q1.2. INCORRECT "EX"
Q1.3. INCORRECT "Reestructurados"
Q1.4. INCORRECT "Potenciados"
1.0.1. "No. Recuerda son los análogos de insulina" BACK TO NORMAL PATH
1.1.1. "Muy bien" BACK TO NORMAL PATH
2. "Dejemos hasta aquí."
`

const OUTRO_TEXTO_SOURCE = [
  '1. "¿Cómo te fue? Con lo interesante que es el tema, espero que te hayan quedado bien. ¡Hasta la próxima!"',
  'END',
].join('\n')

const MASCOTA_MAP = {
  MascotaFeliz: require('@/assets/InsulinApp/Mascota/MascotaFeliz.png'),
}

type LessonPhase = 'introTexto' | 'testOne' | 'historiaTexto' | 'testTwo' | 'testThree' | 'outroTexto'
type CompletionStage = 'lesson' | 'module'

export default function LaInsulinoterapiaClaseCincoScreen() {
  const router = useRouter()
  const [phase, setPhase] = useState<LessonPhase>('introTexto')
  const [awardedPoints, setAwardedPoints] = useState(0)
  const [isCompletionVisible, setIsCompletionVisible] = useState(false)
  const [completionStage, setCompletionStage] = useState<CompletionStage>('lesson')
  const contentOpacity = useRef(new Animated.Value(0)).current
  const completionOpacity = useRef(new Animated.Value(0)).current
  const transitionLock = useRef(false)
  const hasCompletedFlowRef = useRef(false)
  const autoBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const testOnePlan = useMemo(() => parsePruebaTestEngineScript(TEST_ONE_SCRIPT.trim()), [])
  const testTwoPlan = useMemo(() => parsePruebaTestEngineScript(TEST_TWO_SCRIPT.trim()), [])
  const testThreePlan = useMemo(() => parsePruebaTestEngineScript(TEST_THREE_SCRIPT.trim()), [])

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
    (next: LessonPhase) => {
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
      console.warn('No se pudo completar la clase Introduccion (modulo 2).', error)
    }

    setAwardedPoints(lessonPoints)

    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(() => {
      setCompletionStage('lesson')
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
            title="Introduccion"
            textSource={INTRO_TEXTO_SOURCE}
            imageAssetMap={MASCOTA_MAP}
            onAttemptAdvancePastEnd={() => transitionTo('testOne')}
          />
        ) : null}

        {phase === 'testOne' ? (
          <PruebaTestEngine
            title="Introduccion"
            textSource={testOnePlan.textSource}
            choicesTriggerStep={testOnePlan.choicesTriggerStep}
            choices={testOnePlan.choices}
            correctOutcomeTextSource={testOnePlan.correctOutcomeTextSource}
            incorrectOutcomeTextSource={testOnePlan.incorrectOutcomeTextSource}
            onAttemptAdvancePastEnd={() => transitionTo('historiaTexto')}
          />
        ) : null}

        {phase === 'historiaTexto' ? (
          <PruebaTextoEngine
            title="Introduccion"
            textSource={HISTORIA_TEXTO_SOURCE}
            imageAssetMap={MASCOTA_MAP}
            onAttemptAdvancePastEnd={() => transitionTo('testTwo')}
          />
        ) : null}

        {phase === 'testTwo' ? (
          <PruebaTestEngine
            title="Introduccion"
            textSource={testTwoPlan.textSource}
            choicesTriggerStep={testTwoPlan.choicesTriggerStep}
            choices={testTwoPlan.choices}
            correctOutcomeTextSource={testTwoPlan.correctOutcomeTextSource}
            incorrectOutcomeTextSource={testTwoPlan.incorrectOutcomeTextSource}
            onAttemptAdvancePastEnd={() => transitionTo('testThree')}
          />
        ) : null}

        {phase === 'testThree' ? (
          <PruebaTestEngine
            title="Introduccion"
            textSource={testThreePlan.textSource}
            choicesTriggerStep={testThreePlan.choicesTriggerStep}
            choices={testThreePlan.choices}
            correctOutcomeTextSource={testThreePlan.correctOutcomeTextSource}
            incorrectOutcomeTextSource={testThreePlan.incorrectOutcomeTextSource}
            onAttemptAdvancePastEnd={() => transitionTo('outroTexto')}
          />
        ) : null}

        {phase === 'outroTexto' ? (
          <PruebaTextoEngine
            title="Introduccion"
            textSource={OUTRO_TEXTO_SOURCE}
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
