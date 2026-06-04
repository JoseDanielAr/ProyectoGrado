import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTestEngine } from '@/components/prueba-test-engine'
import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'
import { parsePruebaTestEngineScript } from '@/lib/parse-prueba-test-engine-script'

const FADE_MS = 220
const CLASE_ID = 2
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const INTRO_TEXTO_SOURCE = [
  '1. "Bueno, ya conocemos el órgano importante para este tema, junto con las células y hormonas de interés."',
  '2. "Este órgano funciona de manera automática y precisa, buscando el rango deseado... Usualmente." (Shift to MascotaOops)',
  '3. "Ya sabemos, sin embargo, que esto no es siempre el caso. Hay casos en que pueden ocurrir dos cosas: No se produce suficiente insulina..." (Cut to default)',
  '4. "O el cuerpo no responde bien a la insulina que sí se produce. Hay casos en que son las dos cosas a la vez."',
  '5. "En estos dos casos, **la glucosa se acumula en la sangre**, y no puede ser aprovechada correctamente."',
  '6. "¿Te suena? Esto es, en términos muy resumidos, **la diabetes**."',
].join('\n')

const LESSON_TEST_SCRIPT = `
1. "Cuando comes, tu cuerpo convierte los alimentos en glucosa (azúcar)."
2. "Esta glucosa pasa a la sangre, y de la sangre tiene que ir a los otros lados de tu cuerpo."
3. "Entonces hay cierta célula especial en tu páncreas que nos da la llave al resto de tu cuerpo, como tus músculos y tejido graso..."
4. "Esta llave siendo la insulina. Por lo tanto, nos ayuda a bajar  el nivel de azúcar en tu sangre. ¿Te acuerdas de cuál es esta célula?" START TEST
Q4.1. CORRECT "Células Beta"
Q4.2. INCORRECT "Células Alfa"
Q4.3. INCORRECT "Células Omega"
Q4.4. INCORRECT "Células Mu"
4.0.1. "No, son las células **Beta**." BACK TO NORMAL PATH
4.1.1. "Muy bien, me alegro que hayas prestado atención." BACK TO NORMAL PATH
5. "Las células **Beta** del páncreas actúan, bajando el nivel de azúcar en tu sangre y permitiendo que entre a otros lados."
`

const OUTRO_TEXTO_SOURCE = [
  '1. "Cabe aclarar que la insulina no solo afecta el nivel de azúcar, sino también promueve la **formación de grasa** y la **incorporación de aminoácidos**."',
  '2. "Teniendo esto en cuenta podemos entender mejor la diabetes: Una enfermedad crónica en donde el cuerpo no puede manejar bien la azúcar de la sangre."',
  '3. "El cuerpo la acumula en la sangre y no la puede aprovechar como fuente de energía."',
  '4. "Y debido a las otras funciones de insulina que mencioné, también altera el metabolismo de **grasas** y **proteínas**."',
  '5. "El estado de tener mucha azúcar en tu sangre se llama **hiperglucemia**." (Shift to Hyperglycemia)',
  '6. "Sin esa preciada azúcar, hay partes de tu cuerpo que pueden dañarse, especialmente las siguientes: Los **riñones**, los **ojos**, los **nervios**, tu **corazón**."',
  '7. "Muchos de estos daños son silenciosos y sin síntomas evidentes. Por lo tanto, aunque no te sientas mal, es importante **mantener consistencia en tu tratamiento**."',
  '8. "Eso fue un resumen corto de lo que es la diabetes. Ahora, quiero hablarte de algo que llamamos la **prediabetes**." (Cut to default)',
  '9. "Esta es una etapa intermedia importante. Esta sirve como una zona de alerta donde los valores de glucosa son altos, pero **no lo suficiente para un diagnóstico formal.**" (Shift to PrediabetesVsDiabetes)',
  '10. "La prediabetes indica en un paciente dos cosas: **El riesgo de poder desarrollar diabetes** y **un mayor riesgo a complicaciones cardiovasculares**."',
  '11. "Pero si tu eres un paciente que entra dentro de esta categoría, ¡No te rindas! Con cambios en estilo de vida y siguiendo los consejos de un profesional..."',
  '12. "¡Puedes **retrasar** o incluso **prevenir** el desarrollo de diabetes!" (Shift to MascotaFeliz)',
  '13. "Por lo tanto, a pesar de que la prediabetes no es una diabetes segura, es aun así un llamado a la acción."',
  '14. "Cosas como una **mejor alimentación**, un **aumento en la actividad física**, y **reducir tu peso corporal** te ayudarán, y tu cuerpo te lo agradecerá." (Cut to default)',
  '15. "¡Recuerda! No te quedes solo con lo que ves en esta aplicación o en internet. La opinión de un experto debe ser tu referente principal."',
  '16. "Esta fue una introducción corta a lo que es la diabetes, y su estado intermedio la prediabetes. Esto es solo un concepto generalizado,y hay muchos más por ver."',
  '17. " Pero no te preocupes, yo te ayudaré a entenderlo todo. ¡Hasta la próxima!"',
  'END',
].join('\n')

type LessonPhase = 'introTexto' | 'test' | 'outroTexto'
type CompletionStage = 'lesson' | 'module'

export default function LaDiabetesClaseDosScreen() {
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

  const testPlan = useMemo(() => parsePruebaTestEngineScript(LESSON_TEST_SCRIPT.trim()), [])

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
      console.warn('No se pudo completar la clase La diabetes.', error)
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
            title="La diabetes"
            textSource={INTRO_TEXTO_SOURCE}
            imageAssetMap={{
              MascotaOops: require('@/assets/InsulinApp/Mascota/MascotaOops.png'),
            }}
            onAttemptAdvancePastEnd={() => transitionTo('test')}
          />
        ) : null}

        {phase === 'test' ? (
          <PruebaTestEngine
            title="La diabetes"
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
            title="La diabetes"
            textSource={OUTRO_TEXTO_SOURCE}
            imageAssetMap={{
              Hyperglycemia: require('@/assets/Clases/2/Hyperglycemia.png'),
              PrediabetesVsDiabetes: require('@/assets/Clases/2/PrediabetesvsDiabetes.png'),
              MascotaFeliz: require('@/assets/InsulinApp/Mascota/MascotaFeliz.png'),
            }}
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
