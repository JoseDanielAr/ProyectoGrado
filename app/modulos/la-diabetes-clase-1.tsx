import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BoundingBoxEngine } from '@/components/bounding-box-engine'
import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'

const FADE_MS = 220
const CLASE_ID = 1
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const INTRO_TEXTO_SOURCE = [
  '1. "Hola, y bienvenido/a al inicio de tu viaje a lo largo de este fascinante tema." (Shift to MascotaFeliz)',
  '2. "Como te dije anteriormente, soy **Lina**, y voy a acompañarte a lo largo de tu aprendizaje." (Cut to default)',
  '3. "Quiero dejar todas las bases claras para que, a medida que avancemos, puedas entender todo mejor."',
  '4. "En esta, tu primera clase, vamos a ver un órgano muy importante: **El páncreas**"',
  '5. "Probablemente has escuchado hablar de este órgano. ¿Pero cuánto sabes de este? ¿De cómo funciona?"',
  '6. "Descuida, yo te guiaré paso a paso. Veamos cuánto sabes por ahora. ¿Podrías decirme en que parte del cuerpo esta ubicado?"',
].join('\n')

const BOUNDING_TEXT_SOURCE = '1. "¿Dónde estaría el páncreas en este cuerpo?"'

const OUTRO_TEXTO_SOURCE = [
  '1. "Tu páncreas está localizado por aquí. Si necesitas una referencia, solo piensa que está **encima de tus intestinos, detrás del estómago**. Esto te hará fácil localizarlo." (Shift to CuerpoRespuesta)',
  '2. "Este órgano cumple dos grandes funciones: Ayudar en la digestión de alimentos…"',
  '3. "Y la que más nos importa en nuestro caso: **Controlar el azúcar en la sangre** a través de hormonas."',
  '4. "¿Cómo hace esto? Verás, dentro del páncreas hay unas células llamadas islotes de Langerhans." (Cut to default)',
  '5. "Son solo una parte pequeña de tu páncreas, pero créeme: ¡Son inmensamente importantes!"',
  '6. "Estas son las que **regulan tu nivel de azúcar**, manteniéndolo en un rango sano."',
  '7. "Este es el señor que las descubrió, **Paul Langerhans**. Se vé que sabe mucho, ¿no? Solo mira esa barba." (Shift to PaulLangerhans)',
  '8. "De ahí viene el nombre de estas células tan importantes. Veras, él descubrió dentro de estas células dos muy especiales."',
  '9. "Las células **Beta** y las células **Alfa**."',
  '10. "Las células Beta producen la **insulina**, la hormona que baja el azúcar…" (Shift to LangerhansCell)',
  '11. "Y las células Alfa producen **glucagón**, la hormona que sube el azúcar en la sangre."',
  '12. "Estas dos trabajan en equipo para mantener tu azúcar nivelada. Una empuja hacia un lado y el otro hacia el lado opuesto."',
  '13. "¿Acabas de comer, entonces el azúcar en tu sangre subió? ¡Actívense, células Beta! Necesitamos **insulina** para bajarlo." (Cut to default)',
  '14. "¿No has comido aún y te falta azúcar en la sangre? ¡Actívense, células Alfa! Necesitamos **glucagón** para nivelarme y tener energía."',
  '15. "Como puedes ver, es fácil entender el rol de cada una. Tu cuerpo busca el equilibrio y las células dentro de tu páncreas lo mantienen."',
  '16. "El concepto es simple, pero **muy** importante para tu salud. Espero que esto te haya ayudado a entender lo que el páncreas aporta a tu cuerpo."',
  '17. "Eso sería todo. ¡Nos vemos en la próxima clase!" (Shift to MascotaFeliz)',
  'END',
].join('\n')

const outsideFeedbackText = 'No es ahí exactamente. Descuida, te lo explicaré.'

type LessonPhase = 'introTexto' | 'bbox' | 'outroTexto'
type CompletionStage = 'lesson' | 'module'

export default function LaDiabetesClaseUnoScreen() {
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
      console.warn('No se pudo completar la clase El Pancreas.', error)
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
            title="El Pancreas"
            textSource={INTRO_TEXTO_SOURCE}
            imageAssetMap={{
              MascotaFeliz: require('@/assets/InsulinApp/Mascota/MascotaFeliz.png'),
            }}
            onAttemptAdvancePastEnd={() => transitionTo('bbox')}
          />
        ) : null}

        {phase === 'bbox' ? (
          <BoundingBoxEngine
            title="El Pancreas"
            textSource={BOUNDING_TEXT_SOURCE}
            imageSource={require('@/assets/Clases/1/cuerpo.jpg')}
            imageSizePx={{ width: 1902, height: 2569 }}
            boundingBoxPixels={{ minX: 723, maxX: 1235, minY: 1244, maxY: 1476 }}
            insideResultText="Muy bien, veo que has empezado a aprender sin mi."
            outsideResultText={outsideFeedbackText}
            onInteractionComplete={() => transitionTo('outroTexto')}
          />
        ) : null}

        {phase === 'outroTexto' ? (
          <PruebaTextoEngine
            title="El Pancreas"
            textSource={OUTRO_TEXTO_SOURCE}
            imageAssetMap={{
              MascotaFeliz: require('@/assets/InsulinApp/Mascota/MascotaFeliz.png'),
              CuerpoRespuesta: require('@/assets/Clases/1/cuerpoANS.jpg'),
              PaulLangerhans: require('@/assets/Clases/1/PaulLangerhans.jpg'),
              LangerhansCell: require('@/assets/Clases/1/LangerhansCell.png'),
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
