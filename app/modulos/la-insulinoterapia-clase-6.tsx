import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'

const FADE_MS = 220
const CLASE_ID = 6
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const CONTENIDO_PARAFOS = [
  'Ya sabemos como llegamos a tener la insulina administrable que utilizamos hoy. Sin embargo, si sabes del tema, sabes que hay **diferentes tipos de insulina** administrable.',
  '¿Por qué no hay simplemente una sola insulina que se inyecta una vez al día y listo? ¿Por qué algunos pacientes usan una insulina por la noche y otra antes de comer?',
  'La respuesta está en la biología. Para saber el porqué, debemos entender como **un cuerpo sano utiliza la insulina**.',
  'Ya sabemos que la insulina maneja el nivel de azúcar en nuestra sangre. Sin embargo, esto no significa que la insulina solo esté presente después de comer, momento en el cual el azúcar en nuestra sangre subirá.',
  'La insulina está **siempre presente**. Incluso cuando duermes o llevas horas sin comer, esta sigue trabajando. Y cuando comes, el páncreas lanza una **descarga adicional** que se suma a esta base constante.',
  'Estas dos formas de secreción tienen nombres propios: la **insulina basal** y la **insulina prandial** respectivamente.',
  'Hablemos primero de la insulina basal. Como el nombre lo indica, es la insulina base sobre la cual funciona el cuerpo.',
  'Piensa en lo que ocurre mientras duermes. Tu corazón sigue latiendo. Tus pulmones siguen respirando. Tu cerebro procesa sueños, regula la temperatura, supervisa tus órganos…',
  'Todo eso **requiere energía**. Y la energía del cuerpo viene de la glucosa. ¿Y de donde sale dicha energía? Después de todo, no hemos comido hace tiempo. La respuesta es el **hígado**.',
  'Piénsalo como una **batería de reserva** para tu cuerpo. Este almacena glucosa en en forma de **glucógeno**, y la va liberando poco a poco al torrente sanguíneo según tu cuerpo lo necesita.',
  'Entonces, estamos en reposo, y el cuerpo utiliza sus reservas ya que no hemos comido. Ahora, ¿Qué evita que el hígado libere demasiada glucosa en estos momentos de reposo?',
  'La respuesta es la **insulina basal**. Una secreción de insulina pequeña, constante, y continua, proveniente de, como ya sabemos, el páncreas.',
  'Esta ayuda a controlar el hígado, diciéndole que no libere más glucosa de la necesaria. Sin la insulina basal, el hígado seguiría produciendo glucosa sin parar.',
  'De hecho, puede llegar incluso a **triplicarla**. Por lo tanto, a pesar de ser nuestra base, es aún inmensamente importante',
  'En resumen, cuando no hemos comido, el cuerpo libera glucosa de reserva como fuente de energía. Esta glucosa de reserva tiene que ser regulada, por lo que necesitamos la insulina basal.',
  '¿Todo claro? Sigamos a la siguiente.',
  'El otro tipo es la **insulina prandial**. Cuando ingieres alimentos, la glucosa obtenida pasa rápidamente al torrente sanguíneo, subiendo rapidamente el nivel de azúcar.',
  'El páncreas detecta ese aumento casi de inmediato, y las células beta lanzan una respuesta que es todo lo contrario a la insulina basal: **rápida, intensa y breve**.',
  'Esta descarga de insulina asociada a las comidas se llama insulina prandial. Prandial viene de *prandium*, lo cual es comida en latin.',
  'Su propósito es muy diferente al de la insulina basal. Mientras que la basal controla al hígado, la insulina prandial tiene dos misiones principales…',
  '**Frenar completamente la producción de glucosa** en el hígado durante el período de la comida, para que no siga añadiendo glucosa a la que ya llega del intestino…',
  'y **dirigir la glucosa del torrente sanguíneo hacia los músculos**, donde se almacena como glucógeno para ser usada como energía más tarde.',
  'Siendo, en términos simples, la insulina de las comidas. esperarías que esta empiece a actuar solamente cuando el azúcar este alta para actuar. Sin embargo, la respuesta empieza antes.',
  'Simplemente con ver, oler o anticipar la comida, se genera una respuesta anticipatoria. También, cuando las comidas pasan por el intestino, este ayuda a amplificar la respuesta del páncreas. Fascinante, ¿verdad?',
  'Entonces ya sabes, basal es en reposo, y prandial es de comidas. Basal tiene que ver con las reservas del hígado, y prandial son los picos cuando comes.',
  'Estas dos se dividen en un 50/50 la insulina que produce tu cuerpo. Ya con esto claro, podemos entender mejor el por qué existen diferentes tipos de insulina.',
  'Entonces, teniendo todo esto en cuenta, podemos entender que, en la insulinoterapia, la insulina administrada **tiene que imitar este patrón**.',
  'Es por esta razón que existen dos grandes familias de insulinas terapéuticas.: **Insulinas de acción prolongada (basales)** y las **insulinas de acción rápida (prandiales)**.',
  'Las insulinas de acción prolongada están diseñadas para actuar de manera lenta, estable y prolongada, imitando esa secreción de fondo que el páncreas mantiene las 24 horas.',
  'Se inyectan **una vez al día**, o incluso **una vez por semana en las formulaciones más modernas**. Su trabajo es hacer lo que hace la insulina basal natural: mantener al hígado **controlado** entre comidas y durante la noche.',
  'Las insulinas de acción rápida están diseñadas para actuar rápido y desaparecer en pocas horas, imitando los picos naturales que ocurren al comer.',
  '**Se inyectan justo antes de las comidas** y su trabajo es hacer lo que hace la insulina prandial natural: captar la glucosa que llega del intestino.',
  'La combinación de una insulina basal más insulinas prandiales en cada comida se llama **esquema bolo-basal**, y es la forma más fisiológica de administrar insulina: la que más se acerca a lo que haría un páncreas sano.',
  'Entonces recuerda, si eres un paciente que necesita usar insulina administrada, estos patrones no son arbitrarios. Son recreaciones del funcionamiento necesario que tu cuerpo necesita.',
  'Por lo tanto, es importante adherirse a las indicaciones del profesional que te atienda. La terapia imita a la fisiología.',
  '¿Qué tal te pareció el tema? Como puedes ver, entender el porqué nos ayuda a entender mejor todo. ¡Hasta la próxima!',
]

const CONTENIDO_TEXTO_SOURCE = CONTENIDO_PARAFOS.map((p, i) => {
  const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `${i + 1}. "${escaped}"`
}).join('\n')

export default function LaInsulinoterapiaClaseSeisScreen() {
  const router = useRouter()
  const [isCompletionVisible, setIsCompletionVisible] = useState(false)
  const [completionStage, setCompletionStage] = useState<'lesson' | 'module'>('lesson')
  const [awardedPoints, setAwardedPoints] = useState(0)
  const contentOpacity = useRef(new Animated.Value(1)).current
  const completionOpacity = useRef(new Animated.Value(0)).current
  const hasCompletedFlowRef = useRef(false)
  const autoBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (!autoBackTimerRef.current) return
      clearTimeout(autoBackTimerRef.current)
      autoBackTimerRef.current = null
    }
  }, [])

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
      console.warn('No se pudo completar la clase Los dos tipos de insulina (modulo 2).', error)
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
        <PruebaTextoEngine
          title="Los dos tipos de insulina"
          textSource={CONTENIDO_TEXTO_SOURCE}
          onAttemptAdvancePastEnd={() => {
            void handleLessonEnd()
          }}
        />
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
