import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'

const FADE_MS = 220
const CLASE_ID = 12
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const CONTENIDO_PARAFOS = [
  'Bienvendi@ a la última clase de nuestra aplicación. Pere cerra este modulo, quiero hablarte de cómo podemos entender a nuestra glucosa, de una manera realista y sin culpa.',
  'Hay una pregunta que muchas personas con diabetes se hacen a diario, a veces varias veces al día, frente al resultado de una medición de glucosa: **¿Esto está bien o está mal?**',
  'Con lo que hemos visto en clases anteriores, podemos llegar a la conclusión de que esto **depende**. Depende de cuando se midió, de qué se comió, si hacemos ejercicio o no, entre otras cosas.',
  'Mi objetivo para esta clase no es complicar, sino **simplificar**. Porque cuando se entiende qué significan los números de glucosa, y qué no significan, se puede convivir con ellos de una manera mucho más sana, tanto física como emocionalmente.',
  'Empecemos por desmantelar un mito que genera mucho sufrimiento innecesario: el buen control glucémico **no significa tener la glucosa perfecta todo el tiempo**.',
  'No existe la glucosa perfecta. Incluso en personas sin diabetes, la glucosa sube y baja a lo largo del día. El cuerpo no es una máquina que produce valores constantes: **es un organismo vivo que responde permanentemente a lo que le pasa**.',
  'En alguien con diabetes, **esa variabilidad natural se amplía**, porque los mecanismos de regulación automática están comprometidos. Eso no es un fracaso de la persona. Es simplemente la biología de la enfermedad.',
  'Y recuerda lo que dijimos antes. No nos fijamos en numeros unicos, sino en **patrones**. No solo la medición del día de hoy, sino la tendencia de la medición en semanas y meses.',
  'Para interpretar los valores de glucosa, necesitamos saber **qué rangos se consideran saludables**. Te daré los rangos esperados en las franjas horarias de importancia.',
  '**Glucosa en ayunas (antes del desayuno):** el objetivo generalmente aceptado está entre 72 a 126 mg/dL.',
  '**Después de comer (glucosa postprandial):** se mide habitualmente dos horas después de haber comenzado una comida. El objetivo es que esté por debajo de 180 mg/dL.',
  '**Antes de dormir**Generalmente se busca que esté en un rango similar al de ayunas, entre 90 y 180 mg/dL. suficientemente alta como para no tener riesgo de hipoglucemia nocturna, pero sin exceso.',
  '**Rango general saludable**: de manera amplia, el rango glucémico que se considera dentro de objetivo es entre 70 y 180 mg/dL. Pasar la mayor parte del día dentro de ese rango es la base del buen control glucémico moderno.',
  'Ten en cuenta que estos valores son **orientativos** y **generales**. Estos pueden cambiar dependiendo de la persona, por lo que **aquellos que te de un experto** son por los que te tienes que guiar.',
  'En los últimos años, gracias al desarrollo de los CGM, vistos en una clase anterior, surgió un concepto que ha ganado mucho terreno en el mundo del manejo de la diabetes: el **tiempo en rango**, o time in range **(TIR)**.',
  'El TIR mide **la proporción del tiempo que la glucosa se mantiene dentro del rango saludable definido**. Si una persona pasa el 75% del día con la glucosa dentro de ese rango, su TIR es del 75%. Si pasa el 50%, su TIR es del 50%.',
  'El objetivo recomendado por el consenso internacional para la mayoría de los adultos con diabetes es **superar el 70%** en el TIR.',
  'El TIR no se interpreta solo. Este siempre debe acompañarse de dos métricas adicionales: **El tiempo debajo del rango** y el **tiempo encima del rango**. TBR y TAR respectivamente.',
  'Como su nombre lo indica, el TBR es cuando el nivel de glucosa es menor al mínimo del rango del paciente. El objetivo es que sea **menor al 4% del día** (menos de una hora).',
  'El TAR, por su parte, es el tiempo en que está encima del máximo. El objetivo es que sea **menor al 25% del día**.',
  'La investigación ha comenzado a demostrar que el TIR no solo refleja la experiencia cotidiana de la persona, sino que también **predice el riesgo de complicaciones a largo plazo**.',
  'El TIR es especialmente útil para quienes **usan monitores continuos de glucosa**, ya que estos dispositivos registran un valor cada pocos minutos durante el día y la noche, generando la cantidad de datos necesaria para calcularlo.',
  'Para quienes miden la glucosa de manera puntual con glucómetro, el TIR no puede calcularse de la misma forma, pero **los conceptos que representa siguen siendo igualmente válidos**.',
  'Ya que vamos a estar monitoreando nuestro nivel de glucosa, es importante saber **cuales son los factores que influyen**. Ya hemos tocado en poco en algunos, pero  aqui te los presentare más completos.',
  '**El estrés** es uno de los más subestimados. Cuando el cuerpo percibe una situación de tensión, ya sea física o emocional, libera hormonas como el cortisol y la adrenalina que elevan la glucosa.',
  '**Las enfermedades e infecciones** tienen un efecto similar. El cuerpo en estado de enfermedad libera las mismas hormonas de estrés, y la glucosa puede subir incluso cuando se come menos.',
  '**El sueño** juega un papel que muchas personas desconocen. Dormir mal, dormir poco, o tener alteraciones en el ritmo circadiano afectan la sensibilidad a la insulina y pueden elevar la glucosa en ayunas',
  '**Las hormonas** explican muchas variaciones que parecen inexplicables. En mujeres, el ciclo menstrual puede producir cambios predecibles en la glucosa en distintas fases del ciclo.',
  '**El ejercicio** tiene efectos complejos y bidireccionales. El ejercicio aeróbico moderado generalmente baja la glucosa durante y después de la actividad. Pero el ejercicio de alta intensidad puede elevarla temporalmente.',
  'Y por último, el que ya conocemos, es **la alimentación**. Aun así, la explicación no es tan simple.',
  '**No todos los carbohidratos elevan la glucosa igual.** El tipo de alimento, su combinación con grasas y proteínas, la velocidad de digestión, y el momento del día influyen en cómo cambia la glucosa después de comer.',
  'Conocer estos factores no es para complicar el manejo de la diabetes, sino para **dar contexto a los números**.',
  'Por ejemplo, cuando la glucosa sube después de una semana de estrés laboral intenso, eso tiene sentido. **No es un misterio ni un fracaso**: es fisiología.',
  'Estas subidas y bajadas se le llaman la **variabilidad glucémica**. Un poco de variabilidad es completamente normal e inevitable.',
  'Lo que se busca es que esas variaciones **no sean ni demasiado extremas ni demasiado frecuentes**. Una persona sin diabetes tiene glucosa que varía durante el día, pero dentro de un rango bastante estrecho.',
  'En alguien con diabetes, ese rango se amplía, y el objetivo del tratamiento es **reducir esa amplitud** tanto como sea posible sin provocar episodios de hipoglucemia.',
  'Una fluctuación aislada no es motivo de alarma. Una glucosa que sube después del almuerzo y vuelve al rango en dos horas es exactamente lo que se espera, y es manejable.',
  'Lo que merece atención son **los patrones de variabilidad extrema**: picos muy altos, bajadas frecuentes, o cambios bruscos sin causa aparente.',
  'Ahora hablemos de algo muy importante. Hay una dimensión de la diabetes que la medicina tradicional ha tardado en darle la atención que merece: **el impacto emocional de vivir pendiente de los números**.',
  'Muchas personas con diabetes desarrollan **una relación tensa y agotadora con el glucómetro**. Cada medición se puede empezar a sentir como un juicio.',
  'Una glucosa alta genera culpa. Una hipoglucemia genera miedo. Y la impredecibilidad a veces produce una ansiedad constante.',
  'Es importante decirlo con claridad: **un valor de glucosa alto no significa que la persona fracasó**. Puede tener muchas causas, algunas controlables y otras no.',
  'La respuesta útil no es la culpa, sino la pregunta: **¿qué puedo aprender de esto?**',
  'La búsqueda obsesiva de la glucosa perfecta puede llevar a decisiones impulsivas, a ajustes no supervisados de dosis, y a un estrés que paradójicamente dificulta el control.',
  'Por lo tanto, el **perfeccionismo** puede llegar a ser una trampa. La diabetess un proceso continuo de aprendizaje y adaptación.',
  'Lo que marca la diferencia en el largo plazo es haber sido **consistente en el seguimiento**, **honesto con el equipo de salud** sobre las dificultades, y **compasivo con uno mismo frente a los días difíciles**.',
  'La honestidad con tu médico tratante es muy importante. Como hemos mencionado antes, el objetivo no es rígido ni universal, sino subjetivo de las personas.',
  'El médico, el educador en diabetes, el equipo de salud son quienes tienen el contexto para personalizar esos objetivos y ajustarlos a medida que la situación cambia.',
  'Las consultas de seguimiento son el espacio donde **los números cobran sentido** y donde el tratamiento se afina para adaptarse a la vida real de cada persona.',
  'Entonces recuerda, con todas las herramientas que hemos visto hasta ahora, la más importante es como tú, el paciente, abordas la situación. Se consistente, y no le tengas miedo al proceso.',
  'Con esto me gustaría terminar este módulo. Fue el más largo y técnico, pero con todo lo que sabemos ya tenemos las herramientas fundamentales para vivir con la insulinoterapia.',
  'Sigue tu último quiz. Pero eso no es nuestro adiós. Siempre puedes volver aquí para repasar cualquier tema que desees. Mantén esas rachas, y haz de este conocimiento una parte de tu día a día.',
  'Buena suerte en tu quiz. ¡Hasta la próxima!',
]

const CONTENIDO_TEXTO_SOURCE = CONTENIDO_PARAFOS.map((p, i) => {
  const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `${i + 1}. "${escaped}"`
}).join('\n')

export default function ModuloTresClaseDoceScreen() {
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
      console.warn('No se pudo completar la clase Objetivos glucemicos (modulo 3).', error)
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

  const screenTitle = 'Objetivos glucemicos'

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Animated.View style={[styles.layer, { opacity: contentOpacity }]}>
        <PruebaTextoEngine
          title={screenTitle}
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
