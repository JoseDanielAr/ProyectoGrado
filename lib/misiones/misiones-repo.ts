import { CONTENT_MODULE_IDS, getClaseCatalogEntry, getModuloCatalogEntry } from '@/lib/catalog/content-catalog'
import { getDb, initDb } from '@/lib/db/database'

const ACTIVE_USER_ID = 1
const ESTADO_COMPLETADO = 2

export const MISION_PUNTAJE = 100

export type MisionTipo = 'complete_class' | 'repaso' | 'review_class'

export interface DailyMisionState {
  dia: string | null
  tipo: MisionTipo | null
  completada: boolean
  claseId: number | null
  description: string
  puntajeReward: number
}

interface UsuarioMisionRow {
  Dia: string | null
  MisionTipo: string | null
  MisionCompletada: number
  MisionClaseId: number | null
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getYesterdayDateKey(date = new Date()) {
  const yesterday = new Date(date)
  yesterday.setDate(yesterday.getDate() - 1)
  return getLocalDateKey(yesterday)
}

/** Comprueba el dia, la racha y genera la mision. Llamar al entrar al menu principal. */
export async function syncDailyMision() {
  await initDb()
  const today = getLocalDateKey()
  const current = await getUsuarioMisionRow()

  if (!current.Dia) {
    await saveNewDailyMision({ today })
    return
  }

  if (current.Dia === today) {
    if (!current.MisionTipo) await saveNewDailyMision({ today })
    return
  }

  const yesterday = getYesterdayDateKey()
  const keptStreak =
    current.Dia === yesterday && current.MisionCompletada === 1

  if (!keptStreak) await resetRacha()

  await saveNewDailyMision({ today })
}

export async function readDailyMisionState() {
  const row = await getUsuarioMisionRow()
  return buildDailyMisionState(row)
}

export async function isTodayMissionCompleted() {
  const row = await getUsuarioMisionRow()
  const today = getLocalDateKey()
  return row.Dia === today && row.MisionCompletada === 1
}

function buildDailyMisionState(row: UsuarioMisionRow): DailyMisionState {
  return {
    dia: row.Dia,
    tipo: parseMisionTipo(row.MisionTipo),
    completada: row.MisionCompletada === 1,
    claseId: row.MisionClaseId,
    description: buildMisionDescription({
      tipo: parseMisionTipo(row.MisionTipo),
      claseId: row.MisionClaseId,
    }),
    puntajeReward: MISION_PUNTAJE,
  }
}

export async function tryCompleteMisionAfterClase({ claseId }: { claseId: number }) {
  const row = await getUsuarioMisionRow()
  if (row.MisionCompletada === 1) return

  const tipo = parseMisionTipo(row.MisionTipo)
  if (!tipo) return

  if (tipo === 'complete_class') {
    await markMisionCompletada()
    return
  }

  if (tipo === 'review_class' && row.MisionClaseId === claseId) await markMisionCompletada()
}

export async function tryCompleteMisionAfterRepasoQuestions() {
  const row = await getUsuarioMisionRow()
  if (row.MisionCompletada === 1) return
  if (parseMisionTipo(row.MisionTipo) !== 'repaso') return
  await markMisionCompletada()
}

export async function shouldUseRepasoQuestionGoal() {
  const row = await getUsuarioMisionRow()
  if (row.MisionCompletada === 1) return false
  return parseMisionTipo(row.MisionTipo) === 'repaso'
}

async function saveNewDailyMision({ today }: { today: string }) {
  const tipo = await pickMisionTipo()
  const claseId = tipo === 'review_class' ? await pickRandomCompletedClaseId() : null

  if (tipo === 'review_class' && claseId === null) {
    await persistDailyMision({
      today,
      tipo: 'repaso',
      completada: 0,
      claseId: null,
    })
    return
  }

  await persistDailyMision({
    today,
    tipo,
    completada: 0,
    claseId,
  })
}

async function pickMisionTipo(): Promise<MisionTipo> {
  const tier = await getMissionProgressTier()

  if (tier === 'none') return 'complete_class'
  if (tier === 'partial') return Math.random() < 0.5 ? 'complete_class' : 'repaso'
  return Math.random() < 0.5 ? 'review_class' : 'repaso'
}

async function getMissionProgressTier() {
  const completedCount = await getCompletedContentModuleCount()
  if (completedCount === 0) return 'none' as const
  if (completedCount >= CONTENT_MODULE_IDS.length) return 'all' as const
  return 'partial' as const
}

async function getCompletedContentModuleCount() {
  await initDb()
  const db = await getDb()

  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM UsuarioModulo
     WHERE UsuarioID = ?
       AND ModuloID IN (${CONTENT_MODULE_IDS.join(',')})
       AND EstadoID = ?;`,
    [ACTIVE_USER_ID, ESTADO_COMPLETADO]
  )

  return row?.count ?? 0
}

async function pickRandomCompletedClaseId() {
  await initDb()
  const db = await getDb()

  const rows = await db.getAllAsync<{ ClaseID: number }>(
    'SELECT ClaseID FROM UsuarioClase WHERE UsuarioID = ? AND EstadoID = ? ORDER BY ClaseID ASC;',
    [ACTIVE_USER_ID, ESTADO_COMPLETADO]
  )

  if (!rows.length) return null

  const index = Math.floor(Math.random() * rows.length)
  return rows[index]?.ClaseID ?? null
}

async function markMisionCompletada() {
  await initDb()
  const db = await getDb()

  const row = await db.getFirstAsync<{ MisionCompletada: number }>(
    'SELECT MisionCompletada FROM Usuario WHERE UsuarioID = ? LIMIT 1;',
    [ACTIVE_USER_ID]
  )
  if (!row || row.MisionCompletada === 1) return

  await db.runAsync(
    `UPDATE Usuario
     SET MisionCompletada = 1,
         Puntaje = Puntaje + ?,
         Racha = Racha + 1
     WHERE UsuarioID = ?;`,
    [MISION_PUNTAJE, ACTIVE_USER_ID]
  )
}

async function resetRacha() {
  await initDb()
  const db = await getDb()
  await db.runAsync('UPDATE Usuario SET Racha = 0 WHERE UsuarioID = ?;', [ACTIVE_USER_ID])
}

async function persistDailyMision({
  today,
  tipo,
  completada,
  claseId,
}: {
  today: string
  tipo: MisionTipo
  completada: number
  claseId: number | null
}) {
  await initDb()
  const db = await getDb()

  await db.runAsync(
    `UPDATE Usuario
     SET Dia = ?, MisionTipo = ?, MisionCompletada = ?, MisionClaseId = ?
     WHERE UsuarioID = ?;`,
    [today, tipo, completada, claseId, ACTIVE_USER_ID]
  )
}

async function getUsuarioMisionRow() {
  await initDb()
  const db = await getDb()

  return await db.getFirstAsync<UsuarioMisionRow>(
    'SELECT Dia, MisionTipo, MisionCompletada, MisionClaseId FROM Usuario WHERE UsuarioID = ? LIMIT 1;',
    [ACTIVE_USER_ID]
  ).then(row => row ?? { Dia: null, MisionTipo: null, MisionCompletada: 0, MisionClaseId: null })
}

function parseMisionTipo(value: string | null): MisionTipo | null {
  if (value === 'complete_class' || value === 'repaso' || value === 'review_class') return value
  return null
}

function buildMisionDescription({
  tipo,
  claseId,
}: {
  tipo: MisionTipo | null
  claseId: number | null
}) {
  if (!tipo) return 'No hay mision disponible por ahora.'

  if (tipo === 'complete_class') return 'Completa una clase de cualquier modulo.'
  if (tipo === 'repaso') return 'Ve a Repaso y responde 10 preguntas.'

  const clase = claseId === null ? null : getClaseCatalogEntry({ claseId })
  if (!clase) return 'Vuelve a ver una clase que ya hayas completado.'

  const modulo = getModuloCatalogEntry({ moduloId: clase.moduloId })
  const moduloTitle = modulo?.title ?? 'Modulo'

  return `Vuelve a ver la clase "${clase.title}" del modulo "${moduloTitle}"`
}
