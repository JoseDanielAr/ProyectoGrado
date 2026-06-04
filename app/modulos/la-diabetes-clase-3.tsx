import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTestEngine } from '@/components/prueba-test-engine'
import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'
import { parsePruebaTestEngineScript } from '@/lib/parse-prueba-test-engine-script'

const FADE_MS = 220
const CLASE_ID = 3
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const INTRO_TEXTO_SOURCE = [
  '1. "Ya sabemos como tu cuerpo regula la azúcar en tu sangre, y que puede pasar cuando no lo hace. Ahora, vamos a entender mejor la diabetes."',
  '2. "Esta no es solo una. De hecho, hay 3 tipos diferentes..."',
  '3. "**Tipo 1 (DM1)**, **Tipo 2 (DM2)**, y **diabetes gestacional (DMG)**"',
  '4. "La diabetes tipo 1 ocurre cuando el propio **sistema inmune** del cuerpo ataca y destruye las **células Beta** del páncreas." (Shift to Type1)',
  '5. "Como ya sabemos, esto deja al paciente sin forma de producir insulina, dejando al cuerpo incapaz de actuar sobre la azúcar en su sangre."',
  '6. "Esto ocurre ya que el cuerpo confunde a sus propias células productoras con células enemigas."',
  '7. "La diabetes tipo 1 deja al cuerpo con una **deficiencia absoluta** de la insulina, por lo que el paciente **depende completamente** de la insulina administrada para sobrevivir."',
  '8. "La diabetes tipo 1 se identifica al encontrar en la sangre los **anticuerpos específicos** de esta situación, como anticuerpos contra la insulina y anticuerpos contra los islotes."',
  '9. "En palabras más simples, sabemos que tu cuerpo atacó a las células productoras de insulina porque **encontramos su arma en la muestra de sangre**." (Cut to default)',
  '10. "Sin embargo, la presencia de anticuerpos no siempre tiene lugar. Hay algunos pacientes de DM1 que **no presentan los anticuerpos en su sangre**."',
  '11. "¿Cuál es la causa del DM1 en este caso? Realmente, es **desconocida*. Por lo tanto, ten en cuenta que es posible, en casos poco comunes, tener DM1 sin la prueba en las muestras de sangre." (Shift to MascotaOops)',
  '12. "Ahora sigamos hacia la diabetes tipo 2, o DM2. Este tipo de diabetes es el que **afecta a la gran mayoría de pacientes**." (Cut to default)',
  '13. "En este caso, **no es el sistema inmune** quién obstaculiza a las células Beta. La causa es un poco más compleja." (Shift to Type2)',
  '14. "En el DM2 son las **células del cuerpo**, como las de los músculos, el hígado, y el tejido graso, quienes dejan de responder a la insulina."',
  '15. "En este caso, no hay nadie que le quita a tu azúcar su llave para entrar al resto de tu cuerpo. ¡Resulta que las cerraduras para esa llave ya no funcionan bien!"',
  '16. "Tu cuerpo, al ver que no ha logrado regular tu azúcar, **produce más y más insulina...**"',
  '17. "Y, con el tiempo, este esfuerzo hace que **nuestras células Beta se agoten**. Al agotarse, las células Beta empiezan a fallar, y dejan de producir suficiente insulina."',
  '18. "Volviendo a nuestro ejemplo con las llaves, es como si le pidieras más y más llaves al cerrajero para tus cerraduras defectuosas..." (Cut to default)',
  '19. "¡Hasta que esté eventualmente no pueda darte más! Se le acabó el material, y **no puede con todas las llaves que tiene que producir**." (Shift to MascotaOops)',
  '20. "Por último, tenemos la **diabetes gestacional**, o **DMG**."',
  '21. "Como su nombre lo indica, esta se detecta **durante el embarazo**, específicamente después de las primeras **24 semanas**." (Shift to Type3)',
  '22. "Si la madre tiene hiperglucemia antes de las 24 semanas, se considera que esta tuvo diabetes **antes del embarazo**, y solo fue descubierto ahora."',
  '23. "Esto ocurre ya que la placenta produce hormonas que dan cierta resistencia a la insulina en la madre. Por lo tanto, ella es la diagnosticada con DMG, no el bebe."',
  '24. "Sin embargo, son los dos los que se ven afectados. **Tanto la madre como el bebe pueden ser afectados en su salud**, e incluso desarrollar DM2."',
  '25. "Esos fueron los tres principales tipos de diabetes. Hay otros tipos más específicos y menos comunes, como los causados por defectos genéticos en la función de las células beta..." (Cut to default)',
  '26. "Y los causados por enfermedades del páncreas, entre otros. A pesar de no ser tan comunes como los 3 principales. estos aún deben afrontarse con la misma importancia."',
].join('\n')

const TEST_ONE_SCRIPT = `
1. "¿Esa explicación fue un poco larga, no? Pero como pudiste ver, no es difícil de entender."
2. "Repasemos el tema. la diabetes causadas porque las células de tu cuerpo no responden a la insulina, por lo que debe producir más y así agota las células Beta es el tipo..." START TEST
Q2.1. CORRECT "2"
Q2.2. INCORRECT "1"
Q2.3. INCORRECT "gestacional"
Q2.4. INCORRECT "Otros tipos"
2.0.1. "No, es el tipo 2." BACK TO NORMAL PATH
2.1.1. "Muy bien, sí es el tipo 2." BACK TO NORMAL PATH
3. "Vamos a la siguiente."
`

const TEST_TWO_SCRIPT = `
1. "La diabetes causada por tu sistema inmunológico es el tipo..." START TEST
Q1.1. CORRECT "1"
Q1.2. INCORRECT "2"
Q1.3. INCORRECT "Gestacional"
Q1.4. INCORRECT "Otros tipos."
1.0.1. "No, es el tipo 1." BACK TO NORMAL PATH
1.1.1. "Muy bien, sí es el tipo 1" BACK TO NORMAL PATH
2. "Ahora, la siguiente."
`

const TEST_THREE_SCRIPT = `
1. "Si tengo diabetes porque mis células Beta tienen un defecto genético, el tipo es..." START TEST
Q1.1. CORRECT "Otros tipos"
Q1.2. INCORRECT "1"
Q1.3. INCORRECT "2"
Q1.4. INCORRECT "Gestacional"
1.0.1. "No, este tipo de diabetes no estaría dentro de mis 4 principales." BACK TO NORMAL PATH
1.1.1. "Muy bien. Al no estar dentro de mis 3 tipos principales, esta sería uno de los otros tipos menos comunes." BACK TO NORMAL PATH
2. "Lo dejaremos hasta aquí."
`

const OUTRO_TEXTO_SOURCE = [
  '1. "¿Cómo te fue? ¿Sí recordaste todas? Si no, descuida. No olvides que cada clase puede ser accedida otra vez sí ya está desbloqueada."',
  '2. "Eso sería todo para este tema. ¡Hasta la próxima!"',
  'END',
].join('\n')

type LessonPhase = 'introTexto' | 'testOne' | 'testTwo' | 'testThree' | 'outroTexto'
type CompletionStage = 'lesson' | 'module'

export default function LaDiabetesClaseTresScreen() {
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
      console.warn('No se pudo completar la clase Los Tipos de Diabetes.', error)
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
            title="Los Tipos de Diabetes"
            textSource={INTRO_TEXTO_SOURCE}
            imageAssetMap={{
              Type1: require('@/assets/Clases/3/Type1.jpg'),
              Type2: require('@/assets/Clases/3/Type2.jpg'),
              Type3: require('@/assets/Clases/3/Type3.png'),
              MascotaOops: require('@/assets/InsulinApp/Mascota/MascotaOops.png'),
            }}
            onAttemptAdvancePastEnd={() => transitionTo('testOne')}
          />
        ) : null}

        {phase === 'testOne' ? (
          <PruebaTestEngine
            title="Los Tipos de Diabetes"
            textSource={testOnePlan.textSource}
            choicesTriggerStep={testOnePlan.choicesTriggerStep}
            choices={testOnePlan.choices}
            correctOutcomeTextSource={testOnePlan.correctOutcomeTextSource}
            incorrectOutcomeTextSource={testOnePlan.incorrectOutcomeTextSource}
            onAttemptAdvancePastEnd={() => transitionTo('testTwo')}
          />
        ) : null}

        {phase === 'testTwo' ? (
          <PruebaTestEngine
            title="Los Tipos de Diabetes"
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
            title="Los Tipos de Diabetes"
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
            title="Los Tipos de Diabetes"
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
