import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'

const FADE_MS = 220
const CLASE_ID = 10
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const CONTENIDO_PARAFOS = [
  'Ya conocemos cómo medimos el nivel de glucosa. Ahora, quiero retomar un tema que abordamos un poco anteriormente…',
  '¿Qué ocurre cuando el azúcar en sangre se sale del rango normal? Ya sea por exceso o por defecto. Esto es, si te acuerdas de los términos **hiperglucemia** y **hipoglucemia**.',
  'La diabetes no es solo un problema de "glucosa alta". La persona que vive con diabetes enfrenta **dos extremos opuestos**, y ambos son peligrosos.',
  'Esta clase está dedicada a **entender esos dos escenarios**: qué son, por qué ocurren, qué siente el cuerpo, y qué se puede hacer.',
  'Empecemos con el escenario de los dos que hemos tocado menos hasta el momento: **la hipoglucemia**. En términos muy simples, **el nivel de glucosa en sangre ha bajado demasiado**.',
  'En términos prácticos, se habla de hipoglucemia cuando la glucosa en sangre cae por **debajo de 70 mg/dL**, aunque ese umbral puede variar ligeramente según la persona y las circunstancias.',
  'La causa más fundamental de la hipoglucemia en personas con diabetes es el desequilibrio entre la insulina disponible y la glucosa disponible.',
  'Cuando hay demasiada insulina en relación con la glucosa, esta **se consume o se deposita más rápido de lo que el cuerpo puede reponer**, y el nivel baja.',
  '¿Qué puede provocar la hipoglucemia en un paciente diabético? Verás, hay múltiples situaciones en las que puede pasar.',
  '**Una dosis de insulina demasiado alta o mal calculada**, por ejemplo, es quizá la causa más directa. Se da si se administra **más insulina de la que corresponde** a la comida ingerida o al nivel de glucosa actual.',
  'Otra razón es **saltarse una comida o comer menos de lo previsto**, especialmente si ya se administró insulina esperando esa comida. Si la insulina "busca" glucosa y no encuentra suficiente, los niveles bajan.',
  'Aquí también entra el **ejercicio físico intenso**. Este aumenta enormemente el consumo de glucosa por parte de los músculos. En una persona que usa insulina, esto puede bajar la glucosa más de lo esperado.',
  '**El alcohol** también entra aquí, ya que **interfiere con la producción de glucosa del hígado**, uno de los mecanismos naturales que el organismo usa para mantener el nivel cuando baja.',
  'Por último, hay casos en que hay una **mayor sensibilidad a la insulina**. Esto puede ocurrir en varios contextos: después de bajar de peso, con mejora del control glucémico, o simplemente en distintos momentos del día.',
  'Lo que antes era una dosis "normal" **puede volverse excesiva** si la sensibilidad cambia.',
  'Siguiendo la idea de módulos anteriores, el punto de conocer esto es con el fin de tomar medidas preventivas para mejorar nuestras decisiones y condición de vida.',
  'Entonces, aquí viene algo importante: **el cuerpo tiene un sistema de alarma**.',
  'Cuando la glucosa empieza a bajar, el organismo activa una respuesta de emergencia que genera síntomas reconocibles.',
  'Los síntomas más comunes incluyen **sudoración**, **temblor en las manos o en el cuerpo**, **sensación intensa de hambre**, **mareo**, **palpitaciones (el corazón late más fuerte o más rápido)**...',
  '**Ansiedad o nerviosismo sin causa aparente**, y **hormigueos alrededor de la boca** o en las manos.',
  'Si lo piensas, estos síntomas parecen a aquellos que puedes sentir en una **situación de estrés, o cuando sufres un susto**. Y no es casualidad: son exactamente la **misma respuesta**.',
  'El cuerpo interpreta la falta de glucosa como una amenaza, activa el sistema de alarma nervioso, y libera adrenalina para movilizar energía de reserva.',
  'Esto es solo el inicio. Conforme la glucosa baja más, aparecen síntomas diferentes, ya no de la respuesta de alarma, sino del cerebro empezando a fallar por falta de combustible.',
  'Esto incluye **dificultad para concentrarse**, **sensación de cabeza pesada o "embotada"**, **confusión**, **lentitud al hablar o pensar**, y **cambios de comportamiento**.',
  'Es fundamental saber esto: los síntomas **no son iguales en todas las personas**, ni son iguales en todos los episodios de la misma persona.',
  'Con el tiempo, muchas personas con diabetes **aprenden a reconocer** sus propias señales características.',
  'Vale la pena mencionar que hay un subgrupo de personas que, tras muchos años de diabetes o muchos episodios de hipoglucemia previos, **pierden la capacidad de sentir los síntomas de alerta**.',
  'A este fenómeno se le llama **hipoglucemia desapercibida**, y es especialmente peligroso porque la persona no recibe el aviso que necesita para actuar.',
  'Tu cuerpo no espera pasivamente. Esto desencadena una cadena de respuestas fisiológicas diseñadas para corregir la situación.',
  'El problema en la diabetes, especialmente en la tipo 1 y en la tipo 2 avanzada, es que **estos mecanismos de defensa están comprometidos**.',
  'Entonces, por ejemplo, puede pasar que el cuerpo no puede cumplir su defensa principal, y su defensa secundaria, el sentimiento de adrenalina, se debilita por episodios repetidos de hipoglucemia.',
  'En estos casos, el resultado es una **persona que puede tener la glucosa peligrosamente baja sin saberlo**. Esto es algo que debemos tener presente, y refuerza la importancia de las herramientas de la clase anterior.',
  'La mayoría de los episodios de hipoglucemia son leves o moderados: el cuerpo avisa, la persona lo reconoce, come algo dulce, y la situación se resuelve. Pero algunos episodios llegan a ser **severos**.',
  'Estos casos se conocen como **hipoglucemia severa**. En estas situaciones, la persona ya no puede tratarse a sí misma y **necesita la ayuda de otra persona** para recibir tratamiento.',
  'Aquí, la confusión puede ser tal que la persona no puede comer con seguridad, o puede haber pérdida de conciencia o convulsiones.',
  'La hipoglucemia severa no es frecuente, pero existe y es seria. En personas con diabetes tipo 1, se estima que ocurre en promedio alrededor de **un episodio severo por año**.',
  'Pero descuida, la hipoglucemia severa **es evitable en la mayoría de los casos** con ayuda de educación, buen control, y un plan claro de acción.',
  'Otra situación que vale la pena recordar es la **hipoglucemia nocturna**. Como su nombre lo indica, ocurre mientras la persona duerme.',
  'Los síntomas de alarma pueden no despertar a quien los experimenta, y la respuesta fisiológica al sueño reduce aún más la capacidad del cuerpo de corregirla por su cuenta.',
  'Muchos episodios nocturnos pasan sin que la persona se entere hasta que nota que amaneció con cansancio inusual, sudoración en la ropa o el colchón, o simplemente se lo informa el glucómetro o CGM si lo usa.',
  'La buena noticia es que la hipoglucemia leve o moderada tiene un tratamiento sencillo, accesible y que funciona rápido: **consumir glucosa o azúcar de absorción rápida**.',
  'La regla práctica más usada en el mundo es la llamada **regla del 15**: consumir aproximadamente 15 gramos de carbohidratos de acción rápida, esperar quince minutos, y volver a medir la glucosa.',
  'Si sigue baja, repetir el proceso. Una vez que la glucosa vuelve a un nivel seguro, si la próxima comida todavía está lejos, puede ser útil **comer algo pequeño con proteína o grasa para estabilizar los niveles**.',
  'Los carbohidratos que se pueden comer incluyen, por ejemplo, medio vaso de jugo de fruta natural sin pulpa, o un vaso pequeño de gaseosa. Hay incluso tabletas de glucosa para estos casos.',
  'Ten en cuenta que tampoco debes **comer en exceso** en estos casos. La ansiedad y el hambre intensos pueden llevar a comer mucho más de lo necesario, lo que termina produciendo una subida de glucosa exagerada.',
  'La regla del 15 **está diseñada precisamente para dar la cantidad justa** y esperar a ver el efecto.',
  'También es importante, especialmente en aquellos que pueden sufrir ataques severos, que las personas cercanas al paciente **sepan qué hacer** si la persona no puede tratarse sola.',
  'Estas **no pueden nunca intentar dar líquidos ni comida** a alguien inconsciente o muy confundido, ya que hay riesgo de atragantamiento.',
  'Y en estos casos, dichas personas sí pueden ayudar con el **glucagón de emergencia**. Este está disponible en presentaciones inyectables o nasales, y lo puede administrar alguien del entorno sin ser personal de salud.',
  'Para concluir, la hipoglucemia es una situación tratable. Reconocer los síntomas a tiempo y actuar con calma y rapidez, con azúcar de acción rápida, **resuelve la gran mayoría de los episodios**.',
  'Entonces, ya sabes, ¡No subestimes las señales del cuerpo! Si detectas algunos de los síntomas, no esperes que estos pasen solos.',
  'Ahora hablemos de la **hiperglucemia**. Como ya sabemos, en este caso hay demasiada glucosa en sangre y no suficiente insulina para manejarla.',
  'Conviene hacer una distinción importante. Después de comer, especialmente después de una comida rica en carbohidratos, **es normal que la glucosa suba**.',
  'El cuerpo está diseñado para eso: come, sube la glucosa, la insulina la lleva a las células, y en dos horas la glucosa vuelve a niveles normales. Eso no es una hiperglucemia problemática.',
  'Se habla de hiperglucemia cuando **los niveles se mantienen elevados de forma persistente**. En general, estos son por encima de 100 mg/dL en ayunas, o encima de 140 mg/dL dos horas después de comer.',
  'En alguien con diabetes que ya tiene un objetivo de control definido con su médico, el umbral de preocupación puede ser **diferente y más específico** para su situación.',
  'Las causas de la hiperglucemia en una persona con diabetes son variadas, y reconocerlas es la clave para corregirlas y prevenirlas.',
  'Como puedes esperarte, una de estas es **la falta de insulina o la omisión de una dosis**. Esta es la causa más directa.',
  'También puede ocurrir por las **enfermedades e infecciones**, las cuales tienen un efecto potente sobre la glucosa.',
  'Cuando el cuerpo está combatiendo una infección o sometido a estrés físico, libera hormonas como el cortisol y la adrenalina que elevan la glucosa.',
  'Otra razón es **el estrés emocional intenso**. Las mismas hormonas que el cuerpo libera durante situaciones de presión psicológica también elevan la glucosa.',
  'Por último, tenemos **comer más carbohidratos de los que la dosis de insulina puede cubrir**. Estos dos requieren un balance que debemos cuidar.',
  'Pasemos a los síntomas. Estos **son más lentos y menos dramáticos** que los de la hipoglucemia. No aparecen de golpe, sino de manera gradual. Esto lo mencionamos en clases anteriores.',
  'También mencionamos los síntomas, los cuales te voy a recordar: **sed intensa**, **cansancio**, **fatiga**, y **visión borrosa**.',
  'Una característica importante de estos síntomas es que **son reversibles**. Cuando se corrige la hiperglucemia, desaparecen. Pero si no se corrige rápido, intentar revertirlos después no será tan fácil.',
  'Una hiperglucemia breve y ocasional no produce daño permanente. El cuerpo puede tolerarla durante un tiempo.',
  'Pero cuando la glucosa alta se sostiene por semanas, meses o años, empieza a **dejar una marca en el organismo**.',
  'Hay dos situaciones en las que la hiperglucemia deja de ser un problema de manejo ambulatorio y se convierte en una **emergencia médica real**. Es importante conocerlas para poder tener un tratamiento oportuno.',
  'Estas dos situaciones son la **cetoacidosis diabética (CAD)**, y el **estado hiperosmolar hiperglucémico (EHH)**.',
  'El CAD recurre principalmente en personas con diabetes tipo 1, aunque también puede aparecer en ciertos tipos de diabetes tipo 2. Recuerda que, si no se puede utilizar la glucosa como energía, el cuerpo recurre a las grasas como alternativa.',
  'Al descomponer grandes cantidades de grasa muy rápidamente, el hígado produce unos subproductos llamados **cuerpos cetónicos**. Estos acidifican la sangre de manera peligrosa.',
  'Los síntomas de la cetoacidosis incluyen náuseas y vómitos, dolor abdominal, respiración rápida y profunda, confusión progresiva…',
  'Y un síntoma muy interesante: El aliento con olor de frutas. El CAD es una emergencia que requiere atención hospitalaria urgente.',
  'En cuanto al EHH, esta emergencia afecta principalmente a personas con diabetes tipo 2, con frecuencia adultos mayores. Se caracteriza por una hiperglucemia extrema, con valores de glucosa que pueden superar los **600 mg/dL**.',
  'Este puede producir daños severos en múltiples órganos, incluyendo el cerebro. La mortalidad del estado hiperosmolar sigue **siendo alta**, en parte porque afecta a personas mayores con otras condiciones médicas.',
  'Ambas emergencias comparten una enseñanza común: **se desarrollan cuando la hiperglucemia no se detecta ni se trata a tiempo**. Por eso el monitoreo regular de la glucosa es muy importante.',
  'Entonces, para concluir, la glucosa muy baja y la glucosa muy alta son dos caras del mismo desafío. En ambos casos, el conocimiento es la **herramienta más poderosa** que tenemos a nuestra disposición.',
  'Espero esto te ayude a identificar mejor los síntomas de tanto la hipoglucemia como la hiperglucemia, y te haya ayudado a entender la importancia del monitoreo de tu glucosa. ¡Hasta la próxima!',
]

const CONTENIDO_TEXTO_SOURCE = CONTENIDO_PARAFOS.map((p, i) => {
  const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `${i + 1}. "${escaped}"`
}).join('\n')

export default function ModuloTresClaseDiezScreen() {
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
      console.warn('No se pudo completar la clase Hipoglucemia y hiperglucemia (modulo 3).', error)
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

  const screenTitle = 'Hipoglucemia y hiperglucemia'

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
