import { useMemo } from 'react'

import { PruebaTestEngine } from '@/components/prueba-test-engine'
import { parsePruebaTestEngineScript } from '@/lib/parse-prueba-test-engine-script'

/**
 * Guion de ejemplo con la sintaxis documentada en `.cursor/rules/prueba-test-engine.mdc`.
 * El paso 3 inicia el test; las ramas 3.0.x / 3.1.x son incorrecto / correcto.
 */
const TEST_SCRIPT = `
1. "Hola!"
2. "Vamos a hacerle tap al boton correcto"
3. "Elije bien" START TEST
Q3.1. CORRECT "correcto"
Q3.2. INCORRECT "no"
Q3.3. INCORRECT "no"
Q3.4. INCORRECT "no"
3.0.1. "Veamos, eso esta... Mal"
3.0.2. "Volvamos..." BACK TO NORMAL PATH
3.1.1. "Bien!"
3.1.2. "Sigamos..." BACK TO NORMAL PATH
4. "Funciono?"
5. "Hazmelo saber"
`

export default function PruebaTestScreen() {
  const plan = useMemo(() => parsePruebaTestEngineScript(TEST_SCRIPT), [])

  return (
    <PruebaTestEngine
      title="Test"
      textSource={plan.textSource}
      choicesTriggerStep={plan.choicesTriggerStep}
      choices={plan.choices}
      correctOutcomeTextSource={plan.correctOutcomeTextSource}
      incorrectOutcomeTextSource={plan.incorrectOutcomeTextSource}
    />
  )
}
