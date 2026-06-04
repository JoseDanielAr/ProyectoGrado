import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'

const FADE_MS = 220
const CLASE_ID = 11
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const CONTENIDO_PARAFOS = [
  'Hay una dimensión de la insulinoterapia que a menudo se enseña demasiado rápido, casi de paso, como si fuera un trámite: **los detalles prácticos del uso diario**.',
  'Aun si usas la insulina apropiada, esta puede funcionar de manera completamente diferente si se inyecta siempre en el mismo lugar o si se guarda mal en el refrigerador.',
  'Esta clase está dedicada precisamente a eso: **los hábitos prácticos y seguros** que hacen que la insulinoterapia funcione de verdad, no solo en teoría.',
  'Empecemos por los **sitios de aplicación**. Como ya sabemos, la insulina inyectada llega al tejido subcutáneo, la capa justo debajo de la piel y antes del músculo.',
  'Si llega al músculo, entra **demasiado rápido** y puede causar hipoglucemia. Si no llega suficientemente adentro, **puede no absorberse bien**.',
  'Hay cuatro zonas principales del cuerpo que tienen el tejido subcutáneo adecuado para inyectar insulina, y cada una tiene características propias.',
  'Una de estas es **el abdomen**. Esta es la zona **más utilizada** y, para la mayoría de las personas, la **más práctica**. Ofrece una gran superficie y es de fácil acceso para la autoinyección.',
  'La región que se recomienda es la **zona lateral del abdomen**, **evitando un círculo de unos cinco centímetros alrededor del ombligo**, donde el tejido subcutáneo es más delgado.',
  'Otra zona son **los brazos**, específicamente la parte posterior del brazo entre el hombro y el codo. Esta zona suele tener un tejido subcutáneo más delgado, entonces ten cuidado al hacer la autoinyección.',
  '**Los muslos**, en su cara anterior y lateral, son nuestra siguiente zona, son otra opción habitual. Tienen bastante tejido subcutáneo en la mayoría de las personas y son de fácil acceso.',
  'Esta zona es una buena alternativa al abdomen, especialmente para las dosis de insulina basal.',
  'Por último, tenemos **los glúteos**. Se utiliza su zona superior y externa. Esta ofrece una capa subcutánea generalmente abundante, lo que reduce el riesgo de inyección intramuscular accidental.',
  'Su factor limitante es que **requieren ayuda de otra persona para la autoinyección**, lo que los hace menos prácticos en el día a día.',
  '¿Ves el patrón? Estamos buscando zonas con **buena cantidad de tejido subcutáneo**. Y también, hay algunas zonas que sirven mejor dependiendo del tipo de insulina (basal y prandial).',
  'Uno de los aspectos más interesantes de la insulinoterapia, y también uno de los menos conocidos, es que la misma **insulina inyectada en distintas partes del cuerpo no actúa exactamente igual**.',
  'En otras palabras, la **velocidad** con la que pasa al torrente sanguíneo **varía según la zona de inyección**.',
  'El **abdomen es la zona de absorción más rápida**. Eso lo convierte en el lugar más apropiado para las **insulinas de acción rápida**, que se administran antes de las comidas y necesitan actuar pronto.',
  'Los **muslos y los glúteos** son las **zonas de absorción más lenta**, lo que las hace más adecuadas para **insulinas basales**, que no necesitan actuar de inmediato sino sostenerse a lo largo de horas.',
  'Los brazos, por su parte, tienen una velocidad de absorción intermedia.',
  'Hay otros dos factores, aparte de las zonas, para tener en cuenta: el **ejercicio físico** y **la temperatura**.',
  '**El ejercicio físico aumenta el flujo de sangre en los músculos y los tejidos cercanos**. Si, por ejemplo, se inyecta insulina en el muslo y la persona sale a correr inmediatamente después…',
  'La absorción **puede acelerarse de forma impredecible**, bajando la glucosa más de lo esperado. Por eso se recomienda **evitar inyectar en una zona que vaya a tener intensa actividad muscular poco después**.',
  'En cuanto a la temperatura, **el calor acelera la velocidad de absorción, mientras que el frío hace lo contrario**.',
  'Por ejemplo, inyectar insulina que acaba de salir del refrigerador en una zona expuesta al frío puede **retrasar considerablemente el inicio de su acción**...',
  'Mientras que el calor local, como el de un baño caliente, **dilata los vasos sanguíneos y acelera la absorción**.',
  'En resumen, **el lugar y las condiciones en que se inyecta la insulina no son detalles menores**. Afectan directamente cuándo y cómo actúa la insulina en el cuerpo.',
  'Ahora hablemos de la **rotación de sitios de inyección**. Imagina que cada vez que quieres escribir algo, presionas el lápiz siempre en el mismo punto de la hoja. Con el tiempo, ese punto **se desgasta**.',
  'Esto causa que la hoja se engrose, y ya no acepte la tinta de la misma manera. Esa es la misma lógica detrás de la rotación de zonas, ya que algo similar ocurre con la piel cuando se inyecta insulina repetidamente en el mismo lugar.',
  'Hay varias razones para rotar los sitios de inyección. El **daño al tejido** es el principal. También, **inyectar siempre en la misma zona puede cambiar su estructura y alterar la velocidad de absorción** de la insulina.',
  'Entonces, ¿Cómo se rota correctamente? La estrategia más práctica es **dividir mentalmente cada zona de inyección** en cuadrantes o mitades, y usar un cuadrante diferente cada semana.',
  'Dentro de cada cuadrante, cada inyección debe hacerse al menos **un centímetro de distancia de la anterior**, avanzando en una dirección consistente, como si se siguiera el trazo de un reloj.',
  'Por ejemplo, si se usa el abdomen como zona principal, se puede dividir en cuatro cuadrantes: superior derecho, superior izquierdo, inferior derecho, y inferior izquierdo.',
  'La primera semana se usan puntos dentro del cuadrante superior derecho, la segunda semana en el superior izquierdo, y **así sucesivamente**.',
  'Dentro de cada cuadrante, **cada inyección va a un punto ligeramente diferente al anterior**.',
  'Cuando una persona recibe dos inyecciones al mismo tiempo, como insulina basal y prandial, deben aplicarse en **sitios separados**.',
  'La clave es la consistencia. No se trata de cambiar de zona de manera aleatoria cada día, sino de **seguir un patrón que permita que cada zona descanse el tiempo suficiente** antes de volver a usarse.',
  'Ahora hablemos de qué pasa cuando el tejido protesta. Esto es la **lipohipertrofia**. Esta es probablemente la complicación más frecuente de la insulinoterapia.',
  'Y, de hecho, **muchas personas que la tienen no lo saben**. Este es un **engrosamiento del tejido subcutáneo** que se forma cuando se inyecta insulina repetidamente en el mismo lugar.',
  'Se manifiesta como un **bulto o nódulo bajo la piel**. Este bulto a veces es visible, y a veces solo palpable al tacto.',
  'Esto se causa, en este contexto, a causa de inyectar en el mismo punto y también por la reutilización de agujas.',
  'Un tejido lipohipertrofico **no absorbe la insulina de manera confiable**. Hay personas que llevan años sin poder estabilizar su glucosa, y la causa es, al menos en parte, que **están inyectando en zonas dañadas sin saberlo**.',
  'Los estudios muestran que la lipohipertrofia aparece en entre el treinta y el sesenta por ciento de los adultos que usan insulina de forma crónica. Es frecuente, pero **evitable** en gran medida.',
  'Por eso es tan importante **rotar las zonas de inyección**, para evitar que estos bultos se formen. Otras medidas para evitarlo son **usar siempre agujas nuevas**, y **evitar inyectar insulina fría directamente del refrigerador**.',
  'Si crees que una zona de tu cuerpo presenta uno de los bultos, **pídele a un experto revisar la zona**. Estos pueden detectar la lipohipertrofia palpando las zonas de inyección.',
  'Vale mucho la pena pedirlo como parte de tus revisiones periódicas.',
  'Ahora, hablemos de la conservación y el almacenamiento de la insulina. Como toda proteína, esta es **sensible al ambiente que la rodea**.',
  'Una insulina que fue mal almacenada **puede perder su poder**, actuando con menor eficacia.',
  'Toda insulina que no está en uso debe guardarse en el refrigerador, en un ambiente entre dos y ocho grados centígrados.',
  'Ya que estamos trabajando con neveras de hogar, no farmacéutica, vale la pena saber que dentro de estas **la temperatura fluctúa**. Estas tienen zonas más frías y más cálidas dentro del mismo espacio.',
  'Para colocar la insulina en el lugar indicado, puedes hacer lo siguiente: **guardar la insulina en la parte central del refrigerador** (no en la puerta, donde la temperatura fluctúa, ni en el fondo, donde puede congelar).',
  'Y si es posible, **usar un termómetro para verificar que la temperatura es la correcta**.',
  'Que la insulina se congele es uno de los daños más serios que puede ocurrir, ya que **su estructura molecular se altera de manera irreversible**.',
  'Tal vez se vea normal al descongelarse, pero su poder ya está comprometida. La mejor práctica en estos casos es desecharla.',
  'Por su parte, el calor acelera la degradación química de la insulina. Para ponerlo en un contexto humano, una situación de riesgo común es **dejar la insulina dentro de un automóvil cerrado**...',
  '**Exponerla a luz solar directa**, o **guardarla cerca a una estufa**. Como puedes ver, los dos extremos son malos, por lo que este es un tema de atención.',
  'Otra cosa a tener en cuenta es que **la insulina abierta y la insulina cerrada no pueden almacenarse igual**.',
  'La insulina sin abrir va **siempre en el refrigerador**, entre dos y ocho grados. Puede mantenerse así hasta la fecha de vencimiento que figura en el envase.',
  'La insulina en uso puede conservarse **a temperatura ambiente**, generalmente por debajo de treinta grados centígrados durante el período que indica el fabricante para ese producto específico.',
  'La mayoría de las insulinas tienen un período de uso a temperatura ambiente de veintiocho días, aunque algunos productos permiten hasta cuatro, seis u ocho semanas.',
  'En el día a día, la insulina en uso **puede llevarse en el bolsillo**, el bolso o la mochila, siempre que no se exponga a temperaturas extremas.',
  'En climas cálidos o durante actividades al aire libre en verano, lo más recomendable es usar un **estuche térmico diseñado para insulina**.',
  'Asimismo, en temperaturas frías, hay que estar atentos que la insulina no se congele si la llevamos en nuestro bolso.',
  'Algo que nunca puedes hacer es **guardar la insulina directamente sobre hielo o en contacto con una bolsa de gel congelada**, ya que eso puede congelarla.',
  'Ahora que ya sabemos cómo se almacena debidamente, pasemos a lo siguiente: ¿Cómo sabemos si esta se dañó? Aquí podemos detectar las siguientes señales de alerta…',
  '**Cambio de color:** las insulinas de acción rápida y las basales claras deben ser completamente incoloras y transparentes. Cualquier coloración amarillenta o marrón es señal de degradación.',
  '**Cristales o partículas en suspensión:** si se observan partículas flotando en una insulina que debería ser completamente clara, es una señal de que algo ha cambiado en su composición.',
  '**Aspecto escarchado o cristalino:** puede indicar que la insulina ha sido congelada, aunque ya esté descongelada al momento de la revisión.',
  '**Espuma o burbujeo inusual:** puede indicar agitación excesiva, que también puede alterar la insulina.',
  'El riesgo de inyectar insulina dañada es real. Por lo tanto, ante cualquier duda o señal de alerta, es mejor prevenir que lamentar. Por tu propio bien, es mejor **no usarla**.',
  'Con estos procesos de inyección, y el buen mantenimiento de la insulina, puedes asegurarte que tu tratamiento funciona bien.',
  'Espero que esta clase te ayude. Como pudiste ver, el proceso no es solo usar insulina, sino también **usarla debidamente**. Rota las zonas de inyección, cuida tu insulina, y adhiere a las dosis de tu médico tratante.',
  'Eso sería todo. ¡Hasta la próxima!',
]

const CONTENIDO_TEXTO_SOURCE = CONTENIDO_PARAFOS.map((p, i) => {
  const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `${i + 1}. "${escaped}"`
}).join('\n')

export default function ModuloTresClaseOnceScreen() {
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
      console.warn('No se pudo completar la clase Cuidados practicos de la insulinoterapia (modulo 3).', error)
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

  const screenTitle = 'Cuidados practicos de la insulinoterapia'

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
