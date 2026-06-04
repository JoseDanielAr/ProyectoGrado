import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'

const FADE_MS = 220
const CLASE_ID = 9
const BLUE = '#0094ff'
const GRAY = '#6B7280'

/** Guion tipo motor de texto (líneas numeradas N. "…"); sin START/END en archivo: el parser solo usa líneas numeradas. */
const CONTENIDO_PARAFOS = [
  '¡Hola! Te doy la bienvenida al módulo 3. Ya con una base de conocimiento bien definida, podemos adentrarnos a los temas más prácticos.',
  'Ya conocemos la insulina, cómo funciona, sus tipos y cómo se administra. Pero hay una pregunta que naturalmente surge en paralelo a todo eso…',
  '¿Cómo sabe una persona con diabetes si su azúcar está **bien o mal en un momento dado**?',
  'Los síntomas son una pista, pero una pista **tardía e imprecisa**. Para el momento en que el cuerpo lanza señales visibles de que el azúcar está muy alta o muy baja, el problema ya lleva tiempo ocurriendo.',
  'Lo que necesitamos es una forma de **verlo directamente**, en tiempo real, antes de que aparezcan los síntomas.',
  'Eso es exactamente lo que hace el **monitoreo de glucosa**.',
  'Verás, como ya sabemos, el azúcar en sangre no es un número fijo. **Cambia constantemente a lo largo del día**, influenciado por decenas de factores.',
  'Para alguien sin diabetes, el páncreas ajusta la insulina automáticamente y mantiene ese nivel estable sin que la persona tenga que hacer nada.',
  'Para alguien con diabetes, sin embargo, este sistema de ajuste automático es disfuncional.',
  '¿Cómo podemos compensar esta pérdida de información? En el caso de pacientes diabéticos, debemos **medir la glucosa nosotros mismos**.',
  'Hay varias cosas para las que sirve medir el azúcar. Primero, podemos **entender cómo responde el cuerpo**.',
  '¿Cómo afectó a tu azúcar el desayuno de hoy? ¿El ejercicio de la tarde la bajó o la subió? ¿Por qué amaneciste con el azúcar alta si cenaste poco? Sin datos, estas preguntas no tienen respuesta.',
  'Segundo, podemos **detectar problemas a tiempo**. Medir permite intervenir antes de que los efectos de una hiperglucemia o una hipoglucemia se salgan de control.',
  'Tercero, tener información nos ayuda a **tomar mejores decisiones**.',
  '¿Debo comer algo antes de ese paseo? ¿Necesito ajustar mi dosis de insulina? ¿Puedo manejar ahora mismo? Todas estas decisiones **se toman mejor cuando se sabe el nivel actual de glucosa**.',
  'Por último, saber los datos nos permiten **ajustar el tratamiento con el tiempo**. Los patrones que se revelan son la base sobre la que el médico ajusta las dosis, cambia medicamentos o recomienda cambios en la rutina.',
  'Entonces, como puedes ver, el monitoreo de glucosa es la conexión entre lo que ocurre dentro del cuerpo y las decisiones que se toman afuera.',
  '¿Cómo medimos la glucosa? Verás, tenemos a nuestra disposición una herramienta muy útil, el **glucómetro**. También se le puede llamar medidor de glucosa en sangre o glucosa capilar.',
  'Este es un dispositivo pequeño que mide el nivel de glucosa en una **pequeña muestra de sangre**, obtenida generalmente del dedo.',
  '¡Y lo mejor es que **te da los resultados en cuestión de segundos**! Los datos están directamente en tus manos, en cualquier lugar y en cualquier momento.',
  'El glucómetro surgió en la década de los setenta. Antes de eso, los pacientes debían recurrir a análisis de muestras de orina, o de visitas al médico. Por lo tanto, el glucómetro transformó radicalmente el autocuidado de la diabetes.',
  'Somos muy afortunados de tener esta herramienta hoy en día. Por lo tanto, **saber utilizar este dispositivo** es importante para un paciente diabético. Entonces, ¿cómo se utiliza?',
  'El proceso es sencillo. Antes de empezar, **lava y seca bien tus manos** para evitar lecturas erróneas por residuos.',
  'Ahora que tenemos las manos limpias, podemos preparar dos partes fundamentales del glucómetro: **la lanceta** y la **tira reactiva**.',
  'La lanceta es un pequeño dispositivo con una aguja muy fina, la cual vamos a utilizar para obtener la prueba de sangre. Por lo pequeña que es, el pinchazo de esta solo te dará un hormigueo leve.',
  'La lanceta se puede, y debe, cambiar. Una lanceta que ha sido utilizada muchas veces **pierde su agudez**, y causa más incomodidad.',
  'Por su parte, la tira reactiva es donde vamos a poner nuestra gota de sangre. Antes de empezar, debemos **insertarla al glucómetro**. La mayoría de los glucómetros modernos se activan al insertar la tira.',
  'Ya con todo listo, pinchas con el glucómetro la parte **lateral de la yema del dedo**. Esta es la forma menos incómoda de hacerlo. Eso hará que salga una pequeña gota de sangre.',
  'Coloca esta gota sobre el extremo de la tira reactiva. ¡Y listo! El glucómetro la absorbe, y en segundos tienes tu resultado. Como puedes ver, el proceso es muy fácil, entonces no te dejes intimidar.',
  'Como dijimos anteriormente, los datos nos permiten identificar patrones. Por lo tanto, es una buena práctica **registrar el resultado**, ya sea en el dispositivo, en una aplicación o en un cuaderno.',
  'Con esto ya tenemos el como medir la glucosa. Ahora, hablemos del **cuando**.',
  'Aquí, **no existe una respuesta única**. La frecuencia y el momento de la medición dependen del tipo de diabetes, del tratamiento que se sigue y de las circunstancias del momento.',
  'Sin embargo, sí te puedo mencionar algunos momentos que generalmente aportan la información más útil.',
  'Primero que todo, **en ayunas**. Esta es la medición más informativa para evaluar el control basal. Refleja cómo estuvo el azúcar durante la noche y si la insulina o los medicamentos del día anterior están funcionando.',
  'La medición en este momento es también la referencia para **ajustar la dosis de insulina basal**.',
  'Otro es **antes de las comidas principales**. Permite saber el nivel de partida antes de que llegue la glucosa de los alimentos, lo que ayuda a decidir la dosis de insulina rápida si corresponde.',
  'Hay varios más, y como dije, dependen del paciente. Por lo tanto, **sigue las instrucciones de una profesional** para saber cuáles son las apropiadas para ti.',
  'Como puedes ver, los tiempos no son flexibles. Cada uno refleja algo diferente.',
  'Usualmente, para las personas con diabetes tipo 1 o con esquemas de insulina intensivos, la recomendación es **medir varias veces al día**.',
  'Para personas con diabetes tipo 2 controlada con medicamentos que no causan hipoglucemia, **la medición puede ser menos frecuente**, aunque sigue siendo útil en determinados momentos.',
  'Como pudiste ver, el glucómetro es una herramienta poderosa. Sin embargo, este tiene una limitación fundamental: **solo te dice el azúcar en el momento exacto en que mides**.',
  'No te dice lo que pasó entre las mediciones. No te avisa si el azúcar está bajando mientras duermes. No te muestra si subió después del almuerzo y luego bajó sola.',
  'Si quisiéramos estudiar detalladamente los niveles de glucosa, valernos sólo del glucómetro es como tratar de entender una película viendo solamente tres o cuatro imágenes sueltas.',
  '¿Cuál es la solución para esto? Este sería algo llamado el **monitoreo continuo de glucosa**, o **CGM** (por sus siglas en inglés).',
  'Este consiste en un **sensor muy pequeño** que se inserta bajo la piel, el cual mide la glucosa en el **líquido intersticial**, el cual es el fluido que baña las células del cuerpo.',
  'El hecho de que tome como muestra el líquido intersticial y no la sangre importa. Hay un desfase de algunos minutos entre la medida por el CGM y la de tu sangre.',
  'No es un problema en condiciones estables, pero sí **puede ser relevante cuando la glucosa está cambiando muy rápido**.',
  'Una de las características más valiosas del CGM, y que lo distingue radicalmente del glucómetro, es que no solo muestra dónde está el azúcar sino también **hacia dónde va** y **con qué velocidad**.',
  'Esto lo hace mediante una flecha. Una horizontal (recta y apuntando directamente a la derecha sin ninguna elevación ni declive) significa que está estable. Ni sube ni baja.',
  'Si la flecha empieza a apuntar hacia arriba, pero aún no es vertical, **está subiendo levemente**. Cuando está completamente elevada, apuntando directo hacia arriba, es que está subiendo rápidamente.',
  'Lo mismo si va bajando: **entre más se incline hacia abajo, más rápido baja el nivel de azúcar**.',
  'Como puedes ver, es muy intuitivo y fácil de entender. Este dato de su comportamiento es muy valioso.',
  'Por ejemplo, una glucosa que en el glucómetro marcaría igual **puede ser completamente diferente** dependiendo de si está estable, subiendo o bajando.',
  'Los sistemas modernos de CGM también tienen **alarmas configurables** que avisan cuando la glucosa pasa un limite, incluyendo alertas predictivas que avisan antes de que ocurra la hipoglucemia.',
  'Para personas que duermen sin percibir sus bajadas nocturnas, esta función puede literalmente **salvar vidas**.',
  'Ten en cuenta que ninguna de las dos tecnologías, el glucómetro o el CGM, es universalmente superior. Cada uno tiene su lugar según las circunstancias de cada persona.',
  'Un profesional te hará saber cuál es la que tú necesitas.',
  'Para concluir, hablemos de cómo podemos leer los datos. Como dije al inicio, más allá de perseguir número, estamos **buscando patrones**. Una medición aislada dice poco. Los patrones dicen mucho.',
  'Un valor alto en un momento dado puede tener muchas explicaciones. Pero si ese mismo valor elevado **aparece sistemáticamente**, eso ya es información accionable.',
  'Por eso **los registros son importantes**: permiten comparar, encontrar consistencias y llevar esa información al médico para tomar decisiones informadas.',
  'Pregúntale a un profesional acerca de los patrones que veas, y de cuáles debes estar al tanto. Si ves algo interesante dentro de tus registros, hazlo saber. Recuerda, está allí para ayudarte en este proceso.',
  'El monitoreo de glucosa no es solo una obligación médica. Es una **herramienta de autoconocimiento**.',
  'Muchas personas con diabetes reportan que empezar a medir regularmente les permitió entender por primera vez cómo ciertos alimentos afectan su azúcar, o qué efecto tenía caminar media hora en sus niveles.',
  'Al mismo tiempo, es importante que el monitoreo **no se convierta en una fuente de ansiedad constante**. Ver un valor elevado de vez en cuando no es una catástrofe. Lo que importa es el patrón general.',
  'El objetivo no es perseguir números perfectos en cada medición. El objetivo es **tener suficiente información para vivir bien y tomar buenas decisiones**.',
  '¡Y con esto terminamos esta clase! Espero te haya gustado, y que entiendas mejor todo acerca de la medición de glucosa. ¡Hasta la próxima!',
]

const CONTENIDO_TEXTO_SOURCE = CONTENIDO_PARAFOS.map((p, i) => {
  const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `${i + 1}. "${escaped}"`
}).join('\n')

export default function ModuloTresClaseNueveScreen() {
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
      console.warn('No se pudo completar la clase Como medir la glucosa (modulo 3).', error)
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

  const screenTitle = 'Como medir la glucosa'

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
