import { getDb, initDb } from '@/lib/db/database'
import { tryCompleteMisionAfterClase } from '@/lib/misiones/misiones-repo'

const ACTIVE_USER_ID = 1
const ESTADO_NO_COMPLETADO = 1
const ESTADO_COMPLETADO = 2

export interface ModuloProgress {
  moduloId: number
  estadoId: number
}

export interface ClaseProgress {
  claseId: number
  moduloId: number
  puntajeDadoClase: number
  estadoId: number
}

export interface QuizProgress {
  quizId: number
  moduloId: number
  puntajeDadoQuiz: number
  estadoId: number
}

export async function getFirstAvailableModuloId() {
  await initDb()
  const db = await getDb()

  const row = await db.getFirstAsync<{ ModuloID: number }>(
    'SELECT ModuloID FROM UsuarioModulo WHERE UsuarioID = ? AND EstadoID = ? ORDER BY ModuloID ASC LIMIT 1;',
    [ACTIVE_USER_ID, ESTADO_NO_COMPLETADO]
  )

  return row?.ModuloID ?? null
}

export async function getModuloProgressById({ moduloId }: { moduloId: number }) {
  await initDb()
  const db = await getDb()

  const row = await db.getFirstAsync<{ ModuloID: number; EstadoID: number }>(
    'SELECT ModuloID, EstadoID FROM UsuarioModulo WHERE UsuarioID = ? AND ModuloID = ? LIMIT 1;',
    [ACTIVE_USER_ID, moduloId]
  )

  if (!row) return null
  return { moduloId: row.ModuloID, estadoId: row.EstadoID } satisfies ModuloProgress
}

export async function getModuloClasesProgress({ moduloId }: { moduloId: number }) {
  await initDb()
  const db = await getDb()

  const rows = await db.getAllAsync<{
    ClaseID: number
    ModuloID: number
    PuntajeDadoClase: number
    EstadoID: number
  }>(
    `SELECT c.ClaseID, c.ModuloID, c.PuntajeDadoClase, uc.EstadoID
     FROM Clase c
     JOIN UsuarioClase uc ON uc.ClaseID = c.ClaseID
     WHERE uc.UsuarioID = ? AND c.ModuloID = ?
     ORDER BY c.ClaseID ASC;`,
    [ACTIVE_USER_ID, moduloId]
  )

  return rows.map(row => ({
    claseId: row.ClaseID,
    moduloId: row.ModuloID,
    puntajeDadoClase: row.PuntajeDadoClase,
    estadoId: row.EstadoID,
  })) satisfies ClaseProgress[]
}

export async function getModuloQuizzesProgress({ moduloId }: { moduloId: number }) {
  await initDb()
  const db = await getDb()

  const rows = await db.getAllAsync<{
    QuizID: number
    ModuloID: number
    PuntajeDadoQuiz: number
    EstadoID: number
  }>(
    `SELECT q.QuizID, q.ModuloID, q.PuntajeDadoQuiz, uq.EstadoID
     FROM Quiz q
     JOIN UsuarioQuiz uq ON uq.QuizID = q.QuizID
     WHERE uq.UsuarioID = ? AND q.ModuloID = ?
     ORDER BY q.QuizID ASC;`,
    [ACTIVE_USER_ID, moduloId]
  )

  return rows.map(row => ({
    quizId: row.QuizID,
    moduloId: row.ModuloID,
    puntajeDadoQuiz: row.PuntajeDadoQuiz,
    estadoId: row.EstadoID,
  })) satisfies QuizProgress[]
}

export async function completeClaseForActiveUser({ claseId }: { claseId: number }) {
  await initDb()
  const db = await getDb()

  const claseRow = await db.getFirstAsync<{ PuntajeDadoClase: number; ModuloID: number }>(
    'SELECT PuntajeDadoClase, ModuloID FROM Clase WHERE ClaseID = ? LIMIT 1;',
    [claseId]
  )
  if (!claseRow) throw new Error(`No existe la clase ${claseId}.`)

  const userClaseRow = await db.getFirstAsync<{ EstadoID: number }>(
    'SELECT EstadoID FROM UsuarioClase WHERE UsuarioID = ? AND ClaseID = ? LIMIT 1;',
    [ACTIVE_USER_ID, claseId]
  )
  if (!userClaseRow) {
    throw new Error(`No existe progreso de UsuarioClase para usuario ${ACTIVE_USER_ID} y clase ${claseId}.`)
  }

  const puntajeDadoClase = claseRow.PuntajeDadoClase
  const moduloId = claseRow.ModuloID
  const wasAlreadyCompleted = userClaseRow.EstadoID === ESTADO_COMPLETADO
  const userModuloRow = await db.getFirstAsync<{ EstadoID: number }>(
    'SELECT EstadoID FROM UsuarioModulo WHERE UsuarioID = ? AND ModuloID = ? LIMIT 1;',
    [ACTIVE_USER_ID, moduloId]
  )
  if (!userModuloRow) {
    throw new Error(`No existe progreso de UsuarioModulo para usuario ${ACTIVE_USER_ID} y modulo ${moduloId}.`)
  }

  const moduloWasCompleted = userModuloRow.EstadoID === ESTADO_COMPLETADO
  if (!wasAlreadyCompleted) {
    await db.runAsync('UPDATE Usuario SET Puntaje = Puntaje + ? WHERE UsuarioID = ?;', [
      puntajeDadoClase,
      ACTIVE_USER_ID,
    ])
    await db.runAsync('UPDATE UsuarioClase SET EstadoID = ? WHERE UsuarioID = ? AND ClaseID = ?;', [
      ESTADO_COMPLETADO,
      ACTIVE_USER_ID,
      claseId,
    ])
  }

  const pendingClasesRow = await db.getFirstAsync<{ pending_count: number }>(
    `SELECT COUNT(*) AS pending_count
     FROM UsuarioClase uc
     JOIN Clase c ON c.ClaseID = uc.ClaseID
     WHERE uc.UsuarioID = ? AND c.ModuloID = ? AND uc.EstadoID != ?;`,
    [ACTIVE_USER_ID, moduloId, ESTADO_COMPLETADO]
  )
  const pendingQuizzesRow = await db.getFirstAsync<{ pending_count: number }>(
    `SELECT COUNT(*) AS pending_count
     FROM UsuarioQuiz uq
     JOIN Quiz q ON q.QuizID = uq.QuizID
     WHERE uq.UsuarioID = ? AND q.ModuloID = ? AND uq.EstadoID != ?;`,
    [ACTIVE_USER_ID, moduloId, ESTADO_COMPLETADO]
  )

  const pendingClases = pendingClasesRow?.pending_count ?? 0
  const pendingQuizzes = pendingQuizzesRow?.pending_count ?? 0
  const moduloIsNowCompleted = pendingClases === 0 && pendingQuizzes === 0
  let moduloChangedToCompleted = false
  if (moduloIsNowCompleted) {
    if (!moduloWasCompleted) {
      await db.runAsync('UPDATE UsuarioModulo SET EstadoID = ? WHERE UsuarioID = ? AND ModuloID = ?;', [
        ESTADO_COMPLETADO,
        ACTIVE_USER_ID,
        moduloId,
      ])
      moduloChangedToCompleted = true
    }
  }

  await tryCompleteMisionAfterClase({ claseId })

  return {
    puntajeDadoClase,
    wasAlreadyCompleted,
    moduloId,
    moduloIsNowCompleted,
    moduloChangedToCompleted,
  }
}

export async function completeQuizForActiveUser({
  quizId,
  resultado,
}: {
  quizId: number
  resultado: number
}) {
  await initDb()
  const db = await getDb()

  const quizRow = await db.getFirstAsync<{ PuntajeDadoQuiz: number; ModuloID: number }>(
    'SELECT PuntajeDadoQuiz, ModuloID FROM Quiz WHERE QuizID = ? LIMIT 1;',
    [quizId]
  )
  if (!quizRow) throw new Error(`No existe el quiz ${quizId}.`)

  const userQuizRow = await db.getFirstAsync<{ EstadoID: number }>(
    'SELECT EstadoID FROM UsuarioQuiz WHERE UsuarioID = ? AND QuizID = ? LIMIT 1;',
    [ACTIVE_USER_ID, quizId]
  )
  if (!userQuizRow) {
    throw new Error(`No existe progreso de UsuarioQuiz para usuario ${ACTIVE_USER_ID} y quiz ${quizId}.`)
  }

  const puntajeDadoQuiz = quizRow.PuntajeDadoQuiz
  const moduloId = quizRow.ModuloID
  const wasAlreadyCompleted = userQuizRow.EstadoID === ESTADO_COMPLETADO
  const userModuloRow = await db.getFirstAsync<{ EstadoID: number }>(
    'SELECT EstadoID FROM UsuarioModulo WHERE UsuarioID = ? AND ModuloID = ? LIMIT 1;',
    [ACTIVE_USER_ID, moduloId]
  )
  if (!userModuloRow) {
    throw new Error(`No existe progreso de UsuarioModulo para usuario ${ACTIVE_USER_ID} y modulo ${moduloId}.`)
  }

  const moduloWasCompleted = userModuloRow.EstadoID === ESTADO_COMPLETADO
  if (!wasAlreadyCompleted) {
    await db.runAsync('UPDATE Usuario SET Puntaje = Puntaje + ? WHERE UsuarioID = ?;', [
      puntajeDadoQuiz,
      ACTIVE_USER_ID,
    ])
  }
  await db.runAsync('UPDATE UsuarioQuiz SET EstadoID = ?, Resultado = ? WHERE UsuarioID = ? AND QuizID = ?;', [
    ESTADO_COMPLETADO,
    resultado,
    ACTIVE_USER_ID,
    quizId,
  ])

  const pendingClasesRow = await db.getFirstAsync<{ pending_count: number }>(
    `SELECT COUNT(*) AS pending_count
     FROM UsuarioClase uc
     JOIN Clase c ON c.ClaseID = uc.ClaseID
     WHERE uc.UsuarioID = ? AND c.ModuloID = ? AND uc.EstadoID != ?;`,
    [ACTIVE_USER_ID, moduloId, ESTADO_COMPLETADO]
  )
  const pendingQuizzesRow = await db.getFirstAsync<{ pending_count: number }>(
    `SELECT COUNT(*) AS pending_count
     FROM UsuarioQuiz uq
     JOIN Quiz q ON q.QuizID = uq.QuizID
     WHERE uq.UsuarioID = ? AND q.ModuloID = ? AND uq.EstadoID != ?;`,
    [ACTIVE_USER_ID, moduloId, ESTADO_COMPLETADO]
  )

  const pendingClases = pendingClasesRow?.pending_count ?? 0
  const pendingQuizzes = pendingQuizzesRow?.pending_count ?? 0
  const moduloIsNowCompleted = pendingClases === 0 && pendingQuizzes === 0
  let moduloChangedToCompleted = false
  if (moduloIsNowCompleted && !moduloWasCompleted) {
    await db.runAsync('UPDATE UsuarioModulo SET EstadoID = ? WHERE UsuarioID = ? AND ModuloID = ?;', [
      ESTADO_COMPLETADO,
      ACTIVE_USER_ID,
      moduloId,
    ])
    moduloChangedToCompleted = true
  }

  return {
    puntajeDadoQuiz,
    wasAlreadyCompleted,
    moduloId,
    moduloIsNowCompleted,
    moduloChangedToCompleted,
  }
}

export function isModuloUnlocked({
  moduloId,
  firstPendingModuloId,
}: {
  moduloId: number
  firstPendingModuloId: number | null
}) {
  if (moduloId === 0) return true
  if (firstPendingModuloId === null) return true
  return moduloId <= firstPendingModuloId
}

export function isClaseUnlocked({
  claseId,
  firstPendingClaseId,
}: {
  claseId: number
  firstPendingClaseId: number | null
}) {
  if (claseId === 0) return true
  if (firstPendingClaseId === null) return true
  return claseId <= firstPendingClaseId
}

export function isCompleted({ estadoId }: { estadoId: number }) {
  return estadoId === ESTADO_COMPLETADO
}

export function isNotCompleted({ estadoId }: { estadoId: number }) {
  return estadoId === ESTADO_NO_COMPLETADO
}
