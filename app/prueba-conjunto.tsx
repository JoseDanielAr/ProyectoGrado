import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BoundingBoxEngine } from '@/components/bounding-box-engine'
import { PruebaTestEngine } from '@/components/prueba-test-engine'
import { PruebaTextoEngine } from '@/components/prueba-texto-engine'
import { parsePruebaTestEngineScript } from '@/lib/parse-prueba-test-engine-script'

const FADE_MS = 220

const INTRO_TEXTO_SOURCE = [
  '1. "Hola, hay varias cosas que vamos a utilizar en esta app para aprender"',
  '2. "Esto es texto junto con mi hermosa voz. Espero te guste, porque lo vas a estar escuchando todo este tiempo."',
  '3. "Ahora, hay veces que podre mostrarte una imagen... Como esta:"',
].join('\n')

const BOUNDING_TEXT_SOURCE =
  '1. "Tambien vas a interactuar con imagenes durante el curso. Aqui, toca el 3."'

const CONJUNTO_TEST_SCRIPT = `
1. "Tambien vamos a utilizar tests. Tal vez crees que esto es un texto normal, pero..."
2. "Puedo hacer... Esto!" START TEST
Q2.1. CORRECTO "Wow, asombroso!"
Q2.2. INCORRECTO "Meh..."
Q2.3. INCORRECTO "Aburrido..."
Q2.4. INCORRECTO "...?"
2.0.1. "E-Enserio? You creo que es muy cool..." BACK TO NORMAL PATH
2.1.1. "Muy cool, cierto? Sabia que te iba a gustar!" BACK TO NORMAL PATH
3. "Eso seria todo. Con tu tutorial acabado, podemos empezar!"
`

const OUTRO_TEXTO_SOURCE = [
  '1. "Espero estes preparado, porque..."',
  '2. "Aqui vamos!" (Cut to MascotaFeliz)',
].join('\n')

type ConjuntoPhase = 'introTexto' | 'bbox' | 'test' | 'outroTexto'

export default function PruebaConjuntoScreen() {
  const [phase, setPhase] = useState<ConjuntoPhase>('introTexto')
  const opacity = useRef(new Animated.Value(0)).current
  const transitionLock = useRef(false)

  const testPlan = useMemo(() => parsePruebaTestEngineScript(CONJUNTO_TEST_SCRIPT.trim()), [])

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start()
  }, [opacity])

  const transitionTo = useCallback(
    (next: ConjuntoPhase) => {
      if (transitionLock.current) return
      transitionLock.current = true
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return
        setPhase(next)
        requestAnimationFrame(() => {
          Animated.timing(opacity, {
            toValue: 1,
            duration: FADE_MS,
            useNativeDriver: true,
          }).start(() => {
            transitionLock.current = false
          })
        })
      })
    },
    [opacity]
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Animated.View style={[styles.layer, { opacity }]}>
        {phase === 'introTexto' ? (
          <PruebaTextoEngine
            title="Conjunto"
            textSource={INTRO_TEXTO_SOURCE}
            onAttemptAdvancePastEnd={() => transitionTo('bbox')}
          />
        ) : null}

        {phase === 'bbox' ? (
          <BoundingBoxEngine
            title="Conjunto"
            textSource={BOUNDING_TEXT_SOURCE}
            imageSource={require('@/assets/InsulinApp/BoundingBoxes/BoundingBoxTest.png')}
            imageSizePx={{ width: 2048, height: 2048 }}
            boundingBoxPixels={{ minX: 215, maxX: 858, minY: 1195, maxY: 1839 }}
            insideResultText="Bien! Asi se hace. Toca aqui para continuar."
            outsideResultText="Hmm... No, esta mal. Toca aqui para continuar."
            onInteractionComplete={() => transitionTo('test')}
          />
        ) : null}

        {phase === 'test' ? (
          <PruebaTestEngine
            title="Conjunto"
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
            title="Conjunto"
            textSource={OUTRO_TEXTO_SOURCE}
            imageAssetMap={{
              MascotaFeliz: require('@/assets/InsulinApp/Mascota/MascotaFeliz.png'),
            }}
          />
        ) : null}
      </Animated.View>
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
})
