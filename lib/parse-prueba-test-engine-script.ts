import type { PruebaTestChoice } from '@/components/prueba-test-engine'

export interface ParsedPruebaTestEngineScript {
  textSource: string
  choicesTriggerStep: number
  choices: PruebaTestChoice[]
  correctOutcomeTextSource: string
  incorrectOutcomeTextSource: string
}

function stripBackToNormal(fragment: string): string {
  return fragment.replace(/\bBACK\s+TO\s+NORMAL\s+PATH\b/gi, '').trim()
}

function stripStartTest(fragment: string): { body: string; hasStart: boolean } {
  const hasStart = /\bSTART\s+TEST\b/i.test(fragment)
  const body = fragment.replace(/\bSTART\s+TEST\b/gi, '').trim()
  return { body, hasStart }
}

/**
 * Convierte un guion con la sintaxis documentada en `.cursor/rules/prueba-test-engine.mdc`
 * en props listas para `PruebaTestEngine`.
 */
export function parsePruebaTestEngineScript(source: string): ParsedPruebaTestEngineScript {
  const lines = source
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const mainSteps = new Map<number, string>()
  const qBySlot = new Map<number, { slot: number; correct: boolean; label: string; parent: number }>()
  let testStep: number | null = null

  const wrongBranches = new Map<number, { parent: number; body: string }>()
  const rightBranches = new Map<number, { parent: number; body: string }>()

  for (const line of lines) {
    const qMatch = line.match(
      /^Q(\d+)\.(\d+)\.?\s+(CORRECTO|CORRECT|INCORRECTO|INCORRECT)\s+"([^"]*)"\s*$/i
    )
    if (qMatch) {
      const parent = Number(qMatch[1])
      const slot = Number(qMatch[2])
      const flag = qMatch[3].toUpperCase()
      const correct = flag === 'CORRECT' || flag === 'CORRECTO'
      const label = qMatch[4]
      qBySlot.set(slot, { slot, correct, label, parent })
      continue
    }

    const wrongMatch = line.match(/^(\d+)\.0\.(\d+)\.\s+(.+)$/)
    if (wrongMatch) {
      const parent = Number(wrongMatch[1])
      const sub = Number(wrongMatch[2])
      wrongBranches.set(sub, { parent, body: stripBackToNormal(wrongMatch[3]) })
      continue
    }

    const rightMatch = line.match(/^(\d+)\.1\.(\d+)\.\s+(.+)$/)
    if (rightMatch) {
      const parent = Number(rightMatch[1])
      const sub = Number(rightMatch[2])
      rightBranches.set(sub, { parent, body: stripBackToNormal(rightMatch[3]) })
      continue
    }

    const mainMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (mainMatch) {
      const step = Number(mainMatch[1])
      const { body, hasStart } = stripStartTest(mainMatch[2].trim())
      if (hasStart) {
        if (testStep !== null && testStep !== step) {
          throw new Error(
            `Solo un bloque de test por guion: ya era paso ${testStep}, línea: ${line}`
          )
        }
        testStep = step
      }
      mainSteps.set(step, body)
      continue
    }

    throw new Error(`Línea no reconocida en guion de test engine: ${line}`)
  }

  if (testStep === null) throw new Error('Falta START TEST en una línea del camino normal (p. ej. 3. "..." START TEST)')

  for (const row of qBySlot.values()) {
    if (row.parent !== testStep) {
      throw new Error(
        `Opción Q${row.parent}.${row.slot}. no coincide con el paso del test (${testStep}): revise START TEST y líneas Q`
      )
    }
  }

  for (const [sub, row] of wrongBranches) {
    if (row.parent !== testStep) {
      throw new Error(
        `Rama incorrecta ${row.parent}.0.${sub}. debe usar el mismo paso que START TEST (${testStep})`
      )
    }
  }
  for (const [sub, row] of rightBranches) {
    if (row.parent !== testStep) {
      throw new Error(
        `Rama correcta ${row.parent}.1.${sub}. debe usar el mismo paso que START TEST (${testStep})`
      )
    }
  }

  const sortedMain = [...mainSteps.keys()].sort((a, b) => a - b)
  const mainTextSource = sortedMain
    .map(n => `${n}. ${mainSteps.get(n) ?? ''}`)
    .join('\n')

  const qSlots = [...qBySlot.keys()].sort((a, b) => a - b)
  if (!qSlots.length) throw new Error(`No hay líneas Q${testStep}.n. para las opciones`)

  const choices: PruebaTestChoice[] = qSlots.map(slot => {
    const row = qBySlot.get(slot)
    if (!row) throw new Error(`Falta Q${testStep}.${slot}.`)
    return { label: row.label, isCorrect: row.correct }
  })

  const correctCount = choices.filter(c => c.isCorrect).length
  if (correctCount !== 1) {
    throw new Error(
      `Debe haber exactamente una opción CORRECT en Q${testStep}.* (encontradas: ${correctCount})`
    )
  }

  const incorrectOutcomeTextSource = buildOutcomeSource(wrongBranches)
  const correctOutcomeTextSource = buildOutcomeSource(rightBranches)

  return {
    textSource: mainTextSource,
    choicesTriggerStep: testStep,
    choices,
    correctOutcomeTextSource,
    incorrectOutcomeTextSource,
  }
}

function buildOutcomeSource(bySubStep: Map<number, { parent: number; body: string }>): string {
  const keys = [...bySubStep.keys()].sort((a, b) => a - b)
  if (!keys.length) return ''
  return keys
    .map((sub, i) => {
      const row = bySubStep.get(sub)
      const body = row?.body ?? ''
      return `${i + 1}. ${body}`
    })
    .join('\n')
}
