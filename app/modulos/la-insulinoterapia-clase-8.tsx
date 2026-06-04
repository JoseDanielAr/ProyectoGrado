import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'

const FADE_MS = 220
const CLASE_ID = 8
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const CONTENIDO_PARAFOS = [
  '¡Hola! Hasta el momento, hemos hablado de qué es la insulina, cuales son los tipos que hay, y mucho más. Ahora hablemos de **como** un paciente se la aplica.',
  'Hay diferentes métodos para administrarla. Estos métodos dependen del paciente, y entender cuál es el que tu necesitas, y cómo funciona, es una parte **muy importante** de entender tu tratamiento.',
  'Antes de empezar, déjame aclarar algo que tal vez te hayas preguntado alguna vez: ¿Por qué la insulina no puede tomarse como pastilla?',
  'Esta es, probablemente, la primera pregunta que muchas personas tienen cuando escuchan hablar de insulina por primera vez. Y es una pregunta muy razonable.',
  'Verás, tomarla como pastilla implica un viaje por tu **sistema digestivo**.',
  'El estómago es un **ambiente hostil para las proteínas**. Está diseñado precisamente para descomponerlas y poder absorber sus componentes como nutrientes.',
  'La insulina es una estructura sofisticada, pero también **frágil frente a ciertos entornos**. El sistema digestivo es uno de estos.',
  'Si tragaras insulina en una cápsula, el estómago simplemente la destruiría en minutos antes de que pudiera llegar al torrente sanguíneo.',
  'Esto no es un defecto del medicamento: es simplemente la naturaleza de las proteínas como sustancias. Es la misma razón por la que no puedes tomar cosas como los anticuerpos.',
  'Entonces, en términos simples, es porque la insulina es una **proteína**, y las proteínas **no sobreviven** el viaje por el sistema digestivo.',
  '¿Todo claro? Ya que sabemos que un método oral no está disponible, entonces debemos llevar la insulina **directamente a donde puede ser absorbida** sin ser destruida.',
  'Aquí es donde entra algo que mencionamos en clases anteriores: el **tejido subcutáneo**. Este es el tejido que está justo debajo de la piel.',
  'Esta es la forma más práctica, segura y eficaz de lograrlo. Desde ahí, la insulina pasa gradualmente al **torrente sanguíneo**.',
  'Sabiendo esto, podemos continuar y conocer los dispositivos de administración disponibles.',
  'Existe una variedad de dispositivos diseñados para administrar insulina. Cada uno tiene su razón de ser, sus ventajas y sus limitaciones.',
  'Conocerlos es importante no solo para saber cómo se usan, sino para desmitificarlos. Un dispositivo que parece intimidante de lejos puede resultar sencillo cuando se entiende para qué sirve.',
  'Empecemos con **la jeringa**. Este es el método más tradicional de administrar insulina.',
  'El paciente extrae la dosis de insulina de un frasco (vial), y luego la **inyecta bajo la piel.**',
  'Las jeringas modernas para insulina son muy distintas a la imagen que muchos tienen en mente. Las agujas actuales son extremadamente finas y cortas, diseñadas específicamente para **minimizar el dolor**.',
  'Si te preocupan las jeringas, descuida. Estas no se parecen a las agujas grandes que se usan para extraer sangre o aplicar vacunas. Si sientes algo, no sería más que un leve hormigueo.',
  'Su principal ventaja es que son **la opción más económica** y **están disponibles prácticamente en cualquier lugar del mundo**.',
  'Su desventaja es que **implica más pasos**: extraer la dosis del frasco, verificar que no haya burbujas, y luego inyectar.',
  'Esto, especialmente para personas que usan insulina varias veces al día, puede volverse incómodo con el tiempo.',
  'Pasemos al siguiente método, la **pluma de insulina**. Puede que hayas visto que le refieren también como *pen* (pluma en inglés).',
  'Este es el método **más popular** actualmente. Fue introducida por primera vez en 1985 y ha evolucionado enormemente desde entonces.',
  'Se llama pluma porque su forma recuerda a un bolígrafo grueso. Por dentro lleva un **cartucho o reservorio de insulina**.',
  'El paciente **gira un selector para marcar la dosis que necesita**, luego coloca una **aguja desechable** en la punta, y con un simple clic inyecta la dosis.',
  'Las ventajas son notables: es compacta, discreta, más fácil de usar que una jeringa, permite dosificar con gran precisión, y produce menos dolor porque las agujas son muy delgadas y cortas.',
  'Los modelos más modernos incluso tienen **funciones de memoria** que registran la hora y la cantidad de la última inyección, algo muy útil para personas que pueden olvidar si ya se inyectaron o no.',
  'Existen **versiones desechables**, las cuales vienen ya cargadas con un cartucho de insulina y se descartan cuando se agotan…',
  'Y **versiones reutilizables**, las cuales se pueden recargar con cartuchos nuevos.',
  'La elección entre una y otra depende del tipo de insulina prescrita, la disponibilidad local y las preferencias personales.',
  'Las agujas de las plumas modernas son tan cortas y delgadas que muchos pacientes describen la inyección como prácticamente imperceptible.',
  '¡Con razón son tan populares! Son fáciles de usar, discretas, y sus mejores versiones te permiten incluso ayudarte a estar al tanto de tus horarios de aplicación.',
  'Sigamos con la siguiente: la **bomba de insulina**. Este es utilizado principalmente para personas con **DM1 o para casos de DM2 con necesidades muy específicas** de control.',
  'Este dispositivo, más avanzado a los anteriores, se trata de **un aparato pequeño**, del tamaño aproximado de un teléfono compacto, que el paciente lleva consigo durante el día.',
  'Está conectado a un catéter (un tubo estrecho y flexible que se introduce en el cuerpo para insertar sustancias) el cual se cambia cada pocos días.',
  'La bomba **administra insulina de manera continua a lo largo del día en pequeñas dosis**, imitando la secreción del páncreas.',
  'El paciente puede incluso activar dosis adicionales antes de cada comida para cubrir la insulina prandial (recuerda la de las comidas).',
  'Su principal ventaja es la **precisión y continuidad**: en lugar de dos o cuatro inyecciones al día, la insulina llega al cuerpo de manera mucho más parecida a como lo hace el páncreas sano.',
  'Esto puede mejorar significativamente el control del azúcar y la calidad de vida en personas con necesidades complejas.',
  'Sin embargo, también tiene limitaciones: es el método **más costoso**, y requiere mayor educación y motivación del paciente.',
  'También, conlleva ciertos riesgos como infecciones en el sitio de inserción o, en casos de fallo del dispositivo, el riesgo de que el azúcar suba rápidamente al interrumpirse la infusión.',
  'Por lo tanto, no es la primera opción para la mayoría de pacientes. Pero créeme, para aquellos que lo necesitan, es una herramienta **transformadora**.',
  'Los sistemas más modernos combinan la bomba con un sensor continuo de glucosa que mide el azúcar cada pocos minutos y **ajusta la dosis automáticamente**.',
  'Qué herramienta tan interesante, ¿no? Es una opción que marca un antes y un después en los pacientes que la necesitan. Sus ventajas superan por mucho sus desventajas.',
  'Por ahora, solo hemos hablado de aquellos que hacen uso de inyecciones. Pero **hay otras vías de inserción**. Aquí voy a hablar de la **insulina inhalada**.',
  'Este es un tipo de insulina ultrarrápida que puede administrarse mediante un **inhalador**, respirando directamente hacia los pulmones.',
  'El atractivo es evidente: sin agujas, sin inyecciones. Su aparición inicial en el mercado generó mucho entusiasmo. Sin embargo, la insulina inhalada **no es para todos**.',
  'Está contraindicada en fumadores, en personas con enfermedades pulmonares, y requiere pruebas periódicas de función pulmonar. Además, medir las dosis es más difícil que en los métodos inyectados.',
  'Por ahora, sigue siendo una **opción complementaria** más que el estándar de tratamiento, pero representa una dirección interesante hacia métodos menos invasivos.',
  'Más allá de estos medios, aún se están investigando otros como la insulina nasal y los parches de piel.',
  '¡Incluso no se han rendido aún con la vía oral! Este puede llegar algún día si logran protegerla de las enzimas digestivas.',
  'Este tema es fascinante, ¿no? Espero te haya quedado claro los métodos existentes, y por qué son utilizados.',
]

const CONTENIDO_TEXTO_SOURCE = CONTENIDO_PARAFOS.map((p, i) => {
  const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `${i + 1}. "${escaped}"`
}).join('\n')

export default function LaInsulinoterapiaClaseOchoScreen() {
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
      console.warn('No se pudo completar la clase Métodos de administración (modulo 2).', error)
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

  const screenTitle = 'Métodos de administración'

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
