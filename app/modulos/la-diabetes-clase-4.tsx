import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTestEngine } from '@/components/prueba-test-engine'
import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'
import { parsePruebaTestEngineScript } from '@/lib/parse-prueba-test-engine-script'

const FADE_MS = 220
const CLASE_ID = 4
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const INTRO_TEXTO_SOURCE = [
  '1. "Ya sabemos qué es la diabetes, y las causas por las que puede ocurrir. Ahora, quiero contarte de los síntomas que puedes presentar."',
  '2. "Como mencione en una clase anterior, un aspecto a tener en cuenta es que algunos de estos son silenciosos, por lo que la diabetes puede estar ahí **sin que lo sepas**."',
].join('\n')

const LESSON_TEST_SCRIPT = `
1. "Esto ocurre especialmente en pacientes con el tipo **más común** diabetes. ¿Te acuerdas cual es?" START TEST
Q1.1. CORRECT "2"
Q1.2. INCORRECT "1"
Q1.3. INCORRECT "Gestacional"
Q1.4. INCORRECT "Otros tipos"
1.0.1. "No. Recuerda, es el tipo 2" BACK TO NORMAL PATH
1.1.1. "Muy bien, sí es el tipo 2, o DM2." BACK TO NORMAL PATH
2. "Esto ocurre especialmente en pacientes con DM2. No es raro que alguien ya haya sido afectado por la diabetes antes de su diagnóstico formal."
`

const OUTRO_TEXTO_SOURCE = [
  '1. "Por eso, es importante estar conscientes de las señales de alerta. Así podemos evitar que el daño siga ocurriendo."',
  '2. "También, ten en cuenta que los síntomas no afectan de golpe. Estos son **graduales** y pueden camuflarse dentro de situaciones comunes como el cansancio y el envejecimiento."',
  '3. "Por lo tanto, **es fácil dar por alto los síntomas**. Descuida. yo te ayudaré a entender cuales son los más comunes para que los puedas reconocer."',
  '4. "Los síntomas más conocidos cuando la hiperglucemia es severa son los siguientes..."',
  '5. "La **sed excesiva**. Tu cuerpo ve que tienes mucha azúcar en tu sangre, por lo que intenta **diluir el exceso** atrayendo agua al torrente sanguíneo."',
  '6. "**Orinar con mayo frecuencia**. Recuerda que tus riñones sirven como un tipo de filtro para las sustancias de tu cuerpo. Cuando tienes mucha azúcar, tus riñones intentan nivelar las cosas."',
  '7. "Por lo tanto, estos empiezan a trabajar extra para **eliminar el exceso a través de la orina**.*"',
  '8. "Seguimos al **sentimiento de hambre constante**. ¿Recuerdas que el azúcar en tu sangre debería ir al resto de tu cuerpo como fuente de energía?"',
  '9. "Sin acceso a esa energía, tu cuerpo lo interpreta como si no estuviera ahí, por lo que te pide compensar. Esto ocurre **aun cuando ya has comido**."',
  '10. "Otro es la **pérdida de peso**. Esto también ocurre porque tu cuerpo no puede acceder al azúcar como fuente de energía. SIno puede utilizar esta fuente, acude a tus reservas: **la grasa y el músculo**"',
  '11. "Esta tambien **el cansancio y la fatiga persistente **. Sin esa preciada fuente de energía, **al cuerpo le falta combustible** para funcionar bien."',
  '12. "Por último, tenemos la **visión borrosa**. El exceso de glucosa **afecta el cristalino del ojo**, por lo que se afecta la capacidad de enfocar correctamente. El nivel de borrosidad cambia dependiendo de los niveles de azúcar."',
  '13. "Esos serían los síntomas clásicos de la hiperglucemia.Como puedes ver, esta afecta varios aspectos de tu cuerpo. Hay muchos síntomas a tener en cuenta."',
  '14. "Pero descuida. Con lo que hemos visto hasta ahora, ya sabemos lo clave. **Mucha sed**, **mucha orina**, **mucho cansancio**, **mucha hambre**, y **mucha pérdida de peso**." (Shift to FourP)',
  '15. "De hecho, eso podemos verlo como las **Cuatro P**, Viniendo del nombre científico. para cada síntoma."',
  '16. "Entonces piensa. Si se acumula el azúcar en mi sangre, ¿qué pasaría? Sabes no solo cuales son los síntomas clásicos, sino también el **por qué**. Saber el por qué, la lógica detrás de lo que ocurre, te ayudará a recordarlo todo mejor."',
  '17. "Esos fueron los síntomas clásicos. ¿Pero qué hay de los demás? Estos son más sutiles y, como dije al inicio, **pueden pasar desapercibidos**." (Cut to default)',
  '18. "Uno de estos síntomas son las infecciones recurrentes. EL exceso de glucosa **debilita el sistema inmune** y **favorece el crecimiento de bacterias y hongos**."',
  '19. "Otro es que las heridas **tardan en sanar**. La hiperglucemia daña la circulación, por lo que una herida puede tardar más de lo normal en cicatrizar."',
  '20. "Otro es la **boca seca**. ¿Recuerdas que alguien con diabetes puede orinar de más? Bueno, esto te deshidrata y puedes tener una sensación persistente de sequedad."',
  '21. "Otro es el **ardor o entumecimiento en los pies**. Esto es a causa de que la hiperglucemia puede dañar los nervios. Esto es la **neuropatía**. Los primeros síntomas de esto se sienten en los pies, causando el efecto."',
  '22. "Hay muchos, muchos más. Como dije, la diabetes afecta a tu cuerpo en general. Ya te dije los principales, pero si quieres saber más, siempre puedes enterarte de todos en las fuentes disponibles."',
  '23. "Y como siempre, si tienes a un profesional como referente, preguntale cuales son y comentale todos los que detectas en ti. Recuerda, ellos están ahí para ayudarte."',
  '24. "Espero esto te haya ayudado a entender mejor los síntomas principales, y por qué ocurren. Si ves algún síntoma en una persona cercana a ti, hacelo saber. Los puedes ayudar mucho."',
  '25. "Y esta ha sido la última clase de este módulo. Ya tienes la información básica acerca de la diabetes y los órganos, células, y hormonas involucradas. Ahora deberás..."',
  '26. "**¡Ponerte a prueba!** Sigue una evaluación de lo que has visto hasta ahora. Descuida, tu puedes. Y si no a la primera, entonces siempre puedes intentarlo otra vez hasta que lo logres." (Shift to MascotaFeliz)',
  '27. "Nos vemos allí. ¡Hasta la próxima!"',
  'END',
].join('\n')

type LessonPhase = 'introTexto' | 'test' | 'outroTexto'
type CompletionStage = 'lesson' | 'module'

export default function LaDiabetesClaseCuatroScreen() {
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
      console.warn('No se pudo completar la clase Sintomas de la DIabetes.', error)
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
            title="Sintomas de la DIabetes"
            textSource={INTRO_TEXTO_SOURCE}
            onAttemptAdvancePastEnd={() => transitionTo('test')}
          />
        ) : null}

        {phase === 'test' ? (
          <PruebaTestEngine
            title="Sintomas de la DIabetes"
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
            title="Sintomas de la DIabetes"
            textSource={OUTRO_TEXTO_SOURCE}
            imageAssetMap={{
              FourP: require('@/assets/Clases/4/4p.png'),
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
