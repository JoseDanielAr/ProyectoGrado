import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PruebaTestEngine } from '@/components/prueba-test-engine'
import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'
import { parsePruebaTestEngineScript } from '@/lib/parse-prueba-test-engine-script'

const FADE_MS = 220
const CLASE_ID = 7
const BLUE = '#0094ff'
const GRAY = '#6B7280'

const INTRO_PARAFOS = [
  'Hola, la clase anterior entendimos que el cuerpo sano usa una cantidad pequeña y constante de fondo durante todo el día, y lanza descargas rápidas y temporales cada vez que come.',
  'Entonces, la insulina suministrada busca imitar estos patrones. Entonces, ¿Cómo logramos imitar esos dos patrones con la insulina que se inyecta?',
  'La respuesta es que no existe una sola insulina capaz de hacer ambas cosas a la vez. Ya sabemos que todas las que existen se pueden dividir en 2: **Insulinas de acción rápida** y **insulinas de acción prolongada**.',
]

const INTRO_TEXTO_SOURCE = INTRO_PARAFOS.map((p, i) => {
  const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `${i + 1}. "${escaped}"`
}).join('\n')

const TEST_RAPIDA_SCRIPT = `
1. "Veamos si las recuerdas. Te voy a mostrar un listado de palabras, y tu me dirás cual de estas se relaciona más con uno de los grupos."
2. "Empecemos. ¿Cuál de estas se relaciona mejor con las insulinas de acción rápida?" START TEST
Q2.1 CORRECT "Comida"
Q2.2 INCORRECT "Descanso"
Q2.3 INCORRECT "Ejercicio"
Q2.4 INCORRECT "Estrés"
2.0.1. "No. Recuerda que las de acción rápida son para después de las comidas, para nivelar toda la glucosa que entra de golpe." BACK TO NORMAL PATH
2.1.1. "Muy bien. Cuando comemos, necesitamos regular toda esa glucosa que entra desde los intestinos." BACK TO NORMAL PATH
`

const TEST_PROLONGADA_SCRIPT = `
1. "Ahora, ¿cual de estas se relacionan con las de acción prolongada?" START TEST
Q1.1 CORRECT "Descanso"
Q1.2 INCORRECT "Comida"
Q1.3 INCORRECT "Ejercicio"
Q1.4 INCORRECT "Estrés"
1.0.1. "No. Recuerda que esta es la que ocurre cuando no hemos comido recientemente, y nivela el nivel de las reservas de glucosa en tu cuerpo." BACK TO NORMAL PATH
1.1.1. "Muy bien, esta es la que ocurre cuando no hemos comido recientemente, y nivela el nivel de las reservas de glucosa en tu cuerpo." BACK TO NORMAL PATH
2. "¿Sí las recordaste? Sigamos."
`

const CUERPO_PARAFOS = [
  'Expandimos nuestro conocimiento de las insulinas de acción rápida. Estas pueden venir en dos tipos: **Insulina de accion ultrarapida** y **Insulinas de accion corta**.',
  'Las ultrarapidas son las más usadas actualmente para el control de las comidas. Comienzan a actuar a los pocos minutos de inyectarse y alcanzan su efecto maximo en menos de una hora.',
  'Ejemplos conocidos de este tipo son la insulina lispro y la insulina aspart. En ambos casos, la molécula se disuelve rápidamente desde el tejido subcutáneo y llega a la sangre casi al mismo tiempo que la glucosa de la comida.',
  'La insulina de acción corta es la misma **insulina humana sin modificar**. Esta actúa más lenta que los análogos modernos: tarda entre media hora y una hora en comenzar a actuar, su efecto máximo llega entre las dos y las cuatro horas.',
  'Aunque sigue usándose en muchos contextos, los análogos modernos (como las ultrarápidas) la han reemplazado en la mayoría de los casos porque imitan mejor el patrón fisiológico.',
  'Ahora hablemos de un tema importante de las insulinas de acción rápida: la precisión del momento en que se aplican. Esto también se llama usualmente el **timing**, viniendo del ingles.',
  'Cuando se usa insulina rápida, el momento de la inyección en relación con la comida no es un detalle menor: **es parte esencial del tratamiento**.',
  'Si te inyectas demasiado temprano (mucho antes de comer), la insulina llega a la sangre antes que la glucosa de la comida. El azúcar baja demasiado, antes de que llegue el alimento que debería compensarla.',
  'Esto tiene como resultado la **hipoglucemia**.',
  'Si te inyectas demasiado tarde (mucho después de empezar a comer), la glucosa ya está elevada en sangre mientras la insulina todavía está siendo absorbida bajo la piel.',
  'Por lo tanto, la glucosa sube sin control durante un buen rato antes de que la insulina llegue a frenarlo. Esto tiene como resultado un **pico de glucosa elevado**.',
  'Si te inyectas en el momento correcto (justo antes o al inicio de la comida, en el caso de los análogos modernos), la insulina y la glucosa llegan al torrente sanguíneo aproximadamente al mismo tiempo.',
  'El azúcar sube moderadamente y vuelve a niveles normales en pocas horas. Esta es nuestra **situación ideal**',
  'La regla general para los análogos ultrarrápidos modernos es inyectar **justo antes de comer o al inicio de la comida**. Para la insulina humana regular, por su inicio más lento, la recomendación es unos veinte o treinta minutos antes.',
  'Por lo tanto, es importante seguir las recomendaciones de un profesional en cuanto al momento de la aplicación. Este no es un tema flexible, por lo que hacerlo es proteger tu salud.',
  'Ahora pasemos a la otra gran familia de insulinas, las de acción prolongada. Para evitar que el hígado produzca glucosa sin control, necesitamos una insulina que **actúe de manera estable durante muchas horas**.',
  'Entonces, ¿cómo logra esta familia alcanzar este comportamiento? Verás, la clave está en **ralentizar deliberadamente la absorción** desde el tejido subcutáneo.',
  'Esto se logra de distintas maneras según el tipo. En algunos análogos se modifica la molécula para que sea levemente ácida en solución y se precipite al contacto con el pH neutro del tejido subcutáneo.',
  'Esto forma pequeños depósitos que se van disolviendo lentamente con el tiempo',
  'En otros, como la insulina detemir, se añade una cadena de ácido graso a la molécula. Esa cadena hace que la insulina se una a las proteínas de la sangre (principalmente la albúmina) y se libere de manera gradual y prolongada',
  'Fascinante, ¿verdad? Y a la vez un poco complicada. Descuida, lo que importa es que, en ambos casos, el resultado es **una curva de acción plana y prolongada**, sin el pico brusco que tienen las insulinas rápidas.',
  'Tipos de insulina prolongada incluyen la insulina degludec y la insulina detemir. Estas tienen en común el proceso lento que acabamos de describir.',
  'Aparte de las grandes familias que hemos hablado hasta ahora, hay otras que me gustaría mencionar.',
  'Primero que todo, la **insulina intermedia**. Este es un puente entre dos eras. Antes que existieran los análogos modernos que mencionamos anteriormente, existía el **NPH** (Neutral Protamine Hagedorn).',
  'Este fue desarrollado en 1946. Este funciona por tener protamina, el cual ralentiza su absorción al formar cristales bajo la piel.',
  'Esto la hace más lenta que la insulina regular, pero no tan prolongada ni tan estable como los análogos modernos. Sin embargo, la NPH sigue siendo muy utilizada en muchos países, principalmente porque es considerablemente más económica.',
  'Por eso se considera un puente entre eras. A pesar de la existencia de soluciones más modernas, esta solución brillante de 1946, la infancia de la insulinoterapia, aún es utilizado el día de hoy, y vale la pena mencionarlo.',
  'Otro que me gustaría mencionar son las **insulinas premezcladas**. Como su nombre lo indica, son una combinación de una insulina rápida y una insulina de acción intermedia o prolongada.',
  'La idea de estas es simplificar el tratamiento: en lugar de inyectarse dos insulinas por separado, el paciente usa una sola que cumple ambas funciones.',
  'Estas son útiles **para pacientes que siguen una rutina muy regular** de horarios y comidas, las premezclas pueden ser una opción práctica y menos compleja de manejar.',
  'Su limite es que **la proporción de insulina rápida e insulina lenta es fija**. No se puede ajustar una sin ajustar la otra. Por ejemplo, si un día comes más de lo habitual, no puedes aumentarla sin aumentar también la parte basal.',
  'Las premezclas son un compromiso: **no son tan precisas como un esquema** bolo-basal bien ajustado, pero son más simples de administrar. Esa es exactamente su propuesta: menos flexibilidad a cambio de más sencillez.',
  'Para concluir, a pesar de que es tentador pensar que debe existir una insulina superior que las demás, una que sea la correcta para todos, en realidad este pensamiento es erróneo.',
  '**No existe una insulina universalmente superior.** Cada tipo existe porque resuelve una necesidad fisiológica distinta. Son herramientas diferentes para momentos diferentes.',
  'El tipo de insulina que usa cada persona depende de su tipo de diabetes, del momento en que se encuentra en la evolución de la enfermedad, de su estilo de vida…',
  'Y, sobre todo, **lo que un profesional determine como más adecuado**. Entonces recuerda, las insulinas no se pueden sustituir o cambiar a nuestro gusto. Aquellas medicadas están diseñadas específicamente para tu caso.',
  'Espero te haya gustado el tema, y te sea útil para entender tu tratamiento. ¡Hasta la próxima!',
]

const CUERPO_TEXTO_SOURCE = CUERPO_PARAFOS.map((p, i) => {
  const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `${i + 1}. "${escaped}"`
}).join('\n')

type LessonPhase = 'introTexto' | 'testRapida' | 'testProlongada' | 'cuerpoTexto'
type CompletionStage = 'lesson' | 'module'

export default function LaInsulinoterapiaClaseSieteScreen() {
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

  const testRapidaPlan = useMemo(() => parsePruebaTestEngineScript(TEST_RAPIDA_SCRIPT.trim()), [])
  const testProlongadaPlan = useMemo(() => parsePruebaTestEngineScript(TEST_PROLONGADA_SCRIPT.trim()), [])

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
      console.warn('No se pudo completar la clase Dentro de los tipos de insulina (modulo 2).', error)
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

  const screenTitle = 'Dentro de los tipos de insulina'

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Animated.View style={[styles.layer, { opacity: contentOpacity }]}>
        {phase === 'introTexto' ? (
          <PruebaTextoEngine
            title={screenTitle}
            textSource={INTRO_TEXTO_SOURCE}
            onAttemptAdvancePastEnd={() => transitionTo('testRapida')}
          />
        ) : null}

        {phase === 'testRapida' ? (
          <PruebaTestEngine
            title={screenTitle}
            textSource={testRapidaPlan.textSource}
            choicesTriggerStep={testRapidaPlan.choicesTriggerStep}
            choices={testRapidaPlan.choices}
            correctOutcomeTextSource={testRapidaPlan.correctOutcomeTextSource}
            incorrectOutcomeTextSource={testRapidaPlan.incorrectOutcomeTextSource}
            onAttemptAdvancePastEnd={() => transitionTo('testProlongada')}
          />
        ) : null}

        {phase === 'testProlongada' ? (
          <PruebaTestEngine
            title={screenTitle}
            textSource={testProlongadaPlan.textSource}
            choicesTriggerStep={testProlongadaPlan.choicesTriggerStep}
            choices={testProlongadaPlan.choices}
            correctOutcomeTextSource={testProlongadaPlan.correctOutcomeTextSource}
            incorrectOutcomeTextSource={testProlongadaPlan.incorrectOutcomeTextSource}
            onAttemptAdvancePastEnd={() => transitionTo('cuerpoTexto')}
          />
        ) : null}

        {phase === 'cuerpoTexto' ? (
          <PruebaTextoEngine
            title={screenTitle}
            textSource={CUERPO_TEXTO_SOURCE}
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
