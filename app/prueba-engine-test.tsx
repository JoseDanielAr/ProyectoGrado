import { useMemo } from 'react'

import { PruebaTestEngine } from '@/components/prueba-test-engine'

const ENGINE_TEST_INTRO = [
  '1. "Hola, vamos a hacer un test..."',
  '2. "Espero te gusten, vamos a hacer muchos en este curso."',
  '3. "Pero antes, quiero asegurarme que puedas hacer lo bien. EN otras palabras, es un testo para mi mismo."',
  '4. "Escoge el boton con un numero"',
  '5. "Todo en order? Hazmelo saber."',
  '6. "Cuidate!"',
].join('\n')

const ENGINE_TEST_INCORRECT = [
  '1. "Te pedi un numero, sabe que es... verdad? VERDAD???"',
  '2. "Descuida, mientras aprendemos de Insulina, tambien aprenderemos los numeros... Tal vez."',
].join('\n')

const ENGINE_TEST_CORRECT = [
  '1. "Bien! Bueno, no creas que te voy a felicitar tanto. Esto lo puede hacer un joven de primaria."',
  '2. "Y si eres de primaria... Felicitaciones! Buen trabajo! Estoy muy orgulloso!"',
].join('\n')

export default function PruebaEngineTestScreen() {
  const choices = useMemo(
    () => [
      { label: '13', isCorrect: true },
      { label: 'hola', isCorrect: false },
      { label: 'chao', isCorrect: false },
      { label: 'InsulinApp', isCorrect: false },
    ],
    []
  )

  return (
    <PruebaTestEngine
      title="Engine Test"
      textSource={ENGINE_TEST_INTRO}
      choicesTriggerStep={4}
      choices={choices}
      correctOutcomeTextSource={ENGINE_TEST_CORRECT}
      incorrectOutcomeTextSource={ENGINE_TEST_INCORRECT}
    />
  )
}
