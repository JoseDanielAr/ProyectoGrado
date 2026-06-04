import { QUIZ_SCRIPT as QUIZ_SCRIPT_1 } from '@/app/modulos/la-diabetes-quiz-1'
import { QUIZ_SCRIPT as QUIZ_SCRIPT_2 } from '@/app/modulos/la-insulinoterapia-quiz-2'
import { QUIZ_SCRIPT as QUIZ_SCRIPT_3 } from '@/app/modulos/modulo-3-quiz-3'
import { getDb, initDb } from '@/lib/db/database'
import { parseQuizConjuntoScript } from '@/lib/parse-quiz-conjunto-script'

const ACTIVE_USER_ID = 1
const ESTADO_COMPLETADO = 2

const QUIZ_SCRIPTS_BY_ID: Record<number, string> = {
  1: QUIZ_SCRIPT_1,
  2: QUIZ_SCRIPT_2,
  3: QUIZ_SCRIPT_3,
}

export interface RepasoQuestion {
  key: string
  quizId: number
  questionId: number
  prompt: string
  choices: Array<{ label: string; isCorrect: boolean }>
}

export async function hasCompletedAnyModulo() {
  await initDb()
  const db = await getDb()

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM UsuarioModulo WHERE UsuarioID = ? AND EstadoID = ?;',
    [ACTIVE_USER_ID, ESTADO_COMPLETADO]
  )

  return (row?.count ?? 0) > 0
}

export async function getCompletedQuizIds() {
  await initDb()
  const db = await getDb()

  const rows = await db.getAllAsync<{ QuizID: number }>(
    'SELECT QuizID FROM UsuarioQuiz WHERE UsuarioID = ? AND EstadoID = ? ORDER BY QuizID ASC;',
    [ACTIVE_USER_ID, ESTADO_COMPLETADO]
  )

  return rows.map(row => row.QuizID)
}

function buildQuestionsFromScript({ quizId, script }: { quizId: number; script: string }) {
  const parsed = parseQuizConjuntoScript(script)

  return parsed
    .filter(question => question.kind === 'test')
    .map(question => ({
      key: `q${quizId}-${question.id}`,
      quizId,
      questionId: question.id,
      prompt: question.prompt,
      choices: question.choices.map(choice => ({ ...choice })),
    })) satisfies RepasoQuestion[]
}

export async function getRepasoQuestionPool() {
  const completedQuizIds = await getCompletedQuizIds()

  return completedQuizIds.flatMap(quizId => {
    const script = QUIZ_SCRIPTS_BY_ID[quizId]
    if (!script) return []
    return buildQuestionsFromScript({ quizId, script })
  })
}
