import type { QuizBoundingQuestion, QuizTestQuestion } from '@/components/quiz-conjunto-engine'

export type ParsedQuizQuestion = QuizTestQuestion | ParsedQuizBoundingQuestion

export type ParsedQuizBoundingQuestion = Omit<QuizBoundingQuestion, 'imageSource'>

interface TestAccumulator {
  kind: 'test'
  id: number
  prompt: string
  choices: Array<{ label: string; isCorrect: boolean }>
}

interface BoundingAccumulator {
  kind: 'bounding-box'
  id: number
  prompt: string
  imageKey: string
  imageSizePx: { width: number; height: number }
  boundingBoxPixels: { minX: number; maxX: number; minY: number; maxY: number }
}

type QuestionAccumulator = TestAccumulator | BoundingAccumulator

/**
 * Parser para scripts de quiz con formato:
 * START TEST
 * QUESTION 1 - TEST ENGINE | BOUNDING BOX ENGINE
 * ...
 * END
 */
export function parseQuizConjuntoScript(source: string): ParsedQuizQuestion[] {
  const lines = source
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  if (!lines.length) throw new Error('El script del quiz está vacío.')
  if (!/^START\s+TEST$/i.test(lines[0])) throw new Error('El script debe iniciar con "START TEST".')
  if (!/^END$/i.test(lines[lines.length - 1])) throw new Error('El script debe finalizar con "END".')

  const questions = new Map<number, QuestionAccumulator>()
  let currentQuestionId: number | null = null

  for (const line of lines.slice(1, -1)) {
    const testQuestionMatch = line.match(/^QUESTION\s+(\d+)\s*-\s*TEST\s+ENGINE$/i)
    if (testQuestionMatch) {
      currentQuestionId = Number(testQuestionMatch[1])
      if (!questions.has(currentQuestionId)) {
        questions.set(currentQuestionId, {
          kind: 'test',
          id: currentQuestionId,
          prompt: '',
          choices: [],
        })
      }
      continue
    }

    const bboxQuestionMatch = line.match(/^QUESTION\s+(\d+)\s*-\s*BOUNDING\s*BOX\s*ENGINE$/i)
    if (bboxQuestionMatch) {
      currentQuestionId = Number(bboxQuestionMatch[1])
      if (!questions.has(currentQuestionId)) {
        questions.set(currentQuestionId, {
          kind: 'bounding-box',
          id: currentQuestionId,
          prompt: '',
          imageKey: '',
          imageSizePx: { width: 0, height: 0 },
          boundingBoxPixels: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
        })
      }
      continue
    }

    const promptMatch = line.match(/^1\.\s*"([^"]*)"(?:\s+START\s+TEST)?$/i)
    if (promptMatch) {
      if (currentQuestionId === null) throw new Error(`Texto principal sin QUESTION asociado: ${line}`)
      const row = questions.get(currentQuestionId)
      if (!row) throw new Error(`No existe acumulador para QUESTION ${currentQuestionId}.`)
      row.prompt = promptMatch[1]
      continue
    }

    const imageMatch = line.match(/^Image:\s*@?(.+)$/i)
    if (imageMatch) {
      if (currentQuestionId === null) throw new Error(`Image sin QUESTION asociado: ${line}`)
      const row = questions.get(currentQuestionId)
      if (!row || row.kind !== 'bounding-box') throw new Error(`Image en QUESTION ${currentQuestionId} que no es bounding box.`)
      row.imageKey = imageMatch[1].trim()
      continue
    }

    const edgesMatch = line.match(/^Bounding\s+box\s+edges:\s*(.+)$/i)
    if (edgesMatch) {
      if (currentQuestionId === null) throw new Error(`Bounding box edges sin QUESTION: ${line}`)
      const row = questions.get(currentQuestionId)
      if (!row || row.kind !== 'bounding-box') throw new Error(`Bounding box edges en QUESTION ${currentQuestionId} inválida.`)
      row.boundingBoxPixels = parseBoundingBoxEdges(edgesMatch[1])
      continue
    }

    const sizeMatch = line.match(/^Image\s+size:\s*(\d+)\s*x\s*(\d+)$/i)
    if (sizeMatch) {
      if (currentQuestionId === null) throw new Error(`Image size sin QUESTION: ${line}`)
      const row = questions.get(currentQuestionId)
      if (!row || row.kind !== 'bounding-box') throw new Error(`Image size en QUESTION ${currentQuestionId} inválida.`)
      row.imageSizePx = { width: Number(sizeMatch[1]), height: Number(sizeMatch[2]) }
      continue
    }

    const choiceMatch = line.match(/^Q(\d+)\.(\d+)\.?\s+(CORRECT|CORRECTO|INCORRECT|INCORRECTO)\s+"([^"]*)"$/i)
    if (choiceMatch) {
      const questionId = Number(choiceMatch[1])
      const tag = choiceMatch[3].toUpperCase()
      const isCorrect = tag === 'CORRECT' || tag === 'CORRECTO'
      const label = choiceMatch[4]
      const row = questions.get(questionId)
      if (!row || row.kind !== 'test') throw new Error(`La línea ${line} apunta a QUESTION ${questionId} no válida para opciones.`)
      row.choices.push({ label, isCorrect })
      continue
    }

    throw new Error(`Línea no reconocida en script de quiz: ${line}`)
  }

  const ordered = [...questions.values()].sort((a, b) => a.id - b.id)
  if (ordered.length !== 10) {
    throw new Error(`Un quiz debe tener exactamente 10 preguntas. Detectadas: ${ordered.length}.`)
  }

  return ordered.map(question => {
    if (!question.prompt) throw new Error(`QUESTION ${question.id} no tiene prompt principal.`)

    if (question.kind === 'bounding-box') {
      if (!question.imageKey) throw new Error(`QUESTION ${question.id} bounding box requiere Image.`)
      if (!question.imageSizePx.width || !question.imageSizePx.height) {
        throw new Error(`QUESTION ${question.id} bounding box requiere Image size.`)
      }
      if (question.boundingBoxPixels.maxX <= question.boundingBoxPixels.minX) {
        throw new Error(`QUESTION ${question.id} bounding box edges inválidos.`)
      }

      return {
        kind: 'bounding-box',
        id: question.id,
        prompt: question.prompt,
        imageKey: question.imageKey,
        imageSizePx: question.imageSizePx,
        boundingBoxPixels: question.boundingBoxPixels,
      } satisfies ParsedQuizBoundingQuestion
    }

    if (question.choices.length < 2) throw new Error(`QUESTION ${question.id} debe tener al menos 2 opciones.`)

    const correctCount = question.choices.filter(choice => choice.isCorrect).length
    if (correctCount !== 1) {
      throw new Error(`QUESTION ${question.id} debe tener exactamente una opción correcta.`)
    }

    return {
      kind: 'test',
      id: question.id,
      prompt: question.prompt,
      choices: question.choices,
    } satisfies QuizTestQuestion
  })
}

function parseBoundingBoxEdges(raw: string) {
  const pairs = [...raw.matchAll(/(\d+)\s*x\s*(\d+)/gi)]
  if (pairs.length < 4) throw new Error(`Bounding box edges requiere 4 puntos (x,y). Recibido: ${raw}`)

  const xs = pairs.map(match => Number(match[1]))
  const ys = pairs.map(match => Number(match[2]))

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}
